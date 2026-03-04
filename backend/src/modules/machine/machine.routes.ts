import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { MachineController } from './machine.controller';

const router = Router();
const controller = new MachineController();

router.use(authMiddleware);

// Read
router.get('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.list.bind(controller));
router.get('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.getById.bind(controller));
router.get('/:id/history', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.history.bind(controller));

// Write
router.post('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.create.bind(controller));
router.put('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.update.bind(controller));
router.delete('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.remove.bind(controller));
router.patch('/:id/status', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.updateStatus.bind(controller));

export default router;
