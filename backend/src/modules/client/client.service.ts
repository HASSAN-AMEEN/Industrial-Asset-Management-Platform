import { prisma } from '../../config/database';
import { CreateClientInput, UpdateClientInput } from './client.types';

export class ClientService {
  async create(input: CreateClientInput, createdByUserId: string) {
    if (!input.name) {
      throw new Error('name is required');
    }

    return prisma.client.create({
      data: {
        name: input.name,
        contact: input.contact,
        address: input.address,
        city: input.city,
        country: input.country,
      },
    });
  }

  async list(params: {
    q?: string;
    city?: string;
  }) {
    const where: any = {};

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

    return prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        machines: true,
        shipments: true,
      },
    });
  }

  async update(id: string, input: UpdateClientInput) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Client not found');
    }

    return prisma.client.update({
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

  async remove(id: string) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Client not found');
    }

    // Optional: prevent deletion if client has machines or shipments
    const [machinesCount, shipmentsCount] = await Promise.all([
      prisma.machine.count({ where: { clientId: id } }),
      prisma.shipment.count({ where: { toClientId: id } }),
    ]);

    if (machinesCount > 0 || shipmentsCount > 0) {
      throw new Error('Cannot delete client with associated machines or shipments');
    }

    return prisma.client.delete({
      where: { id },
    });
  }
}
