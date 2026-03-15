"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const database_1 = require("../../config/database");
class WarehouseService {
    async create(input) {
        return database_1.prisma.warehouse.create({
            data: {
                name: input.name,
                address: input.address,
                city: input.city,
                manager: input.manager,
                contact: input.contact,
                capacity: input.capacity,
            },
        });
    }
    async listAll() {
        return database_1.prisma.warehouse.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        return database_1.prisma.warehouse.findUnique({
            where: { id },
        });
    }
    async update(id, input) {
        return database_1.prisma.warehouse.update({
            where: { id },
            data: {
                name: input.name,
                address: input.address,
                city: input.city,
                manager: input.manager,
                contact: input.contact,
                capacity: input.capacity,
            },
        });
    }
    async remove(id) {
        const machineCount = await database_1.prisma.machine.count({ where: { warehouseId: id } });
        if (machineCount > 0) {
            throw new Error(`Cannot delete warehouse: ${machineCount} machine(s) are still assigned. Move or delete machines first.`);
        }
        return database_1.prisma.$transaction(async (tx) => {
            await tx.user.updateMany({
                where: { warehouseId: id },
                data: { warehouseId: null },
            });
            return tx.warehouse.delete({
                where: { id },
            });
        });
    }
    async getWarehouseMachines(warehouseId, filters) {
        const where = { warehouseId };
        if (filters?.category) {
            where.category = filters.category;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        return database_1.prisma.machine.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getWarehouseInventory(warehouseId) {
        const machines = await database_1.prisma.machine.findMany({
            where: { warehouseId },
        });
        const inventory = machines.reduce((acc, machine) => {
            acc.total++;
            acc.byCategory[machine.category] = (acc.byCategory[machine.category] || 0) + 1;
            acc.byStatus[machine.status] = (acc.byStatus[machine.status] || 0) + 1;
            return acc;
        }, {
            total: 0,
            byCategory: {},
            byStatus: {},
        });
        return inventory;
    }
    async listWarehouseManagers() {
        return database_1.prisma.user.findMany({
            where: { role: 'WAREHOUSE_MANAGER' },
            select: {
                id: true,
                email: true,
                warehouseId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async assignManager(warehouseId, managerUserId) {
        const warehouse = await database_1.prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) {
            throw new Error('Warehouse not found');
        }
        const manager = await database_1.prisma.user.findUnique({ where: { id: managerUserId } });
        if (!manager) {
            throw new Error('Manager user not found');
        }
        if (manager.role !== 'WAREHOUSE_MANAGER') {
            throw new Error('Selected user is not a warehouse manager');
        }
        return database_1.prisma.$transaction(async (tx) => {
            await tx.user.updateMany({
                where: {
                    role: 'WAREHOUSE_MANAGER',
                    warehouseId,
                    id: { not: managerUserId },
                },
                data: { warehouseId: null },
            });
            const updatedManager = await tx.user.update({
                where: { id: managerUserId },
                data: { warehouseId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    warehouseId: true,
                },
            });
            const updatedWarehouse = await tx.warehouse.update({
                where: { id: warehouseId },
                data: { manager: updatedManager.email },
            });
            return {
                warehouse: updatedWarehouse,
                manager: updatedManager,
            };
        });
    }
}
exports.WarehouseService = WarehouseService;
//# sourceMappingURL=warehouse.service.js.map