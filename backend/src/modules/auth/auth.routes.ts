// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from './auth.middleware';
import { registerGuard } from './register.guard';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', registerGuard, authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/me', authMiddleware, authController.getMe.bind(authController));

export default router;