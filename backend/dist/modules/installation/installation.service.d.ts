import { CreateInstallationInput, UpdateInstallationInput } from './installation.types';
export declare class InstallationService {
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
            installationLocation: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        latitude: number | null;
        longitude: number | null;
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
            installationLocation: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        latitude: number | null;
        longitude: number | null;
        siteAddress: string | null;
        siteNotes: string | null;
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        latitude: number | null;
        longitude: number | null;
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
            installationLocation: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        latitude: number | null;
        longitude: number | null;
        siteAddress: string | null;
        siteNotes: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InstallationStatus;
        clientId: string | null;
        machineId: string;
        installedAt: Date;
        installedBy: string;
        latitude: number | null;
        longitude: number | null;
        siteAddress: string | null;
        siteNotes: string | null;
    }>;
}
//# sourceMappingURL=installation.service.d.ts.map