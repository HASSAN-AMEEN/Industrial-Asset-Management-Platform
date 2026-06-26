import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';
import { MACHINE_STATUSES, MachineStatus, CreateMachineInput, UpdateMachineInput } from './machine.types';
import { geocodeAddress, normalizeCoordinatePair, parseGoogleMapsUrl } from '../../utils/geo';

const isMachineStatus = (value: any): value is MachineStatus => {
  return MACHINE_STATUSES.includes(value);
};

// Give interactive transactions room over slower/serverless connections
// (Prisma's default is only 5s).
const INTERACTIVE_TX_OPTIONS = { timeout: 30000, maxWait: 20000 } as const;

export class MachineService {
  // Map the raw Prisma relation names to the friendly shape the clients expect.
  private shapeMachine(record: any) {
    if (!record) return record;
    const {
      warehouses,
      clients,
      installations_machines_installationIdToinstallations,
      installations_installations_machineIdTomachines,
      machine_status_history,
      shipment_items,
      ...rest
    } = record;

    return {
      ...rest,
      warehouse: warehouses ?? null,
      client: clients ?? null,
      installation: installations_machines_installationIdToinstallations ?? null,
    };
  }

  async create(input: CreateMachineInput, changedByUserId: string) {
    const machine = await prisma.machines.create({
      data: {
        id: randomUUID(),
        serialNumber: input.serialNumber,
        model: input.model,
        category: input.category,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        cost: input.cost,
        status: 'IN_WAREHOUSE',
        warehouseId: input.warehouseId,
        clientId: input.clientId,
        updatedAt: new Date(),
      },
    });

    await prisma.machine_status_history.create({
      data: {
        id: randomUUID(),
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
    category?: string;
    fromDate?: string;
    toDate?: string;
    purchaseFrom?: string;
    purchaseTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    if (params.category) {
      where.category = { equals: params.category, mode: 'insensitive' };
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

    if (params.purchaseFrom || params.purchaseTo) {
      where.purchaseDate = {};
      if (params.purchaseFrom) where.purchaseDate.gte = new Date(params.purchaseFrom);
      if (params.purchaseTo) where.purchaseDate.lte = new Date(params.purchaseTo);
    }

    const include = {
      warehouses: true,
      clients: true,
      installations_machines_installationIdToinstallations: true,
    } as const;
    const orderBy = { createdAt: 'desc' as const };

    // Pagination is opt-in: when no limit is supplied, return everything (back-compat).
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : undefined;
    const page = params.page && params.page > 0 ? params.page : 1;

    if (!limit) {
      const rows = await prisma.machines.findMany({ where, include, orderBy });
      return { items: rows.map((row) => this.shapeMachine(row)), total: rows.length, page: 1, limit: rows.length };
    }

    const [rows, total] = await Promise.all([
      prisma.machines.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.machines.count({ where }),
    ]);
    return { items: rows.map((row) => this.shapeMachine(row)), total, page, limit };
  }

  async getById(id: string) {
    return prisma.machines
      .findUnique({
        where: { id },
        include: {
          warehouses: true,
          clients: true,
          installations_machines_installationIdToinstallations: true,
        },
      })
      .then((row) => (row ? this.shapeMachine(row) : null));
  }

  async update(id: string, input: UpdateMachineInput, changedByUserId: string, comment?: string) {
    const existing = await prisma.machines.findUnique({ where: { id } });
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
      const installation = await prisma.installations.findUnique({ where: { id: input.installationId } });
      if (!installation) {
        throw new Error('Installation not found');
      }
    }

    const updated = await prisma.machines.update({
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
        updatedAt: new Date(),
      },
      include: {
        warehouses: true,
        clients: true,
        installations_machines_installationIdToinstallations: true,
      },
    });

    if (input.status && input.status !== existing.status) {
      await prisma.machine_status_history.create({
        data: {
          id: randomUUID(),
          machineId: id,
          fromStatus: existing.status,
          toStatus: input.status,
          changedBy: changedByUserId,
          comment,
        },
      });
    }

    return this.shapeMachine(updated);
  }

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.machine_status_history.deleteMany({
        where: { machineId: id },
      });

      await tx.shipment_items.deleteMany({
        where: { machineId: id },
      });

      await tx.installations.deleteMany({
        where: { machineId: id },
      });

      return tx.machines.delete({
        where: { id },
      });
    }, INTERACTIVE_TX_OPTIONS);
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
      locationUrl?: string;
    }
  ) {
    const existing = await prisma.machines.findUnique({ where: { id } });
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

      const locationUrl = installationInput?.locationUrl?.trim();
      const hasLink = !!locationUrl;
      const hasAddress = !!installationInput?.siteAddress?.trim();

      if (!hasLink && !hasAddress) {
        throw new Error('Provide a Google Maps location link or a site address when setting status to INSTALLED');
      }

      const hasLatitude = installationInput?.latitude !== undefined;
      const hasLongitude = installationInput?.longitude !== undefined;
      if (hasLatitude !== hasLongitude) {
        throw new Error('Both latitude and longitude are required when one is provided');
      }

      // Coordinate resolution priority: Google Maps link -> explicit lat/lng -> geocoded address.
      let coordinates: { latitude?: number; longitude?: number } | null = null;

      if (hasLink) {
        coordinates = await parseGoogleMapsUrl(locationUrl as string);
        if (!coordinates) {
          throw new Error(
            'Could not read a location from that Google Maps link. Open the place in Google Maps, tap Share → Copy link, and paste that.'
          );
        }
      } else if (hasLatitude && hasLongitude) {
        coordinates = normalizeCoordinatePair(
          installationInput!.latitude as number,
          installationInput!.longitude as number
        );
        if (!coordinates) {
          throw new Error('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180');
        }
      } else {
        coordinates = await geocodeAddress(installationInput!.siteAddress as string);
      }

      const latitude = coordinates?.latitude;
      const longitude = coordinates?.longitude;

      const { machine } = await prisma.$transaction(async (tx) => {
        const installation = await tx.installations.create({
          data: {
            id: randomUUID(),
            machineId: id,
            clientId: existing.clientId,
            installedAt: installationInput?.installedAt ? new Date(installationInput.installedAt) : new Date(),
            installedBy: changedByUserId,
            latitude,
            longitude,
            siteAddress: installationInput?.siteAddress,
            siteNotes: installationInput?.siteNotes,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        });

        const machine = await tx.machines.update({
          where: { id },
          data: {
            status: 'INSTALLED',
            installationId: installation.id,
            updatedAt: new Date(),
          },
          include: {
            warehouses: true,
            clients: true,
            installations_machines_installationIdToinstallations: true,
          },
        });

        if (newStatus !== existing.status) {
          await tx.machine_status_history.create({
            data: {
              id: randomUUID(),
              machineId: id,
              fromStatus: existing.status,
              toStatus: 'INSTALLED',
              changedBy: changedByUserId,
              comment,
            },
          });
        }

        return { machine };
      }, INTERACTIVE_TX_OPTIONS);

      return this.shapeMachine(machine);
    }

    const updated = await prisma.machines.update({
      where: { id },
      data: {
        status: newStatus,
        installationId: existing.installationId,
        updatedAt: new Date(),
      },
      include: {
        warehouses: true,
        clients: true,
        installations_machines_installationIdToinstallations: true,
      },
    });

    if (newStatus !== existing.status) {
      await prisma.machine_status_history.create({
        data: {
          id: randomUUID(),
          machineId: id,
          fromStatus: existing.status,
          toStatus: newStatus,
          changedBy: changedByUserId,
          comment,
        },
      });
    }

    return this.shapeMachine(updated);
  }

  async history(machineId: string) {
    const history = await prisma.machine_status_history.findMany({
      where: { machineId },
      orderBy: { createdAt: 'desc' },
    });

    const changedByIds = [...new Set(history.map((entry) => entry.changedBy))].filter(
      (id) => id && id !== 'SYSTEM'
    );

    const users = changedByIds.length
      ? await prisma.users.findMany({
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
