"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/auth.middleware");
const rbac_middleware_1 = require("../auth/rbac.middleware");
const client_controller_1 = require("./client.controller");
const router = (0, express_1.Router)();
const controller = new client_controller_1.ClientController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.list.bind(controller));
router.get('/:id', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.getById.bind(controller));
router.post('/', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.create.bind(controller));
router.put('/:id', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.update.bind(controller));
router.delete('/:id', (0, rbac_middleware_1.requireAnyRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.WAREHOUSE_MANAGER, client_1.UserRole.SALES_OPS]), controller.remove.bind(controller));
exports.default = router;
//# sourceMappingURL=client.routes.js.map