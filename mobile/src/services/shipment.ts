import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface BackendShipment {
  id: string;
  trackingId?: string | null;
  status: string;
  fromWarehouseId: string;
  toWarehouseId?: string | null;
  toClientId?: string | null;
  shipmentDate?: string | null;
  expectedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  fromWarehouse?: { id: string; name: string; city: string } | null;
  toWarehouse?: { id: string; name: string; city: string } | null;
  toClient?: { id: string; name: string; city?: string | null } | null;
  items?: { machine: { id: string; serialNumber: string; model: string; status: string } }[];
}

export interface ShipmentHistoryEntry {
  id: string;
  shipmentId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  comment?: string | null;
  createdAt: string;
  changedByUser?: {
    id: string;
    email: string;
  } | null;
}

export interface CreateShipmentInput {
  machineIds: string[];
  fromWarehouseId: string;
  toWarehouseId?: string;
  toClientId?: string;
  client?: {
    name: string;
    contact?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  shipmentDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface UpdateShipmentInput {
  machineIds?: string[];
  expectedDeliveryDate?: string | null;
  notes?: string | null;
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

export interface ShipmentListParams {
  status?: string;
  machineId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedShipments {
  items: BackendShipment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface PaginatedResponse<T> extends BackendResponse<T[]> {
  pagination?: { total: number; page: number; limit: number; hasMore: boolean };
}

export const shipmentService = {
  async list(params?: ShipmentListParams): Promise<PaginatedShipments> {
    try {
      const response = await api.get<PaginatedResponse<BackendShipment>>('/shipments', { params });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch shipments');
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
      throw new Error(getErrorMessage(error, 'Failed to fetch shipments'));
    }
  },

  async getById(id: string): Promise<BackendShipment> {
    try {
      const response = await api.get<BackendResponse<BackendShipment>>(`/shipments/${id}`);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Shipment not found');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch shipment'));
    }
  },

  async create(input: CreateShipmentInput): Promise<BackendShipment> {
    try {
      const response = await api.post<BackendResponse<BackendShipment>>('/shipments', input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create shipment');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create shipment'));
    }
  },

  async update(id: string, input: UpdateShipmentInput): Promise<BackendShipment> {
    try {
      const response = await api.put<BackendResponse<BackendShipment>>(`/shipments/${id}`, input);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update shipment');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update shipment'));
    }
  },

  async setStatus(id: string, status: string, notes?: string): Promise<BackendShipment> {
    try {
      const response = await api.patch<BackendResponse<BackendShipment>>(`/shipments/${id}/status`, { status, comment: notes });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update shipment status');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update shipment status'));
    }
  },

  async cancel(id: string, comment?: string): Promise<BackendShipment> {
    try {
      const response = await api.patch<BackendResponse<BackendShipment>>(`/shipments/${id}/cancel`, { comment });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to cancel shipment');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to cancel shipment'));
    }
  },

  async deliver(id: string, notes?: string): Promise<BackendShipment> {
    try {
      const response = await api.patch<BackendResponse<BackendShipment>>(`/shipments/${id}/deliver`, { notes });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to deliver shipment');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to deliver shipment'));
    }
  },

  async history(id: string): Promise<ShipmentHistoryEntry[]> {
    try {
      const response = await api.get<BackendResponse<ShipmentHistoryEntry[]>>(`/shipments/${id}/history`);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch history');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch shipment history'));
    }
  },
};

export default shipmentService;
