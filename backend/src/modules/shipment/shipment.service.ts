import { prisma } from '../../config/database';
import { CreateShipmentInput, DeliverShipmentInput, ShipmentStatus, UpdateShipmentInput } from './shipment.types';

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
  async create(input: CreateShipmentInput, updatedByUserId: string) {
    if (!!input.toWarehouseId === !!input.toClientId) {
      throw new Error('Either toWarehouseId or toClientId is required (but not both)');
    }

    const machine = await prisma.machine.findUnique({ where: { id: input.machineId } });
    if (!machine) {
      throw new Error('Machine not found');
    }

    if (machine.warehouseId !== input.fromWarehouseId) {
      throw new Error('Machine is not in fromWarehouse');
    }

    if (machine.status === 'UNDER_SHIPMENT') {
      throw new Error('Machine is already under shipment');
    }

    if (input.toClientId) {
      const client = await prisma.client.findUnique({ where: { id: input.toClientId } });
      if (!client) {
        throw new Error('Client not found');
      }
    }

    const shipment = await prisma.shipment.create({
      data: {
        machineId: input.machineId,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        toClientId: input.toClientId,
        shipmentDate: input.shipmentDate ? new Date(input.shipmentDate) : undefined,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
        status: 'CREATED',
        updatedBy: updatedByUserId,
        notes: input.notes,
      },
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: shipment.id,
        fromStatus: 'CREATED',
        toStatus: 'CREATED',
        changedBy: updatedByUserId,
        comment: 'Shipment created',
      },
    });

    const updatedMachine = await prisma.machine.update({
      where: { id: input.machineId },
      data: {
        status: 'UNDER_SHIPMENT',
      },
    });

    await prisma.machineStatusHistory.create({
      data: {
        machineId: updatedMachine.id,
        fromStatus: machine.status,
        toStatus: 'UNDER_SHIPMENT',
        changedBy: updatedByUserId,
        comment: `Shipment created (${shipment.id})`,
      },
    });

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
  }) {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.machineId) {
      where.machineId = params.machineId;
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

    return prisma.shipment.findMany({
      where,
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.shipment.findUnique({
      where: { id },
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
    });
  }

  async update(id: string, input: UpdateShipmentInput, updatedByUserId: string) {
    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Shipment not found');
    }

    if (existing.status !== 'CREATED') {
      throw new Error('Only CREATED shipments can be edited');
    }

    const toWarehouseId = input.toWarehouseId === undefined ? undefined : input.toWarehouseId;
    const toClientId = input.toClientId === undefined ? undefined : input.toClientId;

    const nextToWarehouseId = toWarehouseId === undefined ? existing.toWarehouseId : toWarehouseId;
    const nextToClientId = toClientId === undefined ? existing.toClientId : toClientId;

    if (!!nextToWarehouseId === !!nextToClientId) {
      throw new Error('Either toWarehouseId or toClientId is required (but not both)');
    }

    return prisma.shipment.update({
      where: { id },
      data: {
        toWarehouseId: toWarehouseId === undefined ? undefined : toWarehouseId,
        toClientId: toClientId === undefined ? undefined : toClientId,
        shipmentDate: input.shipmentDate ? new Date(input.shipmentDate) : undefined,
        expectedDeliveryDate:
          input.expectedDeliveryDate === undefined
            ? undefined
            : input.expectedDeliveryDate
              ? new Date(input.expectedDeliveryDate)
              : null,
        notes: input.notes === undefined ? undefined : input.notes,
        updatedBy: updatedByUserId,
      },
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
    });
  }

  async setStatus(id: string, status: ShipmentStatus, updatedByUserId: string, comment?: string) {
    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Shipment not found');
    }

    if (!isShipmentStatus(status)) {
      throw new Error('Invalid status');
    }

    if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED') {
      throw new Error('Shipment is finalized');
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        updatedBy: updatedByUserId,
      },
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
    });

    if (existing.status !== status) {
      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          fromStatus: existing.status,
          toStatus: status,
          changedBy: updatedByUserId,
          comment,
        },
      });
    }

    return updated;
  }

  async deliver(id: string, input: DeliverShipmentInput, updatedByUserId: string) {
    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Shipment not found');
    }

    if (existing.status === 'CANCELLED') {
      throw new Error('Shipment is cancelled');
    }

    if (existing.status === 'DELIVERED') {
      throw new Error('Shipment is already delivered');
    }

    const machine = await prisma.machine.findUnique({ where: { id: existing.machineId } });
    if (!machine) {
      throw new Error('Machine not found');
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveryConfirmation: input.deliveryConfirmation,
        notes: input.notes === undefined ? undefined : input.notes,
        updatedBy: updatedByUserId,
      },
      include: {
        machine: true,
        fromWarehouse: true,
        toWarehouse: true,
        toClient: true,
      },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        fromStatus: existing.status,
        toStatus: 'DELIVERED',
        changedBy: updatedByUserId,
        comment: 'Shipment delivered',
      },
    });

    const isToWarehouse = !!shipment.toWarehouseId;

    const newMachineStatus = isToWarehouse ? 'IN_WAREHOUSE' : 'DELIVERED';

    const updatedMachine = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        status: newMachineStatus,
        warehouseId: shipment.toWarehouseId ?? machine.warehouseId,
        clientId: shipment.toClientId ?? null,
      },
    });

    await prisma.machineStatusHistory.create({
      data: {
        machineId: updatedMachine.id,
        fromStatus: machine.status,
        toStatus: newMachineStatus,
        changedBy: updatedByUserId,
        comment: `Shipment delivered (${shipment.id})`,
      },
    });

    return shipment;
  }

  async history(shipmentId: string) {
    return prisma.shipmentStatusHistory.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
