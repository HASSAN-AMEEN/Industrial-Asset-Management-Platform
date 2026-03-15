"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGuard = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const jwt_util_1 = require("./jwt.util");
const registerGuard = async (req, res, next) => {
    try {
        const userCount = await database_1.prisma.user.count();
        if (userCount === 0) {
            next();
            return;
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(403).json({
                success: false,
                message: 'Only SUPER_ADMIN can create users',
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_util_1.verifyToken)(token);
        if (decoded.role !== client_1.UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                message: 'Only SUPER_ADMIN can create users',
            });
            return;
        }
        next();
    }
    catch {
        res.status(403).json({
            success: false,
            message: 'Only SUPER_ADMIN can create users',
        });
    }
};
exports.registerGuard = registerGuard;
//# sourceMappingURL=register.guard.js.map