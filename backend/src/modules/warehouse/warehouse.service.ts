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
    return prisma.warehouses.create({
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
    return prisma.warehouses.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.warehouses.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    input: Partial<CreateWarehouseInput>
  ) {
    return prisma.warehouses.update({
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
    const machineCount = await prisma.machines.count({ where: { warehouseId: id } });

    if (machineCount > 0) {
      throw new Error(
        `Cannot delete warehouse: ${machineCount} machine(s) are still assigned. Move or delete machines first.`
      );
    }

    const shipmentCount = await prisma.shipments.count({
      where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] },
    });

    if (shipmentCount > 0) {
      throw new Error(
        `Cannot delete warehouse: ${shipmentCount} shipment(s) reference it. Remove or reassign those shipments first.`
      );
    }

    return prisma.$transaction(async (tx) => {
      // Keep users (including warehouse managers) but detach them from this warehouse.
      await tx.users.updateMany({
        where: { warehouseId: id },
        data: { warehouseId: null },
      });

      return tx.warehouses.delete({
        where: { id },
      });
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

    return prisma.machines.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseInventory(warehouseId: string) {
    const machines = await prisma.machines.findMany({
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

  async listWarehouseManagers() {
    return prisma.users.findMany({
      where: { role: 'WAREHOUSE_MANAGER' },
      select: {
        id: true,
        email: true,
        contact: true,
        warehouseId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignManager(warehouseId: string, managerUserId: string) {
    const warehouse = await prisma.warehouses.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const manager = await prisma.users.findUnique({ where: { id: managerUserId } });
    if (!manager) {
      throw new Error('Manager user not found');
    }

    if (manager.role !== 'WAREHOUSE_MANAGER') {
      throw new Error('Selected user is not a warehouse manager');
    }

    return prisma.$transaction(async (tx) => {
      // One warehouse should map to one manager assignment in this lightweight flow.
      await tx.users.updateMany({
        where: {
          role: 'WAREHOUSE_MANAGER',
          warehouseId,
          id: { not: managerUserId },
        },
        data: { warehouseId: null },
      });

      const updatedManager = await tx.users.update({
        where: { id: managerUserId },
        data: { warehouseId },
        select: {
          id: true,
          email: true,
          role: true,
          warehouseId: true,
        },
      });

      const updatedWarehouse = await tx.warehouses.update({
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
