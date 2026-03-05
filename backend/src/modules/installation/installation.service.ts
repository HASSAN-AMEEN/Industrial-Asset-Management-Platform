import { prisma } from '../../config/database';
import { CreateInstallationInput, InstallationStatus, UpdateInstallationInput } from './installation.types';

const isInstallationStatus = (value: any): value is InstallationStatus => {
  return value === 'ACTIVE' || value === 'REMOVED' || value === 'MAINTENANCE';
};

export class InstallationService {
  async create(input: CreateInstallationInput, installedByUserId: string) {
    if (!input.machineId) {
      throw new Error('machineId is required');
    }

    const machine = await prisma.machine.findUnique({ where: { id: input.machineId } });
    if (!machine) {
      throw new Error('Machine not found');
    }

    if (machine.status !== 'DELIVERED') {
      throw new Error('Only DELIVERED machines can be installed');
    }

    if (input.clientId) {
      const client = await prisma.client.findUnique({ where: { id: input.clientId } });
      if (!client) {
        throw new Error('Client not found');
      }
    }

    const installation = await prisma.installation.create({
      data: {
        machineId: input.machineId,
        clientId: input.clientId,
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

    // Update machine status to INSTALLED
    const updatedMachine = await prisma.machine.update({
      where: { id: input.machineId },
      data: { status: 'INSTALLED' },
    });

    // Add machine status history entry
    await prisma.machineStatusHistory.create({
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

  async list(params: {
    status?: string;
    clientId?: string;
    machineId?: string;
  }) {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.clientId) {
      where.clientId = params.clientId;
    }

    if (params.machineId) {
      where.machineId = params.machineId;
    }

    return prisma.installation.findMany({
      where,
      include: {
        machine: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.installation.findUnique({
      where: { id },
      include: {
        machine: true,
        client: true,
      },
    });
  }

  async update(id: string, input: UpdateInstallationInput, updatedByUserId: string) {
    const existing = await prisma.installation.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Installation not found');
    }

    if (input.status && !isInstallationStatus(input.status)) {
      throw new Error('Invalid status');
    }

    const updated = await prisma.installation.update({
      where: { id },
      data: {
        clientId: input.clientId === undefined ? undefined : input.clientId,
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

    // If status changed to REMOVED, update machine status back to DELIVERED
    if (input.status === 'REMOVED' && existing.status !== 'REMOVED') {
      await prisma.machine.update({
        where: { id: existing.machineId },
        data: { status: 'DELIVERED' },
      });

      await prisma.machineStatusHistory.create({
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

  async remove(id: string) {
    const existing = await prisma.installation.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Installation not found');
    }

    // Update machine status back to DELIVERED
    await prisma.machine.update({
      where: { id: existing.machineId },
      data: { status: 'DELIVERED' },
    });

    await prisma.machineStatusHistory.create({
      data: {
        machineId: existing.machineId,
        fromStatus: 'INSTALLED',
        toStatus: 'DELIVERED',
        changedBy: 'SYSTEM',
        comment: `Installation deleted (${id})`,
      },
    });

    return prisma.installation.delete({
      where: { id },
    });
  }
}
