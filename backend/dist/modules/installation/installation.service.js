"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallationService = void 0;
const database_1 = require("../../config/database");
const isInstallationStatus = (value) => {
    return value === 'ACTIVE' || value === 'REMOVED' || value === 'MAINTENANCE';
};
class InstallationService {
    async create(input, installedByUserId) {
        if (!input.machineId) {
            throw new Error('machineId is required');
        }
        const machine = await database_1.prisma.machine.findUnique({ where: { id: input.machineId } });
        if (!machine) {
            throw new Error('Machine not found');
        }
        if (machine.status !== 'DELIVERED') {
            throw new Error('Only DELIVERED machines can be installed');
        }
        if (!machine.clientId) {
            throw new Error('Machine must have a client assignment before installation');
        }
        if (input.clientId && input.clientId !== machine.clientId) {
            throw new Error('Provided clientId does not match machine client assignment');
        }
        const installation = await database_1.prisma.installation.create({
            data: {
                machineId: input.machineId,
                clientId: machine.clientId,
                installedAt: input.installedAt ? new Date(input.installedAt) : new Date(),
                installedBy: installedByUserId,
                latitude: input.latitude,
                longitude: input.longitude,
                siteAddress: input.siteAddress,
                siteNotes: input.siteNotes,
                status: 'ACTIVE',
            },
            include: {
                machine: true,
                client: true,
            },
        });
        const updatedMachine = await database_1.prisma.machine.update({
            where: { id: input.machineId },
            data: {
                status: 'INSTALLED',
                installationId: installation.id,
            },
        });
        await database_1.prisma.machineStatusHistory.create({
            data: {
                machineId: input.machineId,
                fromStatus: machine.status,
                toStatus: 'INSTALLED',
                changedBy: installedByUserId,
                comment: `Installation created (${installation.id})`,
            },
        });
        return installation;
    }
    async list(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.clientId) {
            where.clientId = params.clientId;
        }
        if (params.machineId) {
            where.machineId = params.machineId;
        }
        return database_1.prisma.installation.findMany({
            where,
            include: {
                machine: true,
                client: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        return database_1.prisma.installation.findUnique({
            where: { id },
            include: {
                machine: true,
                client: true,
            },
        });
    }
    async update(id, input, updatedByUserId) {
        const existing = await database_1.prisma.installation.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Installation not found');
        }
        if (input.clientId !== undefined && input.clientId !== existing.clientId) {
            throw new Error('Changing installation clientId is not allowed');
        }
        if (input.status && !isInstallationStatus(input.status)) {
            throw new Error('Invalid status');
        }
        const updated = await database_1.prisma.installation.update({
            where: { id },
            data: {
                clientId: undefined,
                latitude: input.latitude === undefined ? undefined : input.latitude,
                longitude: input.longitude === undefined ? undefined : input.longitude,
                siteAddress: input.siteAddress === undefined ? undefined : input.siteAddress,
                siteNotes: input.siteNotes === undefined ? undefined : input.siteNotes,
                status: input.status,
            },
            include: {
                machine: true,
                client: true,
            },
        });
        if (input.status === 'REMOVED' && existing.status !== 'REMOVED') {
            await database_1.prisma.machine.update({
                where: { id: existing.machineId },
                data: {
                    status: 'DELIVERED',
                    installationId: null,
                },
            });
            await database_1.prisma.machineStatusHistory.create({
                data: {
                    machineId: existing.machineId,
                    fromStatus: 'INSTALLED',
                    toStatus: 'DELIVERED',
                    changedBy: updatedByUserId,
                    comment: `Installation removed (${id})`,
                },
            });
        }
        return updated;
    }
    async remove(id) {
        const existing = await database_1.prisma.installation.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Installation not found');
        }
        await database_1.prisma.machine.update({
            where: { id: existing.machineId },
            data: {
                status: 'DELIVERED',
                installationId: null,
            },
        });
        await database_1.prisma.machineStatusHistory.create({
            data: {
                machineId: existing.machineId,
                fromStatus: 'INSTALLED',
                toStatus: 'DELIVERED',
                changedBy: 'SYSTEM',
                comment: `Installation deleted (${id})`,
            },
        });
        return database_1.prisma.installation.delete({
            where: { id },
        });
    }
}
exports.InstallationService = InstallationService;
//# sourceMappingURL=installation.service.js.map