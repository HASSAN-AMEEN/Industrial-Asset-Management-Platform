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
  installationLocation?: string | null;
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
}

export interface CreateMachineInput {
  serialNumber: string;
  model: string;
  category: string;
  warehouseId: string;
  purchaseDate?: string;
  cost?: number;
  installationLocation?: string;
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

export const machineService = {
  async list(): Promise<BackendMachine[]> {
    try {
      const response = await api.get<BackendResponse<BackendMachine[]>>('/machines');

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch machines');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch machines'));
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
};

export default machineService;
