import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAnyRole } from '../auth/rbac.middleware';
import { ClientController } from './client.controller';

const router = Router();
const controller = new ClientController();

router.use(authMiddleware);

// Read
router.get('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.list.bind(controller));
router.get('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_OPS]), controller.getById.bind(controller));

// Write
// SRD §2: Sales/Ops is view-only; client records are managed by Super Admin & Warehouse Manager.
router.post('/', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.create.bind(controller));
router.put('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.update.bind(controller));
router.delete('/:id', requireAnyRole([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]), controller.remove.bind(controller));

export default router;
