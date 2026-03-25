"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentService = void 0;
const database_1 = require("../../config/database");
const INTERACTIVE_TX_TIMEOUT_MS = 30000;
const INTERACTIVE_TX_MAX_WAIT_MS = 20000;
const ALLOWED_SOURCE_MACHINE_STATUSES = new Set(['IN_WAREHOUSE', 'RESERVED']);
const isShipmentStatus = (value) => {
    return (value === 'CREATED' ||
        value === 'DISPATCHED' ||
        value === 'IN_TRANSIT' ||
        value === 'DELIVERED' ||
        value === 'CANCELLED');
};
class ShipmentService {
    constructor() {
        this.shipmentInclude = {
            items: {
                include: {
                    machine: true,
                },
            },
            fromWarehouse: true,
            toWarehouse: true,
            toClient: true,
        };
    }
    buildTrackingId(date = new Date()) {
        const year = date.getUTCFullYear();
        const stamp = Date.now().toString(36).toUpperCase().slice(-6);
        const entropy = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SHP-${year}-${stamp}${entropy}`;
    }
    formatDateForLog(input) {
        if (!input)
            return 'cleared';
        return input.toISOString().slice(0, 10);
    }
    async create(input, updatedByUserId) {
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
        const result = await database_1.prisma.$transaction(async (tx) => {
            const machines = await tx.machine.findMany({
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
                const destinationWarehouse = await tx.warehouse.findUnique({ where: { id: input.toWarehouseId } });
                if (!destinationWarehouse) {
                    throw new Error('Destination warehouse not found');
                }
            }
            let toClientId;
            if (input.toClientId) {
                const existingClient = await tx.client.findUnique({ where: { id: input.toClientId } });
                if (!existingClient) {
                    throw new Error('Destination client not found');
                }
                toClientId = existingClient.id;
            }
            if (input.client) {
                if (!input.client.name) {
                    throw new Error('client.name is required for client shipment');
                }
                const client = await tx.client.create({
                    data: {
                        name: input.client.name,
                        contact: input.client.contact,
                        address: input.client.address,
                        city: input.client.city,
                        country: input.client.country,
                    },
                });
                toClientId = client.id;
            }
            const shipment = await tx.shipment.create({
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
                },
            });
            await tx.shipmentItem.createMany({
                data: uniqueMachineIds.map((machineId) => ({
                    shipmentId: shipment.id,
                    machineId,
                })),
            });
            await tx.shipmentStatusHistory.create({
                data: {
                    shipmentId: shipment.id,
                    fromStatus: 'CREATED',
                    toStatus: 'CREATED',
                    changedBy: updatedByUserId,
                    comment: 'Shipment created',
                },
            });
            await tx.machine.updateMany({
                where: { id: { in: uniqueMachineIds } },
                data: {
                    status: 'UNDER_SHIPMENT',
                    clientId: toClientId ?? null,
                },
            });
            await tx.machineStatusHistory.createMany({
                data: machines.map((machine) => ({
                    machineId: machine.id,
                    fromStatus: machine.status,
                    toStatus: 'UNDER_SHIPMENT',
                    changedBy: updatedByUserId,
                    comment: `Shipment created (${shipment.id})`,
                })),
            });
            return { shipmentId: shipment.id };
        }, {
            timeout: INTERACTIVE_TX_TIMEOUT_MS,
            maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
        });
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: result.shipmentId },
            include: this.shipmentInclude,
        });
        if (!shipment) {
            throw new Error('Failed to load created shipment');
        }
        return shipment;
    }
    async list(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.machineId) {
            where.items = { some: { machineId: params.machineId } };
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
            if (params.fromDate)
                where.shipmentDate.gte = new Date(params.fromDate);
            if (params.toDate)
                where.shipmentDate.lte = new Date(params.toDate);
        }
        return database_1.prisma.shipment.findMany({
            where,
            include: this.shipmentInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        return database_1.prisma.shipment.findUnique({
            where: { id },
            include: this.shipmentInclude,
        });
    }
    async update(id, input, updatedByUserId) {
        const existing = await database_1.prisma.shipment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        machine: true,
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
            : existing.items.map((item) => item.machineId);
        if (incomingMachineIds.length === 0) {
            throw new Error('Shipment must contain at least one machine');
        }
        const currentMachineIds = existing.items.map((item) => item.machineId);
        const currentMachineIdSet = new Set(currentMachineIds);
        const incomingMachineIdSet = new Set(incomingMachineIds);
        const machineIdsToAdd = incomingMachineIds.filter((machineId) => !currentMachineIdSet.has(machineId));
        const machineIdsToRemove = currentMachineIds.filter((machineId) => !incomingMachineIdSet.has(machineId));
        if (existing.status === 'IN_TRANSIT' && machineIdsToRemove.length > 0) {
            throw new Error('Machines cannot be removed once shipment is IN_TRANSIT');
        }
        const addedMachines = machineIdsToAdd.length
            ? await database_1.prisma.machine.findMany({
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
        const removedItems = existing.items.filter((item) => machineIdsToRemove.includes(item.machineId));
        const nextEta = input.expectedDeliveryDate === undefined
            ? existing.expectedDeliveryDate
            : input.expectedDeliveryDate
                ? new Date(input.expectedDeliveryDate)
                : null;
        const etaChanged = (existing.expectedDeliveryDate?.getTime() ?? null) !== (nextEta?.getTime() ?? null);
        const notesChanged = input.notes !== undefined && input.notes !== existing.notes;
        const result = await database_1.prisma.$transaction(async (tx) => {
            await tx.shipment.update({
                where: { id },
                data: {
                    expectedDeliveryDate: input.expectedDeliveryDate === undefined
                        ? undefined
                        : input.expectedDeliveryDate
                            ? new Date(input.expectedDeliveryDate)
                            : null,
                    notes: input.notes === undefined ? undefined : input.notes,
                    updatedBy: updatedByUserId,
                },
            });
            if (machineIdsToAdd.length > 0) {
                await tx.shipmentItem.createMany({
                    data: machineIdsToAdd.map((machineId) => ({ shipmentId: id, machineId })),
                });
                await tx.machine.updateMany({
                    where: { id: { in: machineIdsToAdd } },
                    data: {
                        status: 'UNDER_SHIPMENT',
                        clientId: existing.toClientId ?? null,
                    },
                });
                await tx.machineStatusHistory.createMany({
                    data: addedMachines.map((machine) => ({
                        machineId: machine.id,
                        fromStatus: machine.status,
                        toStatus: 'UNDER_SHIPMENT',
                        changedBy: updatedByUserId,
                        comment: `Shipment updated (${id}) - machine added`,
                    })),
                });
                await tx.shipmentStatusHistory.createMany({
                    data: addedMachines.map((machine) => ({
                        shipmentId: id,
                        fromStatus: existing.status,
                        toStatus: existing.status,
                        changedBy: updatedByUserId,
                        comment: `Machine ${machine.serialNumber} added`,
                    })),
                });
            }
            if (machineIdsToRemove.length > 0) {
                await tx.shipmentItem.deleteMany({
                    where: {
                        shipmentId: id,
                        machineId: { in: machineIdsToRemove },
                    },
                });
                await tx.machine.updateMany({
                    where: { id: { in: machineIdsToRemove } },
                    data: {
                        status: 'IN_WAREHOUSE',
                        clientId: null,
                    },
                });
                await tx.machineStatusHistory.createMany({
                    data: removedItems.map((item) => ({
                        machineId: item.machine.id,
                        fromStatus: item.machine.status,
                        toStatus: 'IN_WAREHOUSE',
                        changedBy: updatedByUserId,
                        comment: `Shipment updated (${id}) - machine removed`,
                    })),
                });
                await tx.shipmentStatusHistory.createMany({
                    data: removedItems.map((item) => ({
                        shipmentId: id,
                        fromStatus: existing.status,
                        toStatus: existing.status,
                        changedBy: updatedByUserId,
                        comment: `Machine ${item.machine.serialNumber} removed`,
                    })),
                });
            }
            if (etaChanged) {
                await tx.shipmentStatusHistory.create({
                    data: {
                        shipmentId: id,
                        fromStatus: existing.status,
                        toStatus: existing.status,
                        changedBy: updatedByUserId,
                        comment: `ETA updated to ${this.formatDateForLog(nextEta)}`,
                    },
                });
            }
            if (notesChanged) {
                await tx.shipmentStatusHistory.create({
                    data: {
                        shipmentId: id,
                        fromStatus: existing.status,
                        toStatus: existing.status,
                        changedBy: updatedByUserId,
                        comment: 'Notes updated',
                    },
                });
            }
            return { shipmentId: id };
        }, {
            timeout: INTERACTIVE_TX_TIMEOUT_MS,
            maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
        });
        const updated = await database_1.prisma.shipment.findUnique({
            where: { id: result.shipmentId },
            include: this.shipmentInclude,
        });
        if (!updated) {
            throw new Error('Shipment not found');
        }
        return updated;
    }
    async setStatus(id, status, updatedByUserId, comment) {
        if (status === 'DELIVERED') {
            return this.deliver(id, { notes: comment }, updatedByUserId);
        }
        if (status === 'CANCELLED') {
            return this.cancel(id, updatedByUserId, comment);
        }
        const existing = await database_1.prisma.shipment.findUnique({ where: { id } });
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
        const updated = await database_1.prisma.shipment.update({
            where: { id },
            data: {
                status: nextStatus,
                updatedBy: updatedByUserId,
            },
            include: this.shipmentInclude,
        });
        await database_1.prisma.shipmentStatusHistory.create({
            data: {
                shipmentId: id,
                fromStatus: existing.status,
                toStatus: nextStatus,
                changedBy: updatedByUserId,
                comment: comment || 'Shipment dispatched',
            },
        });
        return updated;
    }
    async deliver(id, input, updatedByUserId) {
        const result = await database_1.prisma.$transaction(async (tx) => {
            const existing = await tx.shipment.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!existing) {
                throw new Error('Shipment not found');
            }
            if (existing.status !== 'IN_TRANSIT') {
                throw new Error('Only IN_TRANSIT shipments can be delivered');
            }
            const machineIds = existing.items.map((item) => item.machineId);
            if (machineIds.length === 0) {
                throw new Error('Shipment has no machines');
            }
            const machines = await tx.machine.findMany({ where: { id: { in: machineIds } } });
            if (machines.length !== machineIds.length) {
                throw new Error('One or more shipment machines were not found');
            }
            const isToWarehouse = !!existing.toWarehouseId;
            if (!isToWarehouse && !existing.toClientId) {
                throw new Error('Shipment destination is invalid');
            }
            const newMachineStatus = isToWarehouse ? 'IN_WAREHOUSE' : 'DELIVERED';
            if (isToWarehouse) {
                await tx.machine.updateMany({
                    where: { id: { in: machineIds } },
                    data: {
                        status: 'IN_WAREHOUSE',
                        warehouseId: existing.toWarehouseId,
                        clientId: null,
                        installationId: null,
                    },
                });
            }
            else {
                await tx.machine.updateMany({
                    where: { id: { in: machineIds } },
                    data: {
                        status: 'DELIVERED',
                        clientId: existing.toClientId,
                    },
                });
            }
            await tx.shipment.update({
                where: { id },
                data: {
                    status: 'DELIVERED',
                    deliveryConfirmation: input.deliveryConfirmation,
                    notes: input.notes === undefined ? undefined : input.notes,
                    updatedBy: updatedByUserId,
                },
            });
            await tx.shipmentStatusHistory.create({
                data: {
                    shipmentId: id,
                    fromStatus: existing.status,
                    toStatus: 'DELIVERED',
                    changedBy: updatedByUserId,
                    comment: input.notes || 'Shipment delivered',
                },
            });
            await tx.machineStatusHistory.createMany({
                data: machines.map((machine) => ({
                    machineId: machine.id,
                    fromStatus: machine.status,
                    toStatus: newMachineStatus,
                    changedBy: updatedByUserId,
                    comment: `Shipment delivered (${id})`,
                })),
            });
            return { shipmentId: id };
        }, {
            timeout: INTERACTIVE_TX_TIMEOUT_MS,
            maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
        });
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: result.shipmentId },
            include: this.shipmentInclude,
        });
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        return shipment;
    }
    async cancel(id, updatedByUserId, comment) {
        const result = await database_1.prisma.$transaction(async (tx) => {
            const existing = await tx.shipment.findUnique({
                where: { id },
                include: { items: true },
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
            const machineIds = existing.items.map((item) => item.machineId);
            const machines = await tx.machine.findMany({
                where: { id: { in: machineIds } },
                select: {
                    id: true,
                    status: true,
                },
            });
            await tx.machine.updateMany({
                where: { id: { in: machineIds } },
                data: {
                    status: 'IN_WAREHOUSE',
                    warehouseId: existing.fromWarehouseId,
                    clientId: null,
                    installationId: null,
                },
            });
            await tx.shipment.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    updatedBy: updatedByUserId,
                },
            });
            await tx.shipmentStatusHistory.create({
                data: {
                    shipmentId: id,
                    fromStatus: existing.status,
                    toStatus: 'CANCELLED',
                    changedBy: updatedByUserId,
                    comment: comment || 'Shipment cancelled',
                },
            });
            if (machines.length > 0) {
                await tx.machineStatusHistory.createMany({
                    data: machines.map((machine) => ({
                        machineId: machine.id,
                        fromStatus: machine.status,
                        toStatus: 'IN_WAREHOUSE',
                        changedBy: updatedByUserId,
                        comment: `Shipment cancelled (${id})`,
                    })),
                });
            }
            return { shipmentId: id };
        }, {
            timeout: INTERACTIVE_TX_TIMEOUT_MS,
            maxWait: INTERACTIVE_TX_MAX_WAIT_MS,
        });
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: result.shipmentId },
            include: this.shipmentInclude,
        });
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        return shipment;
    }
    async history(shipmentId) {
        const rows = await database_1.prisma.shipmentStatusHistory.findMany({
            where: { shipmentId },
            orderBy: { createdAt: 'desc' },
        });
        const userIds = [...new Set(rows.map((row) => row.changedBy).filter(Boolean))];
        const users = userIds.length
            ? await database_1.prisma.user.findMany({
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
exports.ShipmentService = ShipmentService;
//# sourceMappingURL=shipment.service.js.map