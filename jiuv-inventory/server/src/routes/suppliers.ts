import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';

const router = Router();

router.use(authMiddleware);

const supplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// 列表
router.get('/', asyncHandler(async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { kegs: true } } },
  });
  return sendSuccess(res, suppliers);
}));

// 创建
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const supplier = await prisma.supplier.create({ data: parsed.data });
  return sendSuccess(res, supplier, 201);
}));

// 更新
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  return sendSuccess(res, supplier);
}));

export default router;
