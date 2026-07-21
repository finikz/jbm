import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';

const router = Router();

router.use(authMiddleware);

const purchaseItemSchema = z.object({
  beerId: z.string().min(1),
  batchNo: z.string().min(1),
  volumeLiters: z.number().positive(),
  costCents: z.number().int().positive(),
});

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1),
  note: z.string().optional(),
});

// 进货单列表
router.get('/', asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  const orders = await prisma.purchaseOrder.findMany({
    where: status ? { status: status as string } : undefined,
    include: {
      supplier: true,
      items: { include: { beer: true, keg: true } },
    },
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

// 创建进货单（同时生成 Keg 批次）
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const { items, ...orderData } = parsed.data;
  const totalCostCents = items.reduce((sum, i) => sum + i.costCents, 0);

  const order = await prisma.purchaseOrder.create({
    data: {
      ...orderData,
      totalCostCents,
      status: 'RECEIVED',
      items: {
        create: items.map((item) => ({
          ...item,
          keg: {
            create: {
              beerId: item.beerId,
              batchNo: item.batchNo,
              volumeLiters: item.volumeLiters,
              initialVolumeLiters: item.volumeLiters,
              costCents: item.costCents,
              supplierId: orderData.supplierId || null,
            },
          },
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { beer: true, keg: true } },
    },
  });

  return sendSuccess(res, {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }, 201);
}));

export default router;
