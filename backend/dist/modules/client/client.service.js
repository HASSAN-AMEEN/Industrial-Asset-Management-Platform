"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const database_1 = require("../../config/database");
class ClientService {
    async create(input, createdByUserId) {
        if (!input.name) {
            throw new Error('name is required');
        }
        return database_1.prisma.client.create({
            data: {
                name: input.name,
                contact: input.contact,
                address: input.address,
                city: input.city,
                country: input.country,
            },
        });
    }
    async list(params) {
        const where = {};
        if (params.q) {
            where.OR = [
                { name: { contains: params.q, mode: 'insensitive' } },
                { contact: { contains: params.q, mode: 'insensitive' } },
                { email: { contains: params.q, mode: 'insensitive' } },
                { phone: { contains: params.q, mode: 'insensitive' } },
            ];
        }
        if (params.city) {
            where.city = { contains: params.city, mode: 'insensitive' };
        }
        return database_1.prisma.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        return database_1.prisma.client.findUnique({
            where: { id },
            include: {
                machines: true,
                shipments: true,
            },
        });
    }
    async update(id, input) {
        const existing = await database_1.prisma.client.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Client not found');
        }
        return database_1.prisma.client.update({
            where: { id },
            data: {
                name: input.name === undefined ? undefined : input.name,
                contact: input.contact === undefined ? undefined : input.contact,
                address: input.address === undefined ? undefined : input.address,
                city: input.city === undefined ? undefined : input.city,
                country: input.country === undefined ? undefined : input.country,
            },
        });
    }
    async remove(id) {
        const existing = await database_1.prisma.client.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Client not found');
        }
        const [machinesCount, shipmentsCount] = await Promise.all([
            database_1.prisma.machine.count({ where: { clientId: id } }),
            database_1.prisma.shipment.count({ where: { toClientId: id } }),
        ]);
        if (machinesCount > 0 || shipmentsCount > 0) {
            throw new Error('Cannot delete client with associated machines or shipments');
        }
        return database_1.prisma.client.delete({
            where: { id },
        });
    }
}
exports.ClientService = ClientService;
//# sourceMappingURL=client.service.js.map