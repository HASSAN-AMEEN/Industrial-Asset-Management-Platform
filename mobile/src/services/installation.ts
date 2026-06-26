import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface InstallationOption {
  id: string;
  machineId: string;
  clientId?: string | null;
  siteAddress?: string | null;
  siteNotes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
  installedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallationMapItem {
  id: string;
  status: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
  installedAt: string;
  siteAddress?: string | null;
  siteNotes?: string | null;
  latitude: number;
  longitude: number;
  machine: {
    id: string;
    serialNumber: string;
    model: string;
    category: string;
  };
  client: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
}

export interface InstallationUnmappedItem {
  id: string;
  status: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
  installedAt: string;
  siteAddress?: string | null;
  siteNotes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  machine: {
    id: string;
    serialNumber: string;
    model: string;
    category: string;
  };
  client: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
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

export const installationService = {
  async list(): Promise<InstallationOption[]> {
    try {
      const response = await api.get<BackendResponse<InstallationOption[]>>('/installations');
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch installations');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch installations'));
    }
  },

  async listForMap(params?: {
    status?: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<InstallationMapItem[]> {
    try {
      const response = await api.get<BackendResponse<InstallationMapItem[]>>('/installations/map', { params });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch map installations');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch map installations'));
    }
  },

  async listUnmapped(params?: {
    status?: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<InstallationUnmappedItem[]> {
    try {
      const response = await api.get<BackendResponse<InstallationUnmappedItem[]>>('/installations/unmapped', { params });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch unmapped installations');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch unmapped installations'));
    }
  },
};

export default installationService;
