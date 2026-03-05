import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { InstallationController } from './installation.controller';

const router = Router();
const controller = new InstallationController();

router.use(authMiddleware);

// Read
router.get('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS, UserRole.TECHNICIAN]), controller.list.bind(controller));
router.get('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS, UserRole.TECHNICIAN]), controller.getById.bind(controller));

// Write
router.post('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.create.bind(controller));
router.put('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.update.bind(controller));
router.delete('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.remove.bind(controller));

export default router;
