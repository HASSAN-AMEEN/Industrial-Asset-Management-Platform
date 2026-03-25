"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const toPercentage = (part, total) => {
    if (!total)
        return 0;
    return Math.round((part / total) * 100);
};
const isWarehouseManagerScoped = (scope) => {
    return scope.role === client_1.UserRole.WAREHOUSE_MANAGER && !!scope.warehouseId;
};
class DashboardService {
    async getDashboard(scope) {
        const machineWhere = isWarehouseManagerScoped(scope)
            ? { warehouseId: scope.warehouseId }
            : {};
        const [totalMachines, inTransitMachines, maintenanceMachines, recentShipments, recentInstallations, recentMaintenanceUpdates,] = await Promise.all([
            database_1.prisma.machine.count({ where: machineWhere }),
            database_1.prisma.machine.count({ where: { ...machineWhere, status: 'UNDER_SHIPMENT' } }),
            database_1.prisma.machine.count({ where: { ...machineWhere, status: 'UNDER_MAINTENANCE' } }),
            database_1.prisma.shipment.findMany({
                where: isWarehouseManagerScoped(scope)
                    ? {
                        OR: [
                            { fromWarehouseId: scope.warehouseId },
                            { toWarehouseId: scope.warehouseId },
                        ],
                    }
                    : undefined,
                orderBy: { updatedAt: 'desc' },
                take: 6,
            }),
            database_1.prisma.installation.findMany({
                where: isWarehouseManagerScoped(scope)
                    ? {
                        machine: {
                            warehouseId: scope.warehouseId,
                        },
                    }
                    : undefined,
                include: {
                    machine: {
                        select: {
                            model: true,
                            serialNumber: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 6,
            }),
            database_1.prisma.machineStatusHistory.findMany({
                where: {
                    toStatus: 'UNDER_MAINTENANCE',
                    ...(isWarehouseManagerScoped(scope)
                        ? {
                            machine: {
                                warehouseId: scope.warehouseId,
                            },
                        }
                        : {}),
                },
                include: {
                    machine: {
                        select: {
                            model: true,
                            serialNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 6,
            }),
        ]);
        const activeMachines = Math.max(totalMachines - inTransitMachines - maintenanceMachines, 0);
        const shipmentActivities = recentShipments.map((shipment) => ({
            id: `shipment-${shipment.id}`,
            type: 'shipment',
            title: `Shipment ${shipment.status}`,
            description: shipment.toClientId ? 'Destination: Client' : 'Destination: Warehouse',
            createdAt: shipment.updatedAt.toISOString(),
        }));
        const installationActivities = recentInstallations.map((installation) => ({
            id: `installation-${installation.id}`,
            type: 'installation',
            title: `Installation ${installation.status}`,
            description: `${installation.machine.model} (${installation.machine.serialNumber})`,
            createdAt: installation.updatedAt.toISOString(),
        }));
        const maintenanceActivities = recentMaintenanceUpdates.map((entry) => ({
            id: `maintenance-${entry.id}`,
            type: 'maintenance',
            title: 'Maintenance Update',
            description: `${entry.machine.model} (${entry.machine.serialNumber}) moved to maintenance`,
            createdAt: entry.createdAt.toISOString(),
        }));
        const recentActivity = [...shipmentActivities, ...installationActivities, ...maintenanceActivities]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
        return {
            machineStats: {
                total: totalMachines,
                active: activeMachines,
                inTransit: inTransitMachines,
                maintenance: maintenanceMachines,
            },
            fleetStatus: [
                {
                    label: 'Active',
                    value: activeMachines,
                    percentage: toPercentage(activeMachines, totalMachines),
                },
                {
                    label: 'Transit',
                    value: inTransitMachines,
                    percentage: toPercentage(inTransitMachines, totalMachines),
                },
                {
                    label: 'Maintenance',
                    value: maintenanceMachines,
                    percentage: toPercentage(maintenanceMachines, totalMachines),
                },
            ],
            recentActivity,
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map