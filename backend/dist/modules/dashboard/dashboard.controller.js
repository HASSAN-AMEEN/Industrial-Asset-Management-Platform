"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
class DashboardController {
    constructor() {
        this.dashboardService = new dashboard_service_1.DashboardService();
    }
    async getDashboard(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const data = await this.dashboardService.getDashboard({
                role: req.user.role,
                warehouseId: req.user.warehouseId,
            });
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to load dashboard data',
            });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map