import { CreateInstallationInput, UpdateInstallationInput } from './installation.types';
export declare class InstallationService {
    private resolveCoordinates;
    create(input: CreateInstallationInput, installedByUserId: string): Promise<{
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
            installationId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        latitude: number | null;
        longitude: number | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        siteAddress: string | null;
        siteNotes: string | null;
    }>;
    list(params: {
        status?: string;
        clientId?: string;
        machineId?: string;
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
            installationId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        latitude: number | null;
        longitude: number | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        siteAddress: string | null;
        siteNotes: string | null;
    })[]>;
    listForMap(params: {
        status?: string;
        clientId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        id: string;
        client: {
            id: string;
            name: string;
            address: string | null;
            city: string | null;
        } | null;
        machine: {
            id: string;
            model: string;
            category: string;
            serialNumber: string;
        };
        status: import(".prisma/client").$Enums.InstallationStatus;
        latitude: number | null;
        longitude: number | null;
        installedAt: Date;
        siteAddress: string | null;
        siteNotes: string | null;
    }[]>;
    listUnmapped(params: {
        status?: string;
        clientId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        id: string;
        client: {
            id: string;
            name: string;
            address: string | null;
            city: string | null;
        } | null;
        machine: {
            id: string;
            model: string;
            category: string;
            serialNumber: string;
        };
        status: import(".prisma/client").$Enums.InstallationStatus;
        latitude: number | null;
        longitude: number | null;
        installedAt: Date;
        siteAddress: string | null;
        siteNotes: string | null;
    }[]>;
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
            installationId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        latitude: number | null;
        longitude: number | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        siteAddress: string | null;
        siteNotes: string | null;
    }) | null>;
    update(id: string, input: UpdateInstallationInput, updatedByUserId: string): Promise<{
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
            installationId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        latitude: number | null;
        longitude: number | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        siteAddress: string | null;
        siteNotes: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        latitude: number | null;
        longitude: number | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        siteAddress: string | null;
        siteNotes: string | null;
    }>;
}
//# sourceMappingURL=installation.service.d.ts.map