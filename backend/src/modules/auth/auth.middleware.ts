// src/modules/auth/auth.middleware.ts
import { Response, NextFunction } from 'express';
import { verifyToken } from './jwt.util';
import { prisma } from '../../config/database';
import { AuthenticatedRequest } from './types';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) : Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { warehouses: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
    return;
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }
};