import { prisma } from '../../config/database';
import { CreateShipmentInput, DeliverShipmentInput, ShipmentStatus, UpdateShipmentInput } from './shipment.types';

const INTERACTIVE_TX_TIMEOUT_MS = 30000;
const INTERACTIVE_TX_MAX_WAIT_MS = 20000;
const ALLOWED_SOURCE_MACHINE_STATUSES = new Set(['IN_WAREHOUSE', 'RESERVED']);

const isShipmentStatus = (value: any): value is ShipmentStatus => {
  return (
    value === 'CREATED' ||
    value === 'DISPATCHED' ||
    value === 'IN_TRANSIT' ||
    value === 'DELIVERED' ||
    value === 'CANCELLED'
  );
};

export class ShipmentService {
  private readonly shipmentInclude = {
    shipment_items: {
      include: {
        machines: true,
      },
    },
    warehouses_shipments_fromWarehouseIdTowarehouses: true,
    warehouses_shipments_toWarehouseIdTowarehouses: true,
    clients: true,
  } as const;

  private shapeShipment(record: any) {
    const {
      shipment_items,
      warehouses_shipments_fromWarehouseIdTowarehouses,
      warehouses_shipments_toWarehouseIdTowarehouses,
      clients,
      ...rest
    } = record;

    return {
      ...rest,
      items: (shipment_items || []).map((item: any) => ({
        ...item,
        machine: item.machines,
      })),
      fromWarehouse: warehouses_shipments_fromWarehouseIdTowarehouses,
      toWarehouse: warehouses_shipments_toWarehouseIdTowarehouses,
      toClient: clients,
    };
  }

  private buildTrackingId(date = new Date()): string {
    const year = date.getUTCFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-6);
    const entropy = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SHP-${year}-${stamp}${entropy}`;
  }

  private formatDateForLog(input?: Date | null): string {
    if (!input) return 'cleared';
    return input.toISOString().slice(0, 10);
  }

  async create(input: CreateShipmentInput, updatedByUserId: string) {
    if (!Array.isArray(input.machineIds) || input.machineIds.length === 0) {
      throw new Error('At least one machineId is required');
    }

    const uniqueMachineIds = [...new Set(input.machineIds.filter(Boolean))];
    if (uniqueMachineIds.length === 0) {
      throw new Error('At least one machineId is required');
    }

    const destinationCount = Number(!!input.toWarehouseId) + Number(!!input.toClientId) + Number(!!input.client);
    if (destinationCount !== 1) {
      throw new Error('Destination must be exactly one of: toWarehouseId, toClientId, or client');
    }

    const result = await prisma.$transaction(async (tx) => {
      const machines = await tx.machines.findMany({
        where: { id: { in: uniqueMachineIds } },
        select: {
          id: true,
          warehouseId: true,
          status: true,
        },
      });

      if (machines.length !== uniqueMachineIds.length) {
        throw new Error('One or more machines were not found');
      }

      if (machines.some((machine) => machine.warehouseId !== input.fromWarehouseId)) {
        throw new Error('All machines must belong to fromWarehouseId');
      }

      if (machines.some((machine) => !ALLOWED_SOURCE_MACHINE_STATUSES.has(machine.status))) {
        throw new Error('All selected machines must be IN_WAREHOUSE or RESERVED');
      }

      if (input.toWarehouseId) {
        const destinationWarehouse = await tx.warehouses.findUnique({ where: { id: input.toWarehouseId } });
        if (!destinationWarehouse) {
          throw new Error('Destination warehouse not found');
        }
      }

      let toClientId: string | undefined;
      if (input.toClientId) {
        const existingClient = await tx.clients.findUnique({ where: { id: input.toClientId } });
        if (!existingClient) {
          throw new Error('Destination client not found');
        }
        toClientId = existingClient.id;
      }

      if (input.client) {
        if (!input.client.name) {
          throw new Error('client.name is required for client shipment');
        }

        const client = await tx.clients.create({
          data: {
            name: input.client.name,
            contact: input.client.contact,
            address: input.client.address,
            city: input.client.city,
            country: input.client.country,
          } as any,
        });
        toClientId = client.id;
      }

      const shipment = await tx.shipments.create({
        data: {
          trackingId: this.buildTrackingId(),
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          toClientId,
          shipmentDate: input.shipmentDate ? new Date(input.shipmentDate) : undefined,
          expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
          status: 'CREATED',
          updatedBy: updatedByUserId,
          notes: input.notes,
        } as any,
      });

      await tx.shipment_items.createMany({
        data: uniqueMachineIds.map((machineId) => ({
          shipmentId: shipment.id,
          machineId,
        })) as any,
      });

      await tx.shipment_status_history.create({
        data: {
          shipmentId: shipment.id,
          fromStatus: 'CREATED',
          toStatus: 'CREATED',
          changedBy: updatedByUserId,
          comment: 'Shipment created',
        } as any,
      });

      await tx.machines.updateMany({
        where: { id: { in: uniqueMachineIds } },
        data: {
          status: 'UNDER_SHIPMENT',
          clientId: toClientId ?? null,
        },
      });

      await tx.machine_status_history.createMany({
        data: machines.map((machine) => ({
          machineId: machine.id,
          fromStatus: machine.status,
          toStatus: 'UNDER_SHIPMENT',
          changedBy: updatedByUserId,
          comment: `Shipment created (${shipment.id})`,
        })) as any,
      });

      return { shipmentId: shipment.id };
    }, {
      timeout: INTERACTIVE_TX_TIMEOUT_MS,
      maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
    });

    const shipment = await prisma.shipments.findUnique({
      where: { id: result.shipmentId },
      include: this.shipmentInclude,
    });

    if (!shipment) {
      throw new Error('Failed to load created shipment');
    }

    return shipment;
  }

  async list(params: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    machineId?: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    toClientId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.machineId) {
      where.shipment_items = { some: { machineId: params.machineId } };
    }

    // Free-text search across tracking id, warehouses, client, and machine serials.
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { trackingId: { contains: q, mode: 'insensitive' } },
        { warehouses_shipments_fromWarehouseIdTowarehouses: { name: { contains: q, mode: 'insensitive' } } },
        { warehouses_shipments_toWarehouseIdTowarehouses: { name: { contains: q, mode: 'insensitive' } } },
        { clients: { name: { contains: q, mode: 'insensitive' } } },
        { shipment_items: { some: { machines: { serialNumber: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    if (params.fromWarehouseId) {
      where.fromWarehouseId = params.fromWarehouseId;
    }

    if (params.toWarehouseId) {
      where.toWarehouseId = params.toWarehouseId;
    }

    if (params.toClientId) {
      where.toClientId = params.toClientId;
    }

    if (params.fromDate || params.toDate) {
      where.shipmentDate = {};
      if (params.fromDate) where.shipmentDate.gte = new Date(params.fromDate);
      if (params.toDate) where.shipmentDate.lte = new Date(params.toDate);
    }

    const orderBy = { createdAt: 'desc' as const };
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : undefined;
    const page = params.page && params.page > 0 ? params.page : 1;

    if (!limit) {
      const rows = await prisma.shipments.findMany({ where, include: this.shipmentInclude, orderBy });
      return { items: rows.map((row) => this.shapeShipment(row)), total: rows.length, page: 1, limit: rows.length };
    }

    const [rows, total] = await Promise.all([
      prisma.shipments.findMany({ where, include: this.shipmentInclude, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.shipments.count({ where }),
    ]);
    return { items: rows.map((row) => this.shapeShipment(row)), total, page, limit };
  }

  async getById(id: string) {
    return prisma.shipments.findUnique({
      where: { id },
      include: this.shipmentInclude,
    }).then((row) => row ? this.shapeShipment(row) : null);
  }

  async update(id: string, input: UpdateShipmentInput, updatedByUserId: string) {
    const existing = await prisma.shipments.findUnique({
      where: { id },
      include: {
        shipment_items: {
          include: {
            machines: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Shipment not found');
    }

    if (existing.status !== 'CREATED' && existing.status !== 'IN_TRANSIT') {
      throw new Error('Only CREATED or IN_TRANSIT shipments can be edited');
    }

    if (input.machineIds && input.machineIds.length === 0) {
      throw new Error('Shipment must contain at least one machine');
    }

    const incomingMachineIds = input.machineIds
      ? [...new Set(input.machineIds.filter(Boolean))]
      : existing.shipment_items.map((item) => item.machineId);

    if (incomingMachineIds.length === 0) {
      throw new Error('Shipment must contain at least one machine');
    }

    const currentMachineIds = existing.shipment_items.map((item) => item.machineId);
    const currentMachineIdSet = new Set(currentMachineIds);
    const incomingMachineIdSet = new Set(incomingMachineIds);

    const machineIdsToAdd = incomingMachineIds.filter((machineId) => !currentMachineIdSet.has(machineId));
    const machineIdsToRemove = currentMachineIds.filter((machineId) => !incomingMachineIdSet.has(machineId));

    if (existing.status === 'IN_TRANSIT' && machineIdsToRemove.length > 0) {
      throw new Error('Machines cannot be removed once shipment is IN_TRANSIT');
    }

    const addedMachines = machineIdsToAdd.length
      ? await prisma.machines.findMany({
          where: { id: { in: machineIdsToAdd } },
          select: {
            id: true,
            serialNumber: true,
            status: true,
            warehouseId: true,
          },
        })
      : [];

    if (addedMachines.length !== machineIdsToAdd.length) {
      throw new Error('One or more machines to add were not found');
    }

    if (addedMachines.some((machine) => machine.warehouseId !== existing.fromWarehouseId)) {
      throw new Error('Added machines must belong to shipment source warehouse');
    }

    if (addedMachines.some((machine) => !ALLOWED_SOURCE_MACHINE_STATUSES.has(machine.status))) {
      throw new Error('Added machines must be IN_WAREHOUSE or RESERVED');
    }

    const removedItems = existing.shipment_items.filter((item: any) => machineIdsToRemove.includes(item.machineId));
    const nextEta =
      input.expectedDeliveryDate === undefined
        ? existing.expectedDeliveryDate
        : input.expectedDeliveryDate
          ? new Date(input.expectedDeliveryDate)
          : null;

    const etaChanged =
      (existing.expectedDeliveryDate?.getTime() ?? null) !== (nextEta?.getTime() ?? null);

    const notesChanged = input.notes !== undefined && input.notes !== existing.notes;

    const result = await prisma.$transaction(async (tx) => {
      await tx.shipments.update({
        where: { id },
        data: {
          expectedDeliveryDate:
            input.expectedDeliveryDate === undefined
              ? undefined
              : input.expectedDeliveryDate
                ? new Date(input.expectedDeliveryDate)
                : null,
          notes: input.notes === undefined ? undefined : input.notes,
          updatedBy: updatedByUserId,
        } as any,
      });

      if (machineIdsToAdd.length > 0) {
        await tx.shipment_items.createMany({
          data: machineIdsToAdd.map((machineId) => ({ shipmentId: id, machineId })) as any,
        });

        await tx.machines.updateMany({
          where: { id: { in: machineIdsToAdd } },
          data: {
            status: 'UNDER_SHIPMENT',
            clientId: existing.toClientId ?? null,
          },
        });

        await tx.machine_status_history.createMany({
          data: addedMachines.map((machine) => ({
            machineId: machine.id,
            fromStatus: machine.status,
            toStatus: 'UNDER_SHIPMENT',
            changedBy: updatedByUserId,
            comment: `Shipment updated (${id}) - machine added`,
          })) as any,
        });

        await tx.shipment_status_history.createMany({
          data: addedMachines.map((machine) => ({
            shipmentId: id,
            fromStatus: existing.status,
            toStatus: existing.status,
            changedBy: updatedByUserId,
            comment: `Machine ${machine.serialNumber} added`,
          })) as any,
        });
      }

      if (machineIdsToRemove.length > 0) {
        await tx.shipment_items.deleteMany({
          where: {
            shipmentId: id,
            machineId: { in: machineIdsToRemove },
          },
        });

        await tx.machines.updateMany({
          where: { id: { in: machineIdsToRemove } },
          data: {
            status: 'IN_WAREHOUSE',
            clientId: null,
          },
        });

        await tx.machine_status_history.createMany({
          data: removedItems.map((item: any) => ({
            machineId: item.machines.id,
            fromStatus: item.machines.status,
            toStatus: 'IN_WAREHOUSE',
            changedBy: updatedByUserId,
            comment: `Shipment updated (${id}) - machine removed`,
          })) as any,
        });

        await tx.shipment_status_history.createMany({
          data: removedItems.map((item: any) => ({
            shipmentId: id,
            fromStatus: existing.status,
            toStatus: existing.status,
            changedBy: updatedByUserId,
            comment: `Machine ${item.machines.serialNumber} removed`,
          })) as any,
        });
      }

      if (etaChanged) {
        await tx.shipment_status_history.create({
          data: {
            shipmentId: id,
            fromStatus: existing.status,
            toStatus: existing.status,
            changedBy: updatedByUserId,
            comment: `ETA updated to ${this.formatDateForLog(nextEta)}`,
          } as any,
        });
      }

      if (notesChanged) {
        await tx.shipment_status_history.create({
          data: {
            shipmentId: id,
            fromStatus: existing.status,
            toStatus: existing.status,
            changedBy: updatedByUserId,
            comment: 'Notes updated',
          } as any,
        });
      }

      return { shipmentId: id };
    }, {
      timeout: INTERACTIVE_TX_TIMEOUT_MS,
      maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
    });

    const updated = await prisma.shipments.findUnique({
      where: { id: result.shipmentId },
      include: this.shipmentInclude,
    });

    if (!updated) {
      throw new Error('Shipment not found');
    }

    return this.shapeShipment(updated);
  }

  async setStatus(id: string, status: ShipmentStatus, updatedByUserId: string, comment?: string) {
    if (status === 'DELIVERED') {
      return this.deliver(id, { notes: comment }, updatedByUserId);
    }

    if (status === 'CANCELLED') {
      return this.cancel(id, updatedByUserId, comment);
    }

    const existing = await prisma.shipments.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Shipment not found');
    }

    if (!isShipmentStatus(status)) {
      throw new Error('Invalid status');
    }

    if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED') {
      throw new Error('Shipment is finalized');
    }

    const nextStatus = status === 'DISPATCHED' ? 'IN_TRANSIT' : status;

    if (existing.status !== 'CREATED' || nextStatus !== 'IN_TRANSIT') {
      throw new Error('Only CREATED shipments can be dispatched to IN_TRANSIT');
    }

    const updated = await prisma.shipments.update({
      where: { id },
      data: {
        status: nextStatus,
        updatedBy: updatedByUserId,
      } as any,
      include: this.shipmentInclude,
    });

    await prisma.shipment_status_history.create({
      data: {
        shipmentId: id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        changedBy: updatedByUserId,
        comment: comment || 'Shipment dispatched',
      } as any,
    });

    return this.shapeShipment(updated);
  }

  async deliver(id: string, input: DeliverShipmentInput, updatedByUserId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.shipments.findUnique({
        where: { id },
        include: { shipment_items: { include: { machines: true } } },
      });

      if (!existing) {
        throw new Error('Shipment not found');
      }

      if (existing.status !== 'IN_TRANSIT') {
        throw new Error('Only IN_TRANSIT shipments can be delivered');
      }

      const machineIds = existing.shipment_items.map((item) => item.machineId);
      if (machineIds.length === 0) {
        throw new Error('Shipment has no machines');
      }

      const machines = await tx.machines.findMany({ where: { id: { in: machineIds } } });
      if (machines.length !== machineIds.length) {
        throw new Error('One or more shipment machines were not found');
      }

      const isToWarehouse = !!existing.toWarehouseId;
      if (!isToWarehouse && !existing.toClientId) {
        throw new Error('Shipment destination is invalid');
      }

      const newMachineStatus = isToWarehouse ? 'IN_WAREHOUSE' : 'DELIVERED';

      if (isToWarehouse) {
        await tx.machines.updateMany({
          where: { id: { in: machineIds } },
          data: {
            status: 'IN_WAREHOUSE',
            warehouseId: existing.toWarehouseId!,
            clientId: null,
            installationId: null,
          },
        });
      } else {
        await tx.machines.updateMany({
          where: { id: { in: machineIds } },
          data: {
            status: 'DELIVERED',
            clientId: existing.toClientId!,
          },
        });
      }

      await tx.shipments.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveryConfirmation: input.deliveryConfirmation,
          notes: input.notes === undefined ? undefined : input.notes,
          updatedBy: updatedByUserId,
        } as any,
      });

      await tx.shipment_status_history.create({
        data: {
          shipmentId: id,
          fromStatus: existing.status,
          toStatus: 'DELIVERED',
          changedBy: updatedByUserId,
          comment: input.notes || 'Shipment delivered',
        } as any,
      });

      await tx.machine_status_history.createMany({
        data: machines.map((machine) => ({
          machineId: machine.id,
          fromStatus: machine.status,
          toStatus: newMachineStatus,
          changedBy: updatedByUserId,
          comment: `Shipment delivered (${id})`,
        })) as any,
      });

      return { shipmentId: id };
    }, {
      timeout: INTERACTIVE_TX_TIMEOUT_MS,
      maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
    });

    const shipment = await prisma.shipments.findUnique({
      where: { id: result.shipmentId },
      include: this.shipmentInclude,
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return this.shapeShipment(shipment);
  }

  async cancel(id: string, updatedByUserId: string, comment?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.shipments.findUnique({
        where: { id },
        include: { shipment_items: { include: { machines: true } } },
      });

      if (!existing) {
        throw new Error('Shipment not found');
      }

      if (existing.status === 'DELIVERED') {
        throw new Error('Delivered shipment cannot be cancelled');
      }

      if (existing.status === 'CANCELLED') {
        throw new Error('Shipment is already cancelled');
      }

      const machineIds = existing.shipment_items.map((item) => item.machineId);
      const machines = await tx.machines.findMany({
        where: { id: { in: machineIds } },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.machines.updateMany({
        where: { id: { in: machineIds } },
        data: {
          status: 'IN_WAREHOUSE',
          warehouseId: existing.fromWarehouseId,
          clientId: null,
          installationId: null,
        },
      });

      await tx.shipments.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy: updatedByUserId,
        } as any,
      });

      await tx.shipment_status_history.create({
        data: {
          shipmentId: id,
          fromStatus: existing.status,
          toStatus: 'CANCELLED',
          changedBy: updatedByUserId,
          comment: comment || 'Shipment cancelled',
        } as any,
      });

      if (machines.length > 0) {
        await tx.machine_status_history.createMany({
          data: machines.map((machine) => ({
            machineId: machine.id,
            fromStatus: machine.status,
            toStatus: 'IN_WAREHOUSE',
            changedBy: updatedByUserId,
            comment: `Shipment cancelled (${id})`,
          })) as any,
        });
      }

      return { shipmentId: id };
    }, {
      timeout: INTERACTIVE_TX_TIMEOUT_MS,
      maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
    });

    const shipment = await prisma.shipments.findUnique({
      where: { id: result.shipmentId },
      include: this.shipmentInclude,
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return this.shapeShipment(shipment);
  }

  async history(shipmentId: string) {
    const rows = await prisma.shipment_status_history.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(rows.map((row) => row.changedBy).filter(Boolean))];
    const users = userIds.length
      ? await prisma.users.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
          },
        })
      : [];

    const userById = new Map(users.map((user) => [user.id, user]));

    return rows.map((row) => ({
      ...row,
      changedByUser: userById.get(row.changedBy) || null,
    }));
  }
}
