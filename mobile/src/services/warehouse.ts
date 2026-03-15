import { api } from './api';
import authService from './auth';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  manager?: string | null;
  contact?: string | null;
  capacity?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseManager {
  id: string;
  email: string;
  warehouseId?: string | null;
  createdAt: string;
}

export interface CreateWarehouseInput {
  name: string;
  address: string;
  city: string;
  manager?: string;
  contact?: string;
  capacity?: number;
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

export const warehouseService = {
  async list(): Promise<Warehouse[]> {
    try {
      const response = await api.get<BackendResponse<Warehouse[]>>('/warehouses');
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch warehouses');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch warehouses'));
    }
  },

  async create(input: CreateWarehouseInput): Promise<Warehouse> {
    try {
      const response = await api.post<BackendResponse<Warehouse>>('/warehouses', input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create warehouse');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create warehouse'));
    }
  },

  async update(id: string, input: Partial<CreateWarehouseInput>): Promise<Warehouse> {
    try {
      const response = await api.put<BackendResponse<Warehouse>>(`/warehouses/${id}`, input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update warehouse');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update warehouse'));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const response = await api.delete<BackendResponse<void>>(`/warehouses/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete warehouse');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete warehouse'));
    }
  },

  async listManagers(): Promise<WarehouseManager[]> {
    try {
      const response = await api.get<BackendResponse<WarehouseManager[]>>('/warehouses/managers');
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch managers');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch managers'));
    }
  },

  async assignManager(warehouseId: string, managerUserId: string): Promise<void> {
    try {
      const response = await api.patch<BackendResponse<unknown>>(
        `/warehouses/${warehouseId}/assign-manager`,
        { managerUserId }
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to assign manager');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to assign manager'));
    }
  },

  async createManager(email: string, password: string, warehouseId: string): Promise<void> {
    try {
      await authService.registerWithRole({
        email,
        password,
        role: 'WAREHOUSE_MANAGER',
        warehouseId,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create warehouse manager'));
    }
  },
};

export default warehouseService;
