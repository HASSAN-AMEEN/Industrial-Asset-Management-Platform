import { prisma } from '../../config/database';
import { CreateInstallationInput, InstallationStatus, UpdateInstallationInput } from './installation.types';
import { geocodeAddress, normalizeCoordinatePair, parseGoogleMapsUrl } from '../../utils/geo';

const isInstallationStatus = (value: any): value is InstallationStatus => {
  return value === 'ACTIVE' || value === 'REMOVED' || value === 'MAINTENANCE';
};

export class InstallationService {
  private shapeInstallation(record: any) {
    const { machines_installations_machineIdTomachines, clients, ...rest } = record;
    return {
      ...rest,
      machine: machines_installations_machineIdTomachines,
      client: clients,
    };
  }

  private async resolveCoordinates(input: {
    latitude?: number | null;
    longitude?: number | null;
    siteAddress?: string | null;
    locationUrl?: string | null;
  }): Promise<{ latitude?: number | null; longitude?: number | null }> {
    // A Google Maps link takes priority — it carries exact coordinates.
    if (input.locationUrl && input.locationUrl.trim()) {
      const parsed = await parseGoogleMapsUrl(input.locationUrl.trim());
      if (!parsed) {
        throw new Error(
          'Could not read a location from that Google Maps link. Open the place in Google Maps, tap Share → Copy link, and paste that.'
        );
      }
      return parsed;
    }

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
      const normalized = normalizeCoordinatePair(input.latitude as number, input.longitude as number);
      if (!normalized) {
        throw new Error('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180');
      }
      return normalized;
    }

    if (input.siteAddress) {
      const geocoded = await geocodeAddress(input.siteAddress);
      return {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      };
    }

    return {};
  }

  async create(input: CreateInstallationInput, installedByUserId: string) {
    if (!input.machineId) {
      throw new Error('machineId is required');
    }

    const machine = await prisma.machines.findUnique({ where: { id: input.machineId } });
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
      locationUrl: input.locationUrl,
    });

    const installation = await prisma.installations.create({
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
        machines_installations_machineIdTomachines: true,
        clients: true,
      },
    });

    // Update machine status to INSTALLED
    const updatedMachine = await prisma.machines.update({
      where: { id: input.machineId },
      data: {
        status: 'INSTALLED',
        installationId: installation.id,
      },
    });

    // Add machine status history entry
    await prisma.machine_status_history.create({
      data: {
        machineId: input.machineId,
        fromStatus: machine.status,
        toStatus: 'INSTALLED',
        changedBy: installedByUserId,
        comment: `Installation created (${installation.id})`,
      },
    });

    return this.shapeInstallation(installation);
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

    return prisma.installations.findMany({
      where,
      include: {
        machines_installations_machineIdTomachines: true,
        clients: true,
      },
      orderBy: { createdAt: 'desc' },
    }).then((rows) => rows.map((row) => this.shapeInstallation(row)));
  }

  async listForMap(params: {
    status?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {
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
      if (params.fromDate) where.installedAt.gte = new Date(params.fromDate);
      if (params.toDate) where.installedAt.lte = new Date(params.toDate);
    }

    return prisma.installations.findMany({
      where,
      select: {
        id: true,
        status: true,
        installedAt: true,
        siteAddress: true,
        siteNotes: true,
        latitude: true,
        longitude: true,
        machines_installations_machineIdTomachines: {
          select: {
            id: true,
            serialNumber: true,
            model: true,
            category: true,
          },
        },
        clients: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
      },
      orderBy: { installedAt: 'desc' },
    }).then((rows) => rows.map((row: any) => ({
      ...row,
      machine: row.machines_installations_machineIdTomachines,
      client: row.clients,
    })));
  }

  async listUnmapped(params: {
    status?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {
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
      if (params.fromDate) where.installedAt.gte = new Date(params.fromDate);
      if (params.toDate) where.installedAt.lte = new Date(params.toDate);
    }

    return prisma.installations.findMany({
      where,
      select: {
        id: true,
        status: true,
        installedAt: true,
        siteAddress: true,
        siteNotes: true,
        latitude: true,
        longitude: true,
        machines_installations_machineIdTomachines: {
          select: {
            id: true,
            serialNumber: true,
            model: true,
            category: true,
          },
        },
        clients: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
      },
      orderBy: { installedAt: 'desc' },
    }).then((rows) => rows.map((row: any) => ({
      ...row,
      machine: row.machines_installations_machineIdTomachines,
      client: row.clients,
    })));
  }

  async getById(id: string) {
    return prisma.installations.findUnique({
      where: { id },
      include: {
        machines_installations_machineIdTomachines: true,
        clients: true,
      },
    }).then((row) => row ? this.shapeInstallation(row) : null);
  }

  async update(id: string, input: UpdateInstallationInput, updatedByUserId: string) {
    const existing = await prisma.installations.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Installation not found');
    }

    if (input.clientId !== undefined && input.clientId !== existing.clientId) {
      throw new Error('Changing installation clientId is not allowed');
    }

    if (input.status && !isInstallationStatus(input.status)) {
      throw new Error('Invalid status');
    }

    const shouldResolveCoordinates =
      input.latitude !== undefined ||
      input.longitude !== undefined ||
      input.siteAddress !== undefined ||
      (input.locationUrl !== undefined && input.locationUrl !== null);

    const coordinates = shouldResolveCoordinates
      ? await this.resolveCoordinates({
          latitude: input.latitude,
          longitude: input.longitude,
          siteAddress: input.siteAddress === undefined ? existing.siteAddress : input.siteAddress,
          locationUrl: input.locationUrl,
        })
      : {};

    const updated = await prisma.installations.update({
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
        machines_installations_machineIdTomachines: true,
        clients: true,
      },
    });

    // If status changed to REMOVED, update machine status back to DELIVERED
    if (input.status === 'REMOVED' && existing.status !== 'REMOVED') {
      await prisma.machines.update({
        where: { id: existing.machineId },
        data: {
          status: 'DELIVERED',
          installationId: null,
        },
      });

      await prisma.machine_status_history.create({
        data: {
          machineId: existing.machineId,
          fromStatus: 'INSTALLED',
          toStatus: 'DELIVERED',
          changedBy: updatedByUserId,
          comment: `Installation removed (${id})`,
        },
      });
    }

    return this.shapeInstallation(updated);
  }

  async remove(id: string) {
    const existing = await prisma.installations.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Installation not found');
    }

    // Update machine status back to DELIVERED
    await prisma.machines.update({
      where: { id: existing.machineId },
      data: {
        status: 'DELIVERED',
        installationId: null,
      },
    });

    await prisma.machine_status_history.create({
      data: {
        machineId: existing.machineId,
        fromStatus: 'INSTALLED',
        toStatus: 'DELIVERED',
        changedBy: 'SYSTEM',
        comment: `Installation deleted (${id})`,
      },
    });

    return prisma.installations.delete({
      where: { id },
    });
  }
}
