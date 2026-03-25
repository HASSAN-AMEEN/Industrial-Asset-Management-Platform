import { CreateClientInput, UpdateClientInput } from './client.types';
export declare class ClientService {
    create(input: CreateClientInput, createdByUserId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        contact: string | null;
        country: string | null;
    }>;
    list(params: {
        q?: string;
        city?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        contact: string | null;
        country: string | null;
    }[]>;
    getById(id: string): Promise<({
        machines: {
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
            installationId: string | null;
        }[];
        shipments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ShipmentStatus;
            trackingId: string | null;
            shipmentDate: Date;
            expectedDeliveryDate: Date | null;
            deliveryConfirmation: string | null;
            updatedBy: string;
            notes: string | null;
            fromWarehouseId: string;
            toWarehouseId: string | null;
            toClientId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        contact: string | null;
        country: string | null;
    }) | null>;
    update(id: string, input: UpdateClientInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        contact: string | null;
        country: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        contact: string | null;
        country: string | null;
    }>;
}
//# sourceMappingURL=client.service.d.ts.map