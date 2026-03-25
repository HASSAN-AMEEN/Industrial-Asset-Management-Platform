import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface InstallationOption {
  id: string;
  machineId: string;
  siteAddress?: string | null;
  siteNotes?: string | null;
  status: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
  createdAt: string;
  updatedAt: string;
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
};

export default installationService;
