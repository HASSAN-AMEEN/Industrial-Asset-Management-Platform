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

  async getWarehouseMachines(warehouseId: string, filters?: {
    category?: string;
    status?: string;
  }) {
    const where: any = { warehouseId };
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.machine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseInventory(warehouseId: string) {
    const machines = await prisma.machine.findMany({
      where: { warehouseId },
    });

    const inventory = machines.reduce((acc, machine) => {
      acc.total++;
      acc.byCategory[machine.category] = (acc.byCategory[machine.category] || 0) + 1;
      acc.byStatus[machine.status] = (acc.byStatus[machine.status] || 0) + 1;
      return acc;
    }, {
      total: 0,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    });

    return inventory;
  }
}
