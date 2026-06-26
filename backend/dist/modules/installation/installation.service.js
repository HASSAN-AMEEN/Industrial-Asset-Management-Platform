"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallationService = void 0;
const database_1 = require("../../config/database");
const geo_1 = require("../../utils/geo");
const isInstallationStatus = (value) => {
    return value === 'ACTIVE' || value === 'REMOVED' || value === 'MAINTENANCE';
};
class InstallationService {
    async resolveCoordinates(input) {
        const hasLat = input.latitude !== undefined && input.latitude !== null;
        const hasLon = input.longitude !== undefined && input.longitude !== null;
        const wantsClearLat = input.latitude === null;
        const wantsClearLon = input.longitude === null;
        if (wantsClearLat !== wantsClearLon) {
            throw new Error('Both latitude and longitude must be null to clear coordinates');
        }
        if (wantsClearLat && wantsClearLon) {
            return { latitude: null, longitude: null };
        }
        if (hasLat !== hasLon) {
            throw new Error('Both latitude and longitude are required when one is provided');
        }
        if (hasLat && hasLon) {
            const normalized = (0, geo_1.normalizeCoordinatePair)(input.latitude, input.longitude);
            if (!normalized) {
                throw new Error('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180');
            }
            return normalized;
        }
        if (input.siteAddress) {
            const geocoded = await (0, geo_1.geocodeAddress)(input.siteAddress);
            return {
                latitude: geocoded.latitude,
                longitude: geocoded.longitude,
            };
        }
        return {};
    }
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
        const coordinates = await this.resolveCoordinates({
            latitude: input.latitude,
            longitude: input.longitude,
            siteAddress: input.siteAddress,
        });
        const installation = await database_1.prisma.installation.create({
            data: {
                machineId: input.machineId,
                clientId: machine.clientId,
                installedAt: input.installedAt ? new Date(input.installedAt) : new Date(),
                installedBy: installedByUserId,
                latitude: coordinates.latitude === undefined ? undefined : coordinates.latitude,
                longitude: coordinates.longitude === undefined ? undefined : coordinates.longitude,
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
    async listForMap(params) {
        const where = {
            latitude: { not: null },
            longitude: { not: null },
        };
        if (params.status) {
            where.status = params.status;
        }
        if (params.clientId) {
            where.clientId = params.clientId;
        }
        if (params.fromDate || params.toDate) {
            where.installedAt = {};
            if (params.fromDate)
                where.installedAt.gte = new Date(params.fromDate);
            if (params.toDate)
                where.installedAt.lte = new Date(params.toDate);
        }
        return database_1.prisma.installation.findMany({
            where,
            select: {
                id: true,
                status: true,
                installedAt: true,
                siteAddress: true,
                siteNotes: true,
                latitude: true,
                longitude: true,
                machine: {
                    select: {
                        id: true,
                        serialNumber: true,
                        model: true,
                        category: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                    },
                },
            },
            orderBy: { installedAt: 'desc' },
        });
    }
    async listUnmapped(params) {
        const where = {
            OR: [{ latitude: null }, { longitude: null }],
        };
        if (params.status) {
            where.status = params.status;
        }
        if (params.clientId) {
            where.clientId = params.clientId;
        }
        if (params.fromDate || params.toDate) {
            where.installedAt = {};
            if (params.fromDate)
                where.installedAt.gte = new Date(params.fromDate);
            if (params.toDate)
                where.installedAt.lte = new Date(params.toDate);
        }
        return database_1.prisma.installation.findMany({
            where,
            select: {
                id: true,
                status: true,
                installedAt: true,
                siteAddress: true,
                siteNotes: true,
                latitude: true,
                longitude: true,
                machine: {
                    select: {
                        id: true,
                        serialNumber: true,
                        model: true,
                        category: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                    },
                },
            },
            orderBy: { installedAt: 'desc' },
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
        const shouldResolveCoordinates = input.latitude !== undefined || input.longitude !== undefined || input.siteAddress !== undefined;
        const coordinates = shouldResolveCoordinates
            ? await this.resolveCoordinates({
                latitude: input.latitude,
                longitude: input.longitude,
                siteAddress: input.siteAddress === undefined ? existing.siteAddress : input.siteAddress,
            })
            : {};
        const updated = await database_1.prisma.installation.update({
            where: { id },
            data: {
                clientId: undefined,
                latitude: coordinates.latitude === undefined ? undefined : coordinates.latitude,
                longitude: coordinates.longitude === undefined ? undefined : coordinates.longitude,
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