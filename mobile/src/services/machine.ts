import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export type BackendMachineStatus =
  | 'IN_WAREHOUSE'
  | 'RESERVED'
  | 'UNDER_SHIPMENT'
  | 'DELIVERED'
  | 'INSTALLED'
  | 'UNDER_MAINTENANCE'
  | 'RETURNED';

export interface BackendMachine {
  id: string;
  serialNumber: string;
  model: string;
  category: string;
  purchaseDate?: string | null;
  cost?: string | number | null;
  status: BackendMachineStatus;
  warehouseId: string;
  clientId?: string | null;
  installationId?: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
    city?: string | null;
  } | null;
  client?: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
  installation?: {
    id: string;
    siteAddress?: string | null;
    siteNotes?: string | null;
  } | null;
}

export interface CreateMachineInput {
  serialNumber: string;
  model: string;
  category: string;
  warehouseId: string;
  purchaseDate?: string;
  cost?: number;
}

export interface UpdateMachineInput {
  serialNumber?: string;
  model?: string;
  category?: string;
  warehouseId?: string;
  purchaseDate?: string;
  cost?: number;
  installationId?: string;
  status?: BackendMachineStatus;
  comment?: string;
}

export interface MachineHistoryEntry {
  id: string;
  machineId: string;
  fromStatus: string;
  toStatus: BackendMachineStatus;
  changedBy: string;
  changedByName?: string;
  comment?: string | null;
  createdAt: string;
}

export interface InstallationStatusInput {
  installedAt?: string;
  latitude?: number;
  longitude?: number;
  siteAddress?: string;
  siteNotes?: string;
  locationUrl?: string;
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

export interface MachineListParams {
  status?: string;
  warehouseId?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  purchaseFrom?: string;
  purchaseTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedMachines {
  items: BackendMachine[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface PaginatedResponse<T> extends BackendResponse<T[]> {
  pagination?: { total: number; page: number; limit: number; hasMore: boolean };
}

export const machineService = {
  async list(params?: MachineListParams): Promise<PaginatedMachines> {
    try {
      const response = await api.get<PaginatedResponse<BackendMachine>>('/machines', { params });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch machines');
      }

      const items = response.data.data;
      const pg = response.data.pagination;
      return {
        items,
        total: pg?.total ?? items.length,
        page: pg?.page ?? 1,
        limit: pg?.limit ?? items.length,
        hasMore: pg?.hasMore ?? false,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch machines'));
    }
  },

  async getById(id: string): Promise<BackendMachine> {
    try {
      const response = await api.get<BackendResponse<BackendMachine>>(`/machines/${id}`);

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch machine');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch machine'));
    }
  },

  async create(input: CreateMachineInput): Promise<BackendMachine> {
    try {
      const response = await api.post<BackendResponse<BackendMachine>>('/machines', input);

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create machine');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create machine'));
    }
  },

  async update(id: string, input: UpdateMachineInput): Promise<BackendMachine> {
    try {
      const response = await api.put<BackendResponse<BackendMachine>>(`/machines/${id}`, input);

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update machine');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update machine'));
    }
  },

  async updateStatus(
    id: string,
    status: BackendMachineStatus,
    comment?: string,
    installation?: InstallationStatusInput
  ): Promise<BackendMachine> {
    try {
      const response = await api.patch<BackendResponse<BackendMachine>>(`/machines/${id}/status`, {
        status,
        comment,
        installation,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update machine status');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update machine status'));
    }
  },

  async history(machineId: string): Promise<MachineHistoryEntry[]> {
    try {
      const response = await api.get<BackendResponse<MachineHistoryEntry[]>>(
        `/machines/${machineId}/history`
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch machine history');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch machine history'));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const response = await api.delete<BackendResponse<void>>(`/machines/${id}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete machine');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete machine'));
    }
  },
};

export default machineService;
