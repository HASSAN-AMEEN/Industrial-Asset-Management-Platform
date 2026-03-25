export declare const MACHINE_STATUSES: readonly ["IN_WAREHOUSE", "RESERVED", "UNDER_SHIPMENT", "DELIVERED", "INSTALLED", "UNDER_MAINTENANCE", "RETURNED"];
export type MachineStatus = typeof MACHINE_STATUSES[number];
export interface CreateMachineInput {
    serialNumber: string;
    model: string;
    category: string;
    purchaseDate?: string;
    cost?: number;
    warehouseId: string;
    clientId?: string;
}
export interface UpdateMachineInput {
    serialNumber?: string;
    model?: string;
    category?: string;
    purchaseDate?: string;
    cost?: number;
    warehouseId?: string;
    clientId?: string | null;
    installationId?: string | null;
    status?: MachineStatus;
}
//# sourceMappingURL=machine.types.d.ts.map