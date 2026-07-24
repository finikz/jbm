import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from 'shared';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return secret;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未登录' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      id: string;
      phone: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: '登录已过期' });
  }
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'OWNER') {
    return res.status(403).json({ success: false, error: '权限不足' });
  }
  next();
}
