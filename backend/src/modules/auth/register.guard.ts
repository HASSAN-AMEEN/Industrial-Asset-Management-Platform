import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { verifyToken } from './jwt.util';
import { AuthenticatedRequest } from './types';

// SRD-aligned user creation policy:
// - If there are 0 users, allow bootstrap (create first SUPER_ADMIN)
// - Otherwise, only SUPER_ADMIN can create users
export const registerGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userCount = await prisma.users.count();

    if (userCount === 0) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(403).json({
        success: false,
        message: 'Only SUPER_ADMIN can create users',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only SUPER_ADMIN can create users',
      });
      return;
    }

    next();
  } catch {
    res.status(403).json({
      success: false,
      message: 'Only SUPER_ADMIN can create users',
    });
  }
};
