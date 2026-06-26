import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { ShipmentController } from './shipment.controller';

const router = Router();
const controller = new ShipmentController();

router.use(authMiddleware);

router.get('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.list.bind(controller));
router.get('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.getById.bind(controller));
router.get('/:id/history', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.history.bind(controller));

// SRD §2: Warehouse Manager (and Super Admin) create/modify shipments; Sales/Ops is view-only.
router.post('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.create.bind(controller));
router.put('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.update.bind(controller));
router.patch('/:id/status', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.setStatus.bind(controller));
router.patch('/:id/deliver', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.deliver.bind(controller));
router.patch('/:id/cancel', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.cancel.bind(controller));

export default router;
