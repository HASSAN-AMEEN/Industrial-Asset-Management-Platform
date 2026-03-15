import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from './types';
export declare const requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (role: UserRole) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyRole: (roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireWarehouseScope: (warehouseIdResolver: (req: AuthenticatedRequest) => string | undefined) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map