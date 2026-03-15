"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/auth.middleware");
const rbac_middleware_1 = require("../auth/rbac.middleware");
const dashboard_controller_1 = require("./dashboard.controller");
const router = (0, express_1.Router)();
const controller = new dashboard_controller_1.DashboardController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, rbac_middleware_1.requireAnyRole)([
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.WAREHOUSE_MANAGER,
    client_1.UserRole.SALES_OPS,
    client_1.UserRole.TECHNICIAN,
]), controller.getDashboard.bind(controller));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map