import { UserRole } from '@prisma/client';
interface NotificationScope {
    role: UserRole;
    warehouseId?: string | null;
}
export interface UnreadNotificationsResponse {
    unreadCount: number;
    breakdown: {
        activeShipments: number;
        maintenanceMachines: number;
        maintenanceInstallations: number;
    };
}
export declare class NotificationsService {
    getUnreadCount(scope: NotificationScope): Promise<UnreadNotificationsResponse>;
}
export {};
//# sourceMappingURL=notifications.service.d.ts.map