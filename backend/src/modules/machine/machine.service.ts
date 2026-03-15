import { prisma } from '../../config/database';
import { MACHINE_STATUSES, MachineStatus, CreateMachineInput, UpdateMachineInput } from './machine.types';

const isMachineStatus = (value: any): value is MachineStatus => {
  return MACHINE_STATUSES.includes(value);
};

export class MachineService {
  async create(input: CreateMachineInput, changedByUserId: string) {
    const machine = await prisma.machine.create({
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

    await prisma.machineStatusHistory.create({
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

  async list(params: {
    status?: string;
    warehouseId?: string;
    model?: string;
    serialNumber?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

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
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }

    return prisma.machine.findMany({
      where,
      include: {
        warehouse: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.machine.findUnique({
      where: { id },
      include: {
        warehouse: true,
        client: true,
      },
    });
  }

  async update(id: string, input: UpdateMachineInput, changedByUserId: string, comment?: string) {
    const existing = await prisma.machine.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Machine not found');
    }

    if (input.status && !isMachineStatus(input.status)) {
      throw new Error('Invalid status');
    }

    const updated = await prisma.machine.update({
      where: { id },
      data: {
        model: input.model,
        category: input.category,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        cost: input.cost,
        warehouseId: input.warehouseId,
        clientId: input.clientId === undefined ? undefined : input.clientId,
        installationLocation:
          input.installationLocation === undefined ? undefined : input.installationLocation,
        status: input.status,
      },
    });

    if (input.status && input.status !== existing.status) {
      await prisma.machineStatusHistory.create({
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

  async remove(id: string) {
    return prisma.machine.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    newStatus: MachineStatus,
    changedByUserId: string,
    comment?: string
  ) {
    const existing = await prisma.machine.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Machine not found');
    }

    if (!isMachineStatus(newStatus)) {
      throw new Error('Invalid status');
    }

    const updated = await prisma.machine.update({
      where: { id },
      data: { status: newStatus },
    });

    if (newStatus !== existing.status) {
      await prisma.machineStatusHistory.create({
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

  async history(machineId: string) {
    return prisma.machineStatusHistory.findMany({
      where: { machineId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
