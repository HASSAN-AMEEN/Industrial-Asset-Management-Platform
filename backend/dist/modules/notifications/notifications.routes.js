"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/auth.middleware");
const rbac_middleware_1 = require("../auth/rbac.middleware");
const notifications_controller_1 = require("./notifications.controller");
const router = (0, express_1.Router)();
const controller = new notifications_controller_1.NotificationsController();
router.use(auth_middleware_1.authMiddleware);
router.get('/unread-count', (0, rbac_middleware_1.requireAnyRole)([
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.WAREHOUSE_MANAGER,
    client_1.UserRole.SALES_OPS,
    client_1.UserRole.TECHNICIAN,
]), controller.getUnreadCount.bind(controller));
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map