"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/auth.middleware");
const rbac_middleware_1 = require("../auth/rbac.middleware");
const shipment_controller_1 = require("./shipment.controller");
const router = (0, express_1.Router)();
const controller = new shipment_controller_1.ShipmentController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.list.bind(controller));
router.get('/:id', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.getById.bind(controller));
router.get('/:id/history', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.history.bind(controller));
router.post('/', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.create.bind(controller));
router.put('/:id', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.update.bind(controller));
router.patch('/:id/status', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.setStatus.bind(controller));
router.patch('/:id/deliver', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.deliver.bind(controller));
exports.default = router;
//# sourceMappingURL=shipment.routes.js.map