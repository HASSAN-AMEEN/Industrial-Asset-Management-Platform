import { api } from './api';

export type BackendAuthRole =
  | 'SUPER_ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OPS'
  | 'TECHNICIAN';

export interface AuthUser {
  id: string;
  email: string;
  role: BackendAuthRole;
  warehouseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  user: AuthUser;
  token: string;
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

export const authService = {
  async login(email: string, password: string): Promise<AuthPayload> {
    try {
      const response = await api.post<BackendResponse<AuthPayload>>('/auth/login', {
        email,
        password,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Login failed');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  },

  async register(email: string, password: string): Promise<AuthPayload> {
    try {
      const response = await api.post<BackendResponse<AuthPayload>>('/auth/register', {
        email,
        password,
        role: 'SALES_OPS',
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Signup failed');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Signup failed'));
    }
  },

  async me(): Promise<AuthUser> {
    try {
      const response = await api.get<BackendResponse<AuthUser>>('/auth/me');

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user profile');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch user profile'));
    }
  },
};

export default authService;
