import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole, requireRole } from '../auth/rbac.middleware';
import { WarehouseController } from './warehouse.controller';

const router = Router();
const controller = new WarehouseController();

router.use(authMiddleware);

router.post('/', requireRole(UserRole.SUPER_ADMIN), controller.create.bind(controller));
router.get('/managers', requireRole(UserRole.SUPER_ADMIN), controller.listManagers.bind(controller));
router.get('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.SALES_OPS, UserRole.WAREHOUSE_MANAGER]), controller.list.bind(controller));
router.get('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.SALES_OPS, UserRole.WAREHOUSE_MANAGER]), controller.getById.bind(controller));
router.get('/:id/machines', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.SALES_OPS, UserRole.WAREHOUSE_MANAGER]), controller.getMachines.bind(controller));
router.get('/:id/inventory', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.SALES_OPS, UserRole.WAREHOUSE_MANAGER]), controller.getInventory.bind(controller));
router.patch('/:id/assign-manager', requireRole(UserRole.SUPER_ADMIN), controller.assignManager.bind(controller));
router.put('/:id', requireRole(UserRole.SUPER_ADMIN), controller.update.bind(controller));
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN), controller.remove.bind(controller));

export default router;
