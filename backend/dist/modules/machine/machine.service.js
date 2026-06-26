"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineService = void 0;
const database_1 = require("../../config/database");
const machine_types_1 = require("./machine.types");
const geo_1 = require("../../utils/geo");
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
            },
        });
        await database_1.prisma.machineStatusHistory.create({
            data: {
                machineId: machine.id,
                fromStatus: 'SYSTEM',
                toStatus: machine.status,
                changedBy: changedByUserId,
                comment: 'Machine added to inventory',
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
                installation: true,
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
                installation: true,
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
        if (input.status === 'INSTALLED' && !input.installationId) {
            throw new Error('installationId is required when setting status to INSTALLED');
        }
        if (input.installationId) {
            const installation = await database_1.prisma.installation.findUnique({ where: { id: input.installationId } });
            if (!installation) {
                throw new Error('Installation not found');
            }
        }
        const updated = await database_1.prisma.machine.update({
            where: { id },
            data: {
                serialNumber: input.serialNumber,
                model: input.model,
                category: input.category,
                purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
                cost: input.cost,
                warehouseId: input.warehouseId,
                clientId: input.clientId === undefined ? undefined : input.clientId,
                installationId: input.installationId === undefined ? undefined : input.installationId,
                status: input.status,
            },
            include: {
                warehouse: true,
                client: true,
                installation: true,
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
    async updateStatus(id, newStatus, changedByUserId, comment, installationInput) {
        const existing = await database_1.prisma.machine.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Machine not found');
        }
        if (!isMachineStatus(newStatus)) {
            throw new Error('Invalid status');
        }
        if (newStatus === 'INSTALLED') {
            if (existing.status !== 'DELIVERED') {
                throw new Error('Only DELIVERED machines can be marked as INSTALLED');
            }
            if (!existing.clientId) {
                throw new Error('Machine must have clientId before installation');
            }
            if (!installationInput?.siteAddress) {
                throw new Error('siteAddress is required when setting status to INSTALLED');
            }
            const hasLatitude = installationInput.latitude !== undefined;
            const hasLongitude = installationInput.longitude !== undefined;
            if (hasLatitude !== hasLongitude) {
                throw new Error('Both latitude and longitude are required when one is provided');
            }
            const coordinates = hasLatitude && hasLongitude
                ? (0, geo_1.normalizeCoordinatePair)(installationInput.latitude, installationInput.longitude)
                : await (0, geo_1.geocodeAddress)(installationInput.siteAddress);
            if (hasLatitude && hasLongitude && !coordinates) {
                throw new Error('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180');
            }
            const latitude = coordinates?.latitude;
            const longitude = coordinates?.longitude;
            const { machine } = await database_1.prisma.$transaction(async (tx) => {
                const installation = await tx.installation.create({
                    data: {
                        machineId: id,
                        clientId: existing.clientId,
                        installedAt: installationInput.installedAt ? new Date(installationInput.installedAt) : new Date(),
                        installedBy: changedByUserId,
                        latitude,
                        longitude,
                        siteAddress: installationInput.siteAddress,
                        siteNotes: installationInput.siteNotes,
                        status: 'ACTIVE',
                    },
                });
                const machine = await tx.machine.update({
                    where: { id },
                    data: {
                        status: 'INSTALLED',
                        installationId: installation.id,
                    },
                    include: {
                        warehouse: true,
                        client: true,
                        installation: true,
                    },
                });
                if (newStatus !== existing.status) {
                    await tx.machineStatusHistory.create({
                        data: {
                            machineId: id,
                            fromStatus: existing.status,
                            toStatus: 'INSTALLED',
                            changedBy: changedByUserId,
                            comment,
                        },
                    });
                }
                return { machine };
            });
            return machine;
        }
        const updated = await database_1.prisma.machine.update({
            where: { id },
            data: {
                status: newStatus,
                installationId: existing.installationId,
            },
            include: {
                warehouse: true,
                client: true,
                installation: true,
            },
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
        const history = await database_1.prisma.machineStatusHistory.findMany({
            where: { machineId },
            orderBy: { createdAt: 'desc' },
        });
        const changedByIds = [...new Set(history.map((entry) => entry.changedBy))].filter((id) => id && id !== 'SYSTEM');
        const users = changedByIds.length
            ? await database_1.prisma.user.findMany({
                where: { id: { in: changedByIds } },
                select: { id: true, email: true },
            })
            : [];
        const userNameById = new Map(users.map((user) => {
            const localPart = user.email.split('@')[0] || user.email;
            const displayName = localPart
                .split(/[._-]+/)
                .filter(Boolean)
                .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
                .join(' ');
            return [user.id, displayName || user.email];
        }));
        return history.map((entry) => ({
            ...entry,
            changedByName: entry.changedBy === 'SYSTEM'
                ? 'System'
                : userNameById.get(entry.changedBy) || entry.changedBy,
        }));
    }
}
exports.MachineService = MachineService;
//# sourceMappingURL=machine.service.js.map