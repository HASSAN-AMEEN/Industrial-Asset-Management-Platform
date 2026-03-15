import { UserRole } from '@prisma/client';
export type DashboardActivityType = 'shipment' | 'installation' | 'maintenance';
export interface DashboardActivity {
    id: string;
    type: DashboardActivityType;
    title: string;
    description: string;
    createdAt: string;
}
export interface DashboardResponse {
    machineStats: {
        total: number;
        active: number;
        inTransit: number;
        maintenance: number;
    };
    fleetStatus: Array<{
        label: 'Active' | 'Transit' | 'Maintenance';
        value: number;
        percentage: number;
    }>;
    recentActivity: DashboardActivity[];
}
interface DashboardScope {
    role: UserRole;
    warehouseId?: string | null;
}
export declare class DashboardService {
    getDashboard(scope: DashboardScope): Promise<DashboardResponse>;
}
export {};
//# sourceMappingURL=dashboard.service.d.ts.map