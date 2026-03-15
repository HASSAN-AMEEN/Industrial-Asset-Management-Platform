"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const register_guard_1 = require("./register.guard");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', register_guard_1.registerGuard, authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', auth_middleware_1.authMiddleware, authController.getMe.bind(authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map