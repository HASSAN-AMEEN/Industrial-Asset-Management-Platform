"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_util_1 = require("./jwt.util");
const database_1 = require("../../config/database");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided'
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_util_1.verifyToken)(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { warehouse: true }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
        return;
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
        return;
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map