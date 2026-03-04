import { prisma } from '../../config/database';

export interface CreateWarehouseInput {
  name: string;
  address: string;
  city: string;
  manager?: string;
  contact?: string;
  capacity?: number;
}

export class WarehouseService {
  async create(input: CreateWarehouseInput) {
    return prisma.warehouse.create({
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
    return prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    input: Partial<CreateWarehouseInput>
  ) {
    return prisma.warehouse.update({
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

  async remove(id: string) {
    return prisma.warehouse.delete({
      where: { id },
    });
  }
}
