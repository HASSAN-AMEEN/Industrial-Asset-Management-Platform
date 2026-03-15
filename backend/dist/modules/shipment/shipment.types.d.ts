export declare const SHIPMENT_STATUSES: readonly ["CREATED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
export type ShipmentStatus = typeof SHIPMENT_STATUSES[number];
export interface CreateShipmentInput {
    machineId: string;
    fromWarehouseId: string;
    toWarehouseId?: string;
    toClientId?: string;
    shipmentDate?: string;
    expectedDeliveryDate?: string;
    notes?: string;
}
export interface UpdateShipmentInput {
    toWarehouseId?: string | null;
    toClientId?: string | null;
    shipmentDate?: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}
export interface DeliverShipmentInput {
    deliveryConfirmation?: string;
    notes?: string;
}
//# sourceMappingURL=shipment.types.d.ts.map