import { CreateShipmentInput, DeliverShipmentInput, ShipmentStatus, UpdateShipmentInput } from './shipment.types';
export declare class ShipmentService {
    create(input: CreateShipmentInput, updatedByUserId: string): Promise<{
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    }>;
    list(params: {
        status?: string;
        fromDate?: string;
        toDate?: string;
        machineId?: string;
        fromWarehouseId?: string;
        toWarehouseId?: string;
        toClientId?: string;
    }): Promise<({
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    })[]>;
    getById(id: string): Promise<({
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    }) | null>;
    update(id: string, input: UpdateShipmentInput, updatedByUserId: string): Promise<{
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    }>;
    setStatus(id: string, status: ShipmentStatus, updatedByUserId: string, comment?: string): Promise<{
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    }>;
    deliver(id: string, input: DeliverShipmentInput, updatedByUserId: string): Promise<{
        machine: {
            id: string;
            model: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            category: string;
            status: string;
            serialNumber: string;
            purchaseDate: Date | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            clientId: string | null;
            installationLocation: string | null;
        };
        fromWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        };
        toWarehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        toClient: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        machineId: string;
        shipmentDate: Date;
        expectedDeliveryDate: Date | null;
        deliveryConfirmation: string | null;
        updatedBy: string;
        notes: string | null;
        fromWarehouseId: string;
        toWarehouseId: string | null;
        toClientId: string | null;
    }>;
    history(shipmentId: string): Promise<{
        id: string;
        createdAt: Date;
        fromStatus: import(".prisma/client").$Enums.ShipmentStatus;
        toStatus: import(".prisma/client").$Enums.ShipmentStatus;
        changedBy: string;
        comment: string | null;
        shipmentId: string;
    }[]>;
}
//# sourceMappingURL=shipment.service.d.ts.map