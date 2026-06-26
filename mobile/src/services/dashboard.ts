import { api } from './api';
import { ActivityType } from '../types';

export interface DashboardMachineStats {
  total: number;
  active: number;
  inTransit: number;
  maintenance: number;
}

export interface DashboardFleetStatusItem {
  label: 'Active' | 'Transit' | 'Maintenance';
  value: number;
  percentage: number;
}

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
}

export interface DashboardStatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
}

export interface DashboardWarehouseItem {
  warehouseId: string;
  warehouseName: string;
  count: number;
}

export interface DashboardPayload {
  machineStats: DashboardMachineStats;
  fleetStatus: DashboardFleetStatusItem[];
  statusBreakdown: DashboardStatusBreakdownItem[];
  machinesPerWarehouse: DashboardWarehouseItem[];
  installationsCount: number;
  shipmentsInTransit: number;
  recentActivity: DashboardActivity[];
}

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };

    return (
      maybeAxios.response?.data?.message ||
      maybeAxios.response?.data?.error ||
      maybeAxios.message ||
      fallback
    );
  }

  return fallback;
};

export const dashboardService = {
  async getDashboard(): Promise<DashboardPayload> {
    try {
      const response = await api.get<BackendResponse<DashboardPayload>>('/dashboard');

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch dashboard');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch dashboard'));
    }
  },
};

export default dashboardService;
