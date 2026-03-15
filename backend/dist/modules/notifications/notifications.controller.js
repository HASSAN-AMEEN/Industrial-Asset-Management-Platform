"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
class NotificationsController {
    constructor() {
        this.notificationsService = new notifications_service_1.NotificationsService();
    }
    async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const data = await this.notificationsService.getUnreadCount({
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
                message: error.message || 'Failed to load unread notifications count',
            });
        }
    }
}
exports.NotificationsController = NotificationsController;
//# sourceMappingURL=notifications.controller.js.map