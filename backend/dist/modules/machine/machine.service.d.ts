import { MachineStatus, CreateMachineInput, UpdateMachineInput } from './machine.types';
export declare class MachineService {
    create(input: CreateMachineInput, changedByUserId: string): Promise<{
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
    }>;
    list(params: {
        status?: string;
        warehouseId?: string;
        model?: string;
        serialNumber?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<({
        client: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
        warehouse: {
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
    } & {
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
    })[]>;
    getById(id: string): Promise<({
        client: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            contact: string | null;
            country: string | null;
        } | null;
        warehouse: {
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
    } & {
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
    }) | null>;
    update(id: string, input: UpdateMachineInput, changedByUserId: string, comment?: string): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    updateStatus(id: string, newStatus: MachineStatus, changedByUserId: string, comment?: string): Promise<{
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
    }>;
    history(machineId: string): Promise<{
        id: string;
        createdAt: Date;
        fromStatus: string;
        toStatus: string;
        changedBy: string;
        comment: string | null;
        machineId: string;
    }[]>;
}
//# sourceMappingURL=machine.service.d.ts.map