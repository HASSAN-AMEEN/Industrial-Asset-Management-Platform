import { prisma } from '../../config/database';
import { MACHINE_STATUSES, MachineStatus, CreateMachineInput, UpdateMachineInput } from './machine.types';

const isMachineStatus = (value: any): value is MachineStatus => {
  return MACHINE_STATUSES.includes(value);
};

export class MachineService {
  private async geocodeAddress(siteAddress: string): Promise<{ latitude?: number; longitude?: number }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(siteAddress)}`,
        {
          headers: {
            'User-Agent': 'TayyabTraders/1.0',
          },
        }
      );

      if (!response.ok) {
        return {};
      }

      const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
      const first = payload?.[0];
      if (!first?.lat || !first?.lon) {
        return {};
      }

      const latitude = Number(first.lat);
      const longitude = Number(first.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return {};
      }

      return { latitude, longitude };
    } catch {
      return {};
    }
  }

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
        installation: true,
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
        installation: true,
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

    if (input.status === 'INSTALLED' && !input.installationId) {
      throw new Error('installationId is required when setting status to INSTALLED');
    }

    if (input.installationId) {
      const installation = await prisma.installation.findUnique({ where: { id: input.installationId } });
      if (!installation) {
        throw new Error('Installation not found');
      }
    }

    const updated = await prisma.machine.update({
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
    comment?: string,
    installationInput?: {
      installedAt?: string;
      latitude?: number;
      longitude?: number;
      siteAddress?: string;
      siteNotes?: string;
    }
  ) {
    const existing = await prisma.machine.findUnique({ where: { id } });
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

      const coordinates =
        installationInput.latitude !== undefined && installationInput.longitude !== undefined
          ? { latitude: installationInput.latitude, longitude: installationInput.longitude }
          : await this.geocodeAddress(installationInput.siteAddress);

      const { machine } = await prisma.$transaction(async (tx) => {
        const installation = await tx.installation.create({
          data: {
            machineId: id,
            clientId: existing.clientId,
            installedAt: installationInput.installedAt ? new Date(installationInput.installedAt) : new Date(),
            installedBy: changedByUserId,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
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

    const updated = await prisma.machine.update({
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
    const history = await prisma.machineStatusHistory.findMany({
      where: { machineId },
      orderBy: { createdAt: 'desc' },
    });

    const changedByIds = [...new Set(history.map((entry) => entry.changedBy))].filter(
      (id) => id && id !== 'SYSTEM'
    );

    const users = changedByIds.length
      ? await prisma.user.findMany({
          where: { id: { in: changedByIds } },
          select: { id: true, email: true },
        })
      : [];

    const userNameById = new Map(
      users.map((user) => {
        const localPart = user.email.split('@')[0] || user.email;
        const displayName = localPart
          .split(/[._-]+/)
          .filter(Boolean)
          .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
          .join(' ');

        return [user.id, displayName || user.email] as const;
      })
    );

    return history.map((entry) => ({
      ...entry,
      changedByName:
        entry.changedBy === 'SYSTEM'
          ? 'System'
          : userNameById.get(entry.changedBy) || entry.changedBy,
    }));
  }
}
