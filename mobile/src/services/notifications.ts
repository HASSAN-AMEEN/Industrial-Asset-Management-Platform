import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UnreadNotificationsPayload {
  unreadCount: number;
  breakdown: {
    activeShipments: number;
    maintenanceMachines: number;
    maintenanceInstallations: number;
  };
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

export const notificationsService = {
  async getUnreadCount(): Promise<UnreadNotificationsPayload> {
    try {
      const response = await api.get<BackendResponse<UnreadNotificationsPayload>>(
        '/notifications/unread-count'
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch unread count');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch unread count'));
    }
  },
};

export default notificationsService;
