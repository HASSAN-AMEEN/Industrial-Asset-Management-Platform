"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const jwt_util_1 = require("./jwt.util");
const client_1 = require("@prisma/client");
const normalizeEmail = (email) => email.trim().toLowerCase();
class AuthService {
    async register(data) {
        const email = normalizeEmail(data.email);
        if (!email || !email.includes('@')) {
            throw new Error('Invalid email');
        }
        if (!data.password || data.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (data.role === client_1.UserRole.WAREHOUSE_MANAGER && !data.warehouseId) {
            throw new Error('warehouseId is required for WAREHOUSE_MANAGER');
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: data.role || client_1.UserRole.SALES_OPS,
                warehouseId: data.warehouseId
            }
        });
        const token = (0, jwt_util_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            warehouseId: user.warehouseId || undefined
        });
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token
        };
    }
    async login(data) {
        const email = normalizeEmail(data.email);
        if (!email || !email.includes('@') || !data.password) {
            throw new Error('Invalid credentials');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: { warehouse: true }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        const token = (0, jwt_util_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            warehouseId: user.warehouseId || undefined
        });
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token
        };
    }
    async getMe(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: { warehouse: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map