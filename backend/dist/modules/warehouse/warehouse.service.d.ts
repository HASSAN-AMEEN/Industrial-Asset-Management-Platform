export interface CreateWarehouseInput {
    name: string;
    address: string;
    city: string;
    manager?: string;
    contact?: string;
    capacity?: number;
}
export declare class WarehouseService {
    create(input: CreateWarehouseInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        city: string;
        manager: string | null;
        contact: string | null;
        capacity: number | null;
    }>;
    listAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        city: string;
        manager: string | null;
        contact: string | null;
        capacity: number | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        city: string;
        manager: string | null;
        contact: string | null;
        capacity: number | null;
    } | null>;
    update(id: string, input: Partial<CreateWarehouseInput>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        city: string;
        manager: string | null;
        contact: string | null;
        capacity: number | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        city: string;
        manager: string | null;
        contact: string | null;
        capacity: number | null;
    }>;
    getWarehouseMachines(warehouseId: string, filters?: {
        category?: string;
        status?: string;
    }): Promise<{
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
    }[]>;
    getWarehouseInventory(warehouseId: string): Promise<{
        total: number;
        byCategory: Record<string, number>;
        byStatus: Record<string, number>;
    }>;
}
//# sourceMappingURL=warehouse.service.d.ts.map