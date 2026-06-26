import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../auth/auth.middleware';
import { requireRole } from '../auth/rbac.middleware';
import { UserController } from './user.controller';

const router = Router();
const controller = new UserController();

// SRD §2: only the Super Admin manages users.
router.use(authMiddleware);
router.use(requireRole(UserRole.SUPER_ADMIN));

router.get('/', controller.list.bind(controller));
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
