"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    async register(req, res) {
        try {
            const data = req.body;
            const result = await this.authService.register(data);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }
    async login(req, res) {
        try {
            const data = req.body;
            const result = await this.authService.login(data);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Login failed'
            });
        }
    }
    async getMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: req.user
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get user data'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map