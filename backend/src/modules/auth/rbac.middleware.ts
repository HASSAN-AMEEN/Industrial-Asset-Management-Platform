import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from './types';

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  next();
};

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
      return;
    }

    next();
  };
};

export const requireAnyRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
      return;
    }

    next();
  };
};

// Warehouse scoping rule:
// - SUPER_ADMIN can access all warehouses
// - WAREHOUSE_MANAGER can only access their own assigned warehouse
// - Other roles should not pass warehouse-scoped modification endpoints
export const requireWarehouseScope = (warehouseIdResolver: (req: AuthenticatedRequest) => string | undefined) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const targetWarehouseId = warehouseIdResolver(req);

    if (!targetWarehouseId) {
      res.status(400).json({
        success: false,
        message: 'warehouseId is required',
      });
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    if (req.user.role !== UserRole.WAREHOUSE_MANAGER) {
      res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
      return;
    }

    if (!req.user.warehouseId || req.user.warehouseId !== targetWarehouseId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
      return;
    }

    next();
  };
};
