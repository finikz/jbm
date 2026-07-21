import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';
import { LOW_STOCK_THRESHOLD_LITERS } from 'shared';

const router = Router();

router.use(authMiddleware);

// ============ Keg 批次 ============

const kegSchema = z.object({
  beerId: z.string().min(1),
  batchNo: z.string().min(1),
  volumeLiters: z.number().positive(),
  costCents: z.number().int().positive(),
  supplierId: z.string().optional(),
  tapId: z.number().int().min(1).max(11).optional(),
});

// Keg 列表（含库存预警）
router.get('/kegs', asyncHandler(async (req, res) => {
  const { lowStock } = req.query;
  const kegs = await prisma.keg.findMany({
    where: lowStock === 'true'
      ? { volumeLiters: { lte: LOW_STOCK_THRESHOLD_LITERS }, isEmpty: false }
      : { isEmpty: false },
    include: {
      beer: true,
      supplier: true,
    },
    orderBy: { receivedAt: 'desc' },
  });

  const result = kegs.map((k) => ({
    ...k,
    isLowStock: k.volumeLiters <= LOW_STOCK_THRESHOLD_LITERS,
    receivedAt: k.receivedAt.toISOString(),
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString(),
  }));

  return sendSuccess(res, result);
}));

// 创建 Keg（进货录入快捷方式）
router.post('/kegs', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = kegSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const { tapId, ...kegData } = parsed.data;

  // 如果指定了龙头，先检查龙头是否被占用
  if (tapId) {
    const existingTap = await prisma.tap.findUnique({
      where: { id: tapId },
      include: { keg: true },
    });
    if (existingTap?.kegId && existingTap.keg && !existingTap.keg.isEmpty) {
      return sendError(res, `龙头 ${tapId} 已被占用`, 409);
    }
  }

  const keg = await prisma.keg.create({
    data: {
      ...kegData,
      initialVolumeLiters: kegData.volumeLiters,
      tapId: tapId ?? null,
    },
    include: { beer: true },
  });

  // 激活龙头
  if (tapId) {
    await prisma.tap.update({
      where: { id: tapId },
      data: { kegId: keg.id, status: 'ACTIVE' },
    });
  }

  return sendSuccess(res, keg, 201);
}));

// 更换龙头挂载的 Keg
router.post('/taps/:tapId/mount', asyncHandler(async (req: AuthRequest, res) => {
  const tapId = parseInt(req.params.tapId);
  const { kegId } = req.body as { kegId: string };

  if (tapId < 1 || tapId > 11) return sendError(res, '龙头编号 1-11', 422);
  if (!kegId) return sendError(res, '缺少 kegId', 422);

  const keg = await prisma.keg.findUnique({ where: { id: kegId } });
  if (!keg) return sendError(res, 'Keg 不存在', 404);
  if (keg.isEmpty) return sendError(res, '该 Keg 已空', 400);

  // 检查目标龙头是否被占用
  const tap = await prisma.tap.findUnique({ where: { id: tapId }, include: { keg: true } });
  if (tap?.kegId && tap.keg && !tap.keg.isEmpty) {
    // 卸下旧 Keg
    await prisma.keg.update({
      where: { id: tap.kegId },
      data: { tapId: null },
    });
  }

  // 检查 Keg 是否已挂在其他龙头
  if (keg.tapId && keg.tapId !== tapId) {
    await prisma.tap.update({
      where: { id: keg.tapId },
      data: { kegId: null, status: 'INACTIVE' },
    });
  }

  // 挂载新 Keg
  await prisma.tap.update({
    where: { id: tapId },
    data: { kegId, status: 'ACTIVE' },
  });
  await prisma.keg.update({
    where: { id: kegId },
    data: { tapId },
  });

  const updatedTap = await prisma.tap.findUnique({
    where: { id: tapId },
    include: { keg: { include: { beer: true } } },
  });

  return sendSuccess(res, updatedTap);
}));

// 卸下龙头 Keg
router.post('/taps/:tapId/unmount', asyncHandler(async (req: AuthRequest, res) => {
  const tapId = parseInt(req.params.tapId);

  const tap = await prisma.tap.findUnique({ where: { id: tapId }, include: { keg: true } });
  if (!tap) return sendError(res, '龙头不存在', 404);
  if (!tap.kegId) return sendError(res, '该龙头未挂载 Keg', 400);

  await prisma.keg.update({
    where: { id: tap.kegId },
    data: { tapId: null },
  });
  await prisma.tap.update({
    where: { id: tapId },
    data: { kegId: null, status: 'INACTIVE' },
  });

  return sendSuccess(res, { tapId });
}));

// ============ 龙头列表 ============

router.get('/taps', asyncHandler(async (_req, res) => {
  const taps = await prisma.tap.findMany({
    orderBy: { id: 'asc' },
    include: {
      keg: {
        include: { beer: true },
      },
    },
  });

  const result = taps.map((t) => ({
    ...t,
    keg: t.keg ? {
      ...t.keg,
      isLowStock: t.keg.volumeLiters <= LOW_STOCK_THRESHOLD_LITERS,
      receivedAt: t.keg.receivedAt.toISOString(),
      createdAt: t.keg.createdAt.toISOString(),
      updatedAt: t.keg.updatedAt.toISOString(),
    } : null,
    updatedAt: t.updatedAt.toISOString(),
  }));

  return sendSuccess(res, result);
}));

// ============ 库存看板汇总 ============

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const [kegs, taps, lowStockKegs, totalBeers] = await Promise.all([
    prisma.keg.findMany({
      where: { isEmpty: false },
      include: { beer: true },
    }),
    prisma.tap.findMany({
      where: { status: 'ACTIVE' },
      include: { keg: { include: { beer: true } } },
    }),
    prisma.keg.count({
      where: { volumeLiters: { lte: LOW_STOCK_THRESHOLD_LITERS }, isEmpty: false },
    }),
    prisma.beer.count({ where: { isActive: true } }),
  ]);

  const totalVolumeLiters = kegs.reduce((sum, k) => sum + k.volumeLiters, 0);
  const totalValueCents = kegs.reduce((sum, k) => {
    const ratio = k.volumeLiters / k.initialVolumeLiters;
    return sum + Math.round(k.costCents * ratio);
  }, 0);

  return sendSuccess(res, {
    activeTaps: taps.length,
    totalKegs: kegs.length,
    lowStockKegs,
    totalBeers,
    totalVolumeLiters: Math.round(totalVolumeLiters * 100) / 100,
    totalValueCents,
  });
}));

export default router;
