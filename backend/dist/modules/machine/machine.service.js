"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineService = void 0;
const database_1 = require("../../config/database");
const machine_types_1 = require("./machine.types");
const isMachineStatus = (value) => {
    return machine_types_1.MACHINE_STATUSES.includes(value);
};
class MachineService {
    async create(input, changedByUserId) {
        const machine = await database_1.prisma.machine.create({
            data: {
                serialNumber: input.serialNumber,
                model: input.model,
                category: input.category,
                purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
                cost: input.cost,
                status: 'IN_WAREHOUSE',
                warehouseId: input.warehouseId,
                clientId: input.clientId,
                installationLocation: input.installationLocation,
            },
        });
        await database_1.prisma.machineStatusHistory.create({
            data: {
                machineId: machine.id,
                fromStatus: 'SYSTEM',
                toStatus: machine.status,
                changedBy: changedByUserId,
                comment: 'Machine created',
            },
        });
        return machine;
    }
    async list(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.warehouseId) {
            where.warehouseId = params.warehouseId;
        }
        if (params.model) {
            where.model = { contains: params.model, mode: 'insensitive' };
        }
        if (params.serialNumber) {
            where.serialNumber = { contains: params.serialNumber, mode: 'insensitive' };
        }
        if (params.fromDate || params.toDate) {
            where.createdAt = {};
            if (params.fromDate)
                where.createdAt.gte = new Date(params.fromDate);
            if (params.toDate)
                where.createdAt.lte = new Date(params.toDate);
        }
        return database_1.prisma.machine.findMany({
            where,
            include: {
                warehouse: true,
                client: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        return database_1.prisma.machine.findUnique({
            where: { id },
            include: {
                warehouse: true,
                client: true,
            },
        });
    }
    async update(id, input, changedByUserId, comment) {
        const existing = await database_1.prisma.machine.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Machine not found');
        }
        if (input.status && !isMachineStatus(input.status)) {
            throw new Error('Invalid status');
        }
        const updated = await database_1.prisma.machine.update({
            where: { id },
            data: {
                model: input.model,
                category: input.category,
                purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
                cost: input.cost,
                warehouseId: input.warehouseId,
                clientId: input.clientId === undefined ? undefined : input.clientId,
                installationLocation: input.installationLocation === undefined ? undefined : input.installationLocation,
                status: input.status,
            },
        });
        if (input.status && input.status !== existing.status) {
            await database_1.prisma.machineStatusHistory.create({
                data: {
                    machineId: id,
                    fromStatus: existing.status,
                    toStatus: input.status,
                    changedBy: changedByUserId,
                    comment,
                },
            });
        }
        return updated;
    }
    async remove(id) {
        return database_1.prisma.machine.delete({
            where: { id },
        });
    }
    async updateStatus(id, newStatus, changedByUserId, comment) {
        const existing = await database_1.prisma.machine.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Machine not found');
        }
        if (!isMachineStatus(newStatus)) {
            throw new Error('Invalid status');
        }
        const updated = await database_1.prisma.machine.update({
            where: { id },
            data: { status: newStatus },
        });
        if (newStatus !== existing.status) {
            await database_1.prisma.machineStatusHistory.create({
                data: {
                    machineId: id,
                    fromStatus: existing.status,
                    toStatus: newStatus,
                    changedBy: changedByUserId,
                    comment,
                },
            });
        }
        return updated;
    }
    async history(machineId) {
        return database_1.prisma.machineStatusHistory.findMany({
            where: { machineId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.MachineService = MachineService;
//# sourceMappingURL=machine.service.js.map