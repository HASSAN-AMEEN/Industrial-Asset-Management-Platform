import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { NotificationsController } from './notifications.controller';

const router = Router();
const controller = new NotificationsController();

router.use(authMiddleware);

router.get(
  '/unread-count',
  requireAnyRole([
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.SALES_OPS,
    UserRole.TECHNICIAN,
  ]),
  controller.getUnreadCount.bind(controller)
);

export default router;
