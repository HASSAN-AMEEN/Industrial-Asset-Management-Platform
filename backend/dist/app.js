"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const test_routes_1 = __importDefault(require("./modules/test/test.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const warehouse_routes_1 = __importDefault(require("./modules/warehouse/warehouse.routes"));
const machine_routes_1 = __importDefault(require("./modules/machine/machine.routes"));
const shipment_routes_1 = __importDefault(require("./modules/shipment/shipment.routes"));
const client_routes_1 = __importDefault(require("./modules/client/client.routes"));
const installation_routes_1 = __importDefault(require("./modules/installation/installation.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.config.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, logger_1.httpLogger)());
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    app.use('/api/test', test_routes_1.default);
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/warehouses', warehouse_routes_1.default);
    app.use('/api/machines', machine_routes_1.default);
    app.use('/api/shipments', shipment_routes_1.default);
    app.use('/api/clients', client_routes_1.default);
    app.use('/api/installations', installation_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api/notifications', notifications_routes_1.default);
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Route not found',
        });
    });
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map