export declare const SHIPMENT_STATUSES: readonly ["CREATED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
export type ShipmentStatus = typeof SHIPMENT_STATUSES[number];
export interface CreateShipmentInput {
    machineIds: string[];
    fromWarehouseId: string;
    toWarehouseId?: string;
    toClientId?: string;
    client?: {
        name: string;
        contact?: string;
        address?: string;
        city?: string;
        country?: string;
    };
    shipmentDate?: string;
    expectedDeliveryDate?: string;
    notes?: string;
}
export interface UpdateShipmentInput {
    machineIds?: string[];
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}
export interface DeliverShipmentInput {
    deliveryConfirmation?: string;
    notes?: string;
}
//# sourceMappingURL=shipment.types.d.ts.map