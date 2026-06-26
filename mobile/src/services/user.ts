import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export type AppUserRole = 'SUPER_ADMIN' | 'WAREHOUSE_MANAGER' | 'SALES_OPS' | 'TECHNICIAN';

export interface AppUser {
  id: string;
  email: string;
  role: AppUserRole;
  contact?: string | null;
  warehouseId?: string | null;
  createdAt: string;
  updatedAt: string;
  warehouses?: { id: string; name: string } | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: AppUserRole;
  warehouseId?: string | null;
  contact?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  role?: AppUserRole;
  warehouseId?: string | null;
  password?: string;
  contact?: string | null;
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

export const userService = {
  async list(): Promise<AppUser[]> {
    try {
      const response = await api.get<BackendResponse<AppUser[]>>('/users');
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch users');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch users'));
    }
  },

  async create(input: CreateUserInput): Promise<AppUser> {
    try {
      const response = await api.post<BackendResponse<AppUser>>('/users', input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create user');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create user'));
    }
  },

  async update(id: string, input: UpdateUserInput): Promise<AppUser> {
    try {
      const response = await api.put<BackendResponse<AppUser>>(`/users/${id}`, input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update user');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update user'));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const response = await api.delete<BackendResponse<unknown>>(`/users/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete user');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete user'));
    }
  },
};

export default userService;
