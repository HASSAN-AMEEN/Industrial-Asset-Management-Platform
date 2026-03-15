"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWarehouseScope = exports.requireAnyRole = exports.requireRole = exports.requireAuth = void 0;
const client_1 = require("@prisma/client");
const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        if (req.user.role !== role) {
            res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireAnyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
            return;
        }
        next();
    };
};
exports.requireAnyRole = requireAnyRole;
const requireWarehouseScope = (warehouseIdResolver) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        const targetWarehouseId = warehouseIdResolver(req);
        if (!targetWarehouseId) {
            res.status(400).json({
                success: false,
                message: 'warehouseId is required',
            });
            return;
        }
        if (req.user.role === client_1.UserRole.SUPER_ADMIN) {
            next();
            return;
        }
        if (req.user.role !== client_1.UserRole.WAREHOUSE_MANAGER) {
            res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
            return;
        }
        if (!req.user.warehouseId || req.user.warehouseId !== targetWarehouseId) {
            res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
            return;
        }
        next();
    };
};
exports.requireWarehouseScope = requireWarehouseScope;
//# sourceMappingURL=rbac.middleware.js.map