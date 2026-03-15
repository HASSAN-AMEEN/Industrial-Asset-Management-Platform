import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';

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

const toPercentage = (part: number, total: number): number => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const isWarehouseManagerScoped = (scope: DashboardScope): boolean => {
  return scope.role === UserRole.WAREHOUSE_MANAGER && !!scope.warehouseId;
};

export class DashboardService {
  async getDashboard(scope: DashboardScope): Promise<DashboardResponse> {
    const machineWhere = isWarehouseManagerScoped(scope)
      ? { warehouseId: scope.warehouseId! }
      : {};

    const [
      totalMachines,
      inTransitMachines,
      maintenanceMachines,
      recentShipments,
      recentInstallations,
      recentMaintenanceUpdates,
    ] = await Promise.all([
      prisma.machine.count({ where: machineWhere }),
      prisma.machine.count({ where: { ...machineWhere, status: 'UNDER_SHIPMENT' } }),
      prisma.machine.count({ where: { ...machineWhere, status: 'UNDER_MAINTENANCE' } }),
      prisma.shipment.findMany({
        where: isWarehouseManagerScoped(scope)
          ? {
              OR: [
                { fromWarehouseId: scope.warehouseId! },
                { toWarehouseId: scope.warehouseId! },
              ],
            }
          : undefined,
        include: {
          machine: {
            select: {
              model: true,
              serialNumber: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.installation.findMany({
        where: isWarehouseManagerScoped(scope)
          ? {
              machine: {
                warehouseId: scope.warehouseId!,
              },
            }
          : undefined,
        include: {
          machine: {
            select: {
              model: true,
              serialNumber: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.machineStatusHistory.findMany({
        where: {
          toStatus: 'UNDER_MAINTENANCE',
          ...(isWarehouseManagerScoped(scope)
            ? {
                machine: {
                  warehouseId: scope.warehouseId!,
                },
              }
            : {}),
        },
        include: {
          machine: {
            select: {
              model: true,
              serialNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const activeMachines = Math.max(totalMachines - inTransitMachines - maintenanceMachines, 0);

    const shipmentActivities: DashboardActivity[] = recentShipments.map((shipment) => ({
      id: `shipment-${shipment.id}`,
      type: 'shipment',
      title: `Shipment ${shipment.status}`,
      description: `${shipment.machine.model} (${shipment.machine.serialNumber})`,
      createdAt: shipment.updatedAt.toISOString(),
    }));

    const installationActivities: DashboardActivity[] = recentInstallations.map((installation) => ({
      id: `installation-${installation.id}`,
      type: 'installation',
      title: `Installation ${installation.status}`,
      description: `${installation.machine.model} (${installation.machine.serialNumber})`,
      createdAt: installation.updatedAt.toISOString(),
    }));

    const maintenanceActivities: DashboardActivity[] = recentMaintenanceUpdates.map((entry) => ({
      id: `maintenance-${entry.id}`,
      type: 'maintenance',
      title: 'Maintenance Update',
      description: `${entry.machine.model} (${entry.machine.serialNumber}) moved to maintenance`,
      createdAt: entry.createdAt.toISOString(),
    }));

    const recentActivity = [...shipmentActivities, ...installationActivities, ...maintenanceActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      machineStats: {
        total: totalMachines,
        active: activeMachines,
        inTransit: inTransitMachines,
        maintenance: maintenanceMachines,
      },
      fleetStatus: [
        {
          label: 'Active',
          value: activeMachines,
          percentage: toPercentage(activeMachines, totalMachines),
        },
        {
          label: 'Transit',
          value: inTransitMachines,
          percentage: toPercentage(inTransitMachines, totalMachines),
        },
        {
          label: 'Maintenance',
          value: maintenanceMachines,
          percentage: toPercentage(maintenanceMachines, totalMachines),
        },
      ],
      recentActivity,
    };
  }
}
