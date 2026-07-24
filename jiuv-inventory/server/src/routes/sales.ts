import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';
import { CUP_SIZE_ML, CupSize } from 'shared';

const router = Router();
router.use(authMiddleware);

const saleItemSchema = z.object({
  beerId: z.string().min(1),
  cupSize: z.enum(['LARGE', 'MEDIUM']),
  quantity: z.number().int().min(1).max(99),
});
const saleSchema = z.object({ items: z.array(saleItemSchema).min(1), note: z.string().optional() });

function generateOrderNo(): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `ORD-${ts}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

// 库存扣减与订单创建必须在同一可串行化事务中完成，避免超卖和半成功订单。
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const { items, note } = parsed.data;
  const order = await prisma.$transaction(async (tx) => {
    const beerIds = [...new Set(items.map((i) => i.beerId))];
    const beers = await tx.beer.findMany({ where: { id: { in: beerIds }, isActive: true } });
    const beerMap = new Map(beers.map((b) => [b.id, b]));

    for (const item of items) {
      if (!beerMap.has(item.beerId)) {
        throw Object.assign(new Error(`啤酒 ${item.beerId} 不存在或已下架`), { statusCode: 404 });
      }
    }

    const orderItems = items.map((item) => {
      const beer = beerMap.get(item.beerId)!;
      const volumeMl = CUP_SIZE_ML[item.cupSize as CupSize];
      const priceCents = item.cupSize === 'LARGE' ? beer.priceLarge : beer.priceMedium;
      return { beerId: item.beerId, cupSize: item.cupSize, volumeMl, priceCents,
        quantity: item.quantity, subtotalCents: priceCents * item.quantity,
        totalVolumeMl: volumeMl * item.quantity };
    });

    for (const item of orderItems) {
      const needed = item.totalVolumeMl / 1000;
      const kegs = await tx.keg.findMany({
        where: { beerId: item.beerId, isEmpty: false },
        orderBy: [{ tapId: 'desc' }, { volumeLiters: 'desc' }, { receivedAt: 'asc' }],
      });
      const available = kegs.reduce((sum, keg) => sum + keg.volumeLiters, 0);
      if (available < needed) {
        const beer = beerMap.get(item.beerId)!;
        throw Object.assign(new Error(`${beer.name} 库存不足（需要 ${needed}L，当前 ${available.toFixed(2)}L）`), { statusCode: 400 });
      }

      let remaining = needed;
      for (const keg of kegs) {
        if (remaining <= 0) break;
        const newVolume = keg.volumeLiters - Math.min(keg.volumeLiters, remaining);
        await tx.keg.update({
          where: { id: keg.id },
          data: { volumeLiters: Math.round(newVolume * 1000) / 1000, isEmpty: newVolume <= 0.01 },
        });
        remaining -= Math.min(keg.volumeLiters, remaining);
      }
    }

    const totalCents = orderItems.reduce((sum, item) => sum + item.subtotalCents, 0);
    return tx.saleOrder.create({
      data: { orderNo: generateOrderNo(), totalCents, note,
        items: { create: orderItems.map(({ totalVolumeMl, ...rest }) => rest) } },
      include: { items: { include: { beer: true } } },
    });
  }, { isolationLevel: 'Serializable' });

  return sendSuccess(res, { ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString() }, 201);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { limit, startDate, endDate } = req.query;
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as { gte?: Date }).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as { lte?: Date }).lte = new Date(endDate as string);
  }
  const orders = await prisma.saleOrder.findMany({
    where, include: { items: { include: { beer: true } } }, orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit as string) : 50,
  });
  return sendSuccess(res, orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() })));
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const dayCount = days ? parseInt(days as string) : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dayCount);
  startDate.setHours(0, 0, 0, 0);
  const orders = await prisma.saleOrder.findMany({
    where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
    include: { items: { include: { beer: true } } },
  });
  const totalRevenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const totalOrders = orders.length;
  const totalVolumeMl = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.volumeMl * i.quantity, 0), 0);
  const beerStats = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const order of orders) for (const item of order.items) {
    const existing = beerStats.get(item.beerId) || { name: item.beer.name, quantity: 0, revenueCents: 0 };
    existing.quantity += item.quantity; existing.revenueCents += item.subtotalCents; beerStats.set(item.beerId, existing);
  }
  const topBeers = Array.from(beerStats.entries()).map(([beerId, stats]) => ({ beerId, ...stats })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const byDayMap = new Map<string, { revenueCents: number; orders: number }>();
  for (const order of orders) {
    const date = order.createdAt.toISOString().split('T')[0];
    const existing = byDayMap.get(date) || { revenueCents: 0, orders: 0 };
    existing.revenueCents += order.totalCents; existing.orders += 1; byDayMap.set(date, existing);
  }
  const byDay = Array.from(byDayMap.entries()).map(([date, stats]) => ({ date, ...stats })).sort((a, b) => a.date.localeCompare(b.date));
  return sendSuccess(res, { totalRevenueCents, totalOrders, totalVolumeMl, topBeers, byDay });
}));

export default router;
