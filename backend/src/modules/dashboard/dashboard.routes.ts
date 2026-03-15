import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);
router.get(
  '/',
  requireAnyRole([
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.SALES_OPS,
    UserRole.TECHNICIAN,
  ]),
  controller.getDashboard.bind(controller)
);

export default router;
