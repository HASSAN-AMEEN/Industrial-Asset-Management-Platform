import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';

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

const isWarehouseManagerScoped = (scope: NotificationScope): boolean => {
  return scope.role === UserRole.WAREHOUSE_MANAGER && !!scope.warehouseId;
};

export class NotificationsService {
  async getUnreadCount(scope: NotificationScope): Promise<UnreadNotificationsResponse> {
    const warehouseScoped = isWarehouseManagerScoped(scope);

    const [activeShipments, maintenanceMachines, maintenanceInstallations] = await Promise.all([
      prisma.shipment.count({
        where: {
          status: {
            in: ['CREATED', 'DISPATCHED', 'IN_TRANSIT'],
          },
          ...(warehouseScoped
            ? {
                OR: [
                  { fromWarehouseId: scope.warehouseId! },
                  { toWarehouseId: scope.warehouseId! },
                ],
              }
            : {}),
        },
      }),
      prisma.machine.count({
        where: {
          status: 'UNDER_MAINTENANCE',
          ...(warehouseScoped ? { warehouseId: scope.warehouseId! } : {}),
        },
      }),
      prisma.installation.count({
        where: {
          status: 'MAINTENANCE',
          ...(warehouseScoped
            ? {
                machine: {
                  warehouseId: scope.warehouseId!,
                },
              }
            : {}),
        },
      }),
    ]);

    const unreadCount = activeShipments + maintenanceMachines + maintenanceInstallations;

    return {
      unreadCount,
      breakdown: {
        activeShipments,
        maintenanceMachines,
        maintenanceInstallations,
      },
    };
  }
}
