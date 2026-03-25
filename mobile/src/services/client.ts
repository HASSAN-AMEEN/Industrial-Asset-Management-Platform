import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface BackendClient {
  id: string;
  name: string;
  contact?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    return e.response?.data?.message || e.response?.data?.error || e.message || fallback;
  }
  return fallback;
};

export const clientService = {
  async list(params?: { q?: string; city?: string }): Promise<BackendClient[]> {
    try {
      const response = await api.get<BackendResponse<BackendClient[]>>('/clients', { params });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch clients');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch clients'));
    }
  },
};

export default clientService;
