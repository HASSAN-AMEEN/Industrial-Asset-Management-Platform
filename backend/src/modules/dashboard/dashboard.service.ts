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

// Lifecycle order used to present the status breakdown consistently.
const MACHINE_STATUS_ORDER = [
  'IN_WAREHOUSE',
  'RESERVED',
  'UNDER_SHIPMENT',
  'DELIVERED',
  'INSTALLED',
  'UNDER_MAINTENANCE',
  'RETURNED',
] as const;

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
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  machinesPerWarehouse: Array<{ warehouseId: string; warehouseName: string; count: number }>;
  installationsCount: number;
  shipmentsInTransit: number;
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
    const scoped = isWarehouseManagerScoped(scope);
    const machineWhere = scoped ? { warehouseId: scope.warehouseId! } : {};
    const installationWhere = scoped
      ? { machines_installations_machineIdTomachines: { warehouseId: scope.warehouseId! } }
      : {};
    const shipmentWhere = scoped
      ? {
          OR: [
            { fromWarehouseId: scope.warehouseId! },
            { toWarehouseId: scope.warehouseId! },
          ],
        }
      : {};

    const [
      statusGroups,
      warehouseGroups,
      installationsCount,
      shipmentsInTransit,
      recentShipments,
      recentInstallations,
      recentMaintenanceUpdates,
    ] = await Promise.all([
      // One grouped query covers total + every status bucket.
      prisma.machines.groupBy({ by: ['status'], where: machineWhere, _count: { _all: true } }),
      prisma.machines.groupBy({ by: ['warehouseId'], where: machineWhere, _count: { _all: true } }),
      prisma.installations.count({ where: installationWhere }),
      prisma.shipments.count({ where: { ...shipmentWhere, status: 'IN_TRANSIT' } }),
      prisma.shipments.findMany({
        where: isWarehouseManagerScoped(scope)
          ? {
              OR: [
                { fromWarehouseId: scope.warehouseId! },
                { toWarehouseId: scope.warehouseId! },
              ],
            }
          : undefined,
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.installations.findMany({
        where: isWarehouseManagerScoped(scope)
          ? {
              machines_installations_machineIdTomachines: {
                warehouseId: scope.warehouseId!,
              },
            }
          : undefined,
        include: {
          machines_installations_machineIdTomachines: {
            select: {
              model: true,
              serialNumber: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.machine_status_history.findMany({
        where: {
          toStatus: 'UNDER_MAINTENANCE',
          ...(isWarehouseManagerScoped(scope)
            ? {
                machines: {
                  warehouseId: scope.warehouseId!,
                },
              }
            : {}),
        },
        include: {
          machines: {
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

    // Derive every machine count from the single grouped query.
    const countByStatus = new Map<string, number>(
      statusGroups.map((group) => [group.status, group._count._all])
    );
    const totalMachines = statusGroups.reduce((sum, group) => sum + group._count._all, 0);
    const inTransitMachines = countByStatus.get('UNDER_SHIPMENT') ?? 0;
    const maintenanceMachines = countByStatus.get('UNDER_MAINTENANCE') ?? 0;
    const activeMachines = Math.max(totalMachines - inTransitMachines - maintenanceMachines, 0);

    const statusBreakdown = MACHINE_STATUS_ORDER.map((status) => {
      const count = countByStatus.get(status) ?? 0;
      return { status, count, percentage: toPercentage(count, totalMachines) };
    });

    // Resolve warehouse names for the per-warehouse breakdown in one query.
    const warehouseIds = warehouseGroups.map((group) => group.warehouseId);
    const warehouses = warehouseIds.length
      ? await prisma.warehouses.findMany({
          where: { id: { in: warehouseIds } },
          select: { id: true, name: true },
        })
      : [];
    const warehouseNameById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));
    const machinesPerWarehouse = warehouseGroups
      .map((group) => ({
        warehouseId: group.warehouseId,
        warehouseName: warehouseNameById.get(group.warehouseId) ?? 'Unknown',
        count: group._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const shipmentActivities: DashboardActivity[] = recentShipments.map((shipment) => ({
      id: `shipment-${shipment.id}`,
      type: 'shipment',
      title: `Shipment ${shipment.status}`,
      description: shipment.toClientId ? 'Destination: Client' : 'Destination: Warehouse',
      createdAt: shipment.updatedAt.toISOString(),
    }));

    const installationActivities: DashboardActivity[] = recentInstallations.map((installation) => ({
      id: `installation-${installation.id}`,
      type: 'installation',
      title: `Installation ${installation.status}`,
      description: `${installation.machines_installations_machineIdTomachines.model} (${installation.machines_installations_machineIdTomachines.serialNumber})`,
      createdAt: installation.updatedAt.toISOString(),
    }));

    const maintenanceActivities: DashboardActivity[] = recentMaintenanceUpdates.map((entry) => ({
      id: `maintenance-${entry.id}`,
      type: 'maintenance',
      title: 'Maintenance Update',
      description: `${entry.machines.model} (${entry.machines.serialNumber}) moved to maintenance`,
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
      statusBreakdown,
      machinesPerWarehouse,
      installationsCount,
      shipmentsInTransit,
      recentActivity,
    };
  }
}
