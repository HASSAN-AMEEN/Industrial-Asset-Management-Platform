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
        return database_1.prisma.warehouse.delete({
            where: { id },
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
}
exports.WarehouseService = WarehouseService;
//# sourceMappingURL=warehouse.service.js.map