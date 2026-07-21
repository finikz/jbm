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

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  note: z.string().optional(),
});

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${ts}-${rand}`;
}

// 创建销售单（同时扣减 Keg 库存）
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const { items, note } = parsed.data;

  // 查询啤酒价格
  const beerIds = [...new Set(items.map((i) => i.beerId))];
  const beers = await prisma.beer.findMany({ where: { id: { in: beerIds } } });
  const beerMap = new Map(beers.map((b) => [b.id, b]));

  // 验证
  for (const item of items) {
    if (!beerMap.has(item.beerId)) {
      return sendError(res, `啤酒 ${item.beerId} 不存在`, 404);
    }
  }

  // 计算订单项和总价
  const orderItems = items.map((item) => {
    const beer = beerMap.get(item.beerId)!;
    const volumeMl = CUP_SIZE_ML[item.cupSize as CupSize];
    const priceCents = item.cupSize === 'LARGE' ? beer.priceLarge : beer.priceMedium;
    const subtotalCents = priceCents * item.quantity;
    return {
      beerId: item.beerId,
      cupSize: item.cupSize,
      volumeMl,
      priceCents,
      quantity: item.quantity,
      subtotalCents,
      totalVolumeMl: volumeMl * item.quantity,
    };
  });

  const totalCents = orderItems.reduce((sum, i) => sum + i.subtotalCents, 0);

  // 扣减库存：按 Beer 查找有库存的 Keg（优先找挂载在龙头上的，其次找库存最多的）
  for (const item of orderItems) {
    const totalVolumeLitersNeeded = item.totalVolumeMl / 1000;

    // 优先从龙头上的 Keg 扣
    const tappedKegs = await prisma.keg.findMany({
      where: {
        beerId: item.beerId,
        isEmpty: false,
        tapId: { not: null },
      },
      orderBy: { volumeLiters: 'desc' },
    });

    const unmountedKegs = await prisma.keg.findMany({
      where: {
        beerId: item.beerId,
        isEmpty: false,
        tapId: null,
      },
      orderBy: { receivedAt: 'asc' },
    });

    const allKegs = [...tappedKegs, ...unmountedKegs];
    const availableLiters = allKegs.reduce((sum, k) => sum + k.volumeLiters, 0);

    if (availableLiters < totalVolumeLitersNeeded) {
      const beer = beerMap.get(item.beerId)!;
      return sendError(res, `${beer.name} 库存不足（需要 ${totalVolumeLitersNeeded}L，当前 ${availableLiters.toFixed(2)}L）`, 400);
    }

    // 逐个扣减
    let remaining = totalVolumeLitersNeeded;
    for (const keg of allKegs) {
      if (remaining <= 0) break;
      const deduct = Math.min(keg.volumeLiters, remaining);
      const newVolume = keg.volumeLiters - deduct;
      await prisma.keg.update({
        where: { id: keg.id },
        data: {
          volumeLiters: Math.round(newVolume * 1000) / 1000,
          isEmpty: newVolume <= 0.01,
        },
      });
      remaining -= deduct;
    }
  }

  // 创建订单
  const order = await prisma.saleOrder.create({
    data: {
      orderNo: generateOrderNo(),
      totalCents,
      note,
      items: {
        create: orderItems.map(({ totalVolumeMl, ...rest }) => rest),
      },
    },
    include: {
      items: { include: { beer: true } },
    },
  });

  return sendSuccess(res, {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }, 201);
}));

// 销售单列表
router.get('/', asyncHandler(async (req, res) => {
  const { limit, startDate, endDate } = req.query;
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as { gte?: Date }).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as { lte?: Date }).lte = new Date(endDate as string);
  }

  const orders = await prisma.saleOrder.findMany({
    where,
    include: { items: { include: { beer: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit as string) : 50,
  });

  const result = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return sendSuccess(res, result);
}));

// ============ 统计 ============

router.get('/stats', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const dayCount = days ? parseInt(days as string) : 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dayCount);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.saleOrder.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'COMPLETED',
    },
    include: { items: { include: { beer: true } } },
  });

  const totalRevenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const totalOrders = orders.length;
  const totalVolumeMl = orders.reduce((sum, o) =>
    sum + o.items.reduce((s, i) => s + i.volumeMl * i.quantity, 0), 0);

  // 热销啤酒
  const beerStats = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = beerStats.get(item.beerId) || { name: item.beer.name, quantity: 0, revenueCents: 0 };
      existing.quantity += item.quantity;
      existing.revenueCents += item.subtotalCents;
      beerStats.set(item.beerId, existing);
    }
  }
  const topBeers = Array.from(beerStats.entries())
    .map(([beerId, stats]) => ({ beerId, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 按天统计
  const byDayMap = new Map<string, { revenueCents: number; orders: number }>();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const existing = byDayMap.get(dateKey) || { revenueCents: 0, orders: 0 };
    existing.revenueCents += order.totalCents;
    existing.orders += 1;
    byDayMap.set(dateKey, existing);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return sendSuccess(res, {
    totalRevenueCents,
    totalOrders,
    totalVolumeMl,
    topBeers,
    byDay,
  });
}));

export default router;
