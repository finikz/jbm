import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireOwner, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';

const router = Router();

router.use(authMiddleware);

const beerSchema = z.object({
  name: z.string().min(1),
  brewery: z.string().min(1),
  style: z.string().min(1),
  abv: z.number().min(0).max(100),
  plato: z.number().min(0).max(100),
  ibu: z.number().int().min(0).max(200),
  priceLarge: z.number().int().min(0),
  priceMedium: z.number().int().min(0),
  description: z.string().optional(),
});

// 列表
router.get('/', asyncHandler(async (req, res) => {
  const { active } = req.query;
  const beers = await prisma.beer.findMany({
    where: active === 'true' ? { isActive: true } : active === 'false' ? { isActive: false } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, beers);
}));

// 详情
router.get('/:id', asyncHandler(async (req, res) => {
  const beer = await prisma.beer.findUnique({ where: { id: req.params.id } });
  if (!beer) return sendError(res, '啤酒不存在', 404);
  return sendSuccess(res, beer);
}));

// 创建
router.post('/', requireOwner, asyncHandler(async (req: AuthRequest, res) => {
  const parsed = beerSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const beer = await prisma.beer.create({ data: parsed.data });
  return sendSuccess(res, beer, 201);
}));

// 更新
router.put('/:id', requireOwner, asyncHandler(async (req: AuthRequest, res) => {
  const parsed = beerSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message, 422);

  const beer = await prisma.beer.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  return sendSuccess(res, beer);
}));

// 删除（软删除）
router.delete('/:id', requireOwner, asyncHandler(async (req: AuthRequest, res) => {
  await prisma.beer.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  return sendSuccess(res, { id: req.params.id });
}));

export default router;
