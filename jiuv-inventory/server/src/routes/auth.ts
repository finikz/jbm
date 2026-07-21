import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateToken, authMiddleware, type AuthRequest } from '../lib/auth';
import { asyncHandler, sendSuccess, sendError } from '../lib/helpers';

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(11).max(11),
  password: z.string().min(1),
});

// 登录
router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, '手机号或密码格式错误', 422);
  }

  const { phone, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return sendError(res, '用户不存在', 404);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return sendError(res, '密码错误', 401);
  }

  const role = user.role as 'OWNER' | 'STAFF';

  const token = generateToken({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
}));

// 获取当前用户
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return sendError(res, '用户不存在', 404);

  return sendSuccess(res, {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}));

export default router;
