"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const isWarehouseManagerScoped = (scope) => {
    return scope.role === client_1.UserRole.WAREHOUSE_MANAGER && !!scope.warehouseId;
};
class NotificationsService {
    async getUnreadCount(scope) {
        const warehouseScoped = isWarehouseManagerScoped(scope);
        const [activeShipments, maintenanceMachines, maintenanceInstallations] = await Promise.all([
            database_1.prisma.shipment.count({
                where: {
                    status: {
                        in: ['CREATED', 'DISPATCHED', 'IN_TRANSIT'],
                    },
                    ...(warehouseScoped
                        ? {
                            OR: [
                                { fromWarehouseId: scope.warehouseId },
                                { toWarehouseId: scope.warehouseId },
                            ],
                        }
                        : {}),
                },
            }),
            database_1.prisma.machine.count({
                where: {
                    status: 'UNDER_MAINTENANCE',
                    ...(warehouseScoped ? { warehouseId: scope.warehouseId } : {}),
                },
            }),
            database_1.prisma.installation.count({
                where: {
                    status: 'MAINTENANCE',
                    ...(warehouseScoped
                        ? {
                            machine: {
                                warehouseId: scope.warehouseId,
                            },
                        }
                        : {}),
                },
            }),
        ]);
        const unreadCount = activeShipments + maintenanceMachines + maintenanceInstallations;
        return {
            unreadCount,
            breakdown: {
                activeShipments,
                maintenanceMachines,
                maintenanceInstallations,
            },
        };
    }
}
exports.NotificationsService = NotificationsService;
//# sourceMappingURL=notifications.service.js.map