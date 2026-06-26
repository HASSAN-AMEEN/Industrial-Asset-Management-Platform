import { AxiosProgressEvent } from 'axios';
import { api } from './api';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export type TrainingMaterialType = 'VIDEO' | 'PDF';

export interface TrainingMaterial {
  id: string;
  title: string;
  machineModel: string;
  description?: string | null;
  type: TrainingMaterialType;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  thumbnailUrl?: string | null;
  uploadedBy: string;
  createdAt: string;
  users?: {
    id: string;
    email: string;
  };
}

export interface TrainingListFilters {
  search?: string;
  type?: TrainingMaterialType;
  machineModel?: string;
}

export interface CreateVideoMaterialInput {
  title: string;
  machineModel: string;
  videoUrl: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface CreatePdfMaterialInput {
  title: string;
  machineModel: string;
  description?: string;
  fileUri: string;
  fileName: string;
  fileType?: string;
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

export const trainingService = {
  async list(filters?: TrainingListFilters): Promise<TrainingMaterial[]> {
    try {
      const response = await api.get<BackendResponse<TrainingMaterial[]>>('/training', {
        params: filters,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch training materials');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch training materials'));
    }
  },

  async getById(id: string): Promise<TrainingMaterial> {
    try {
      const response = await api.get<BackendResponse<TrainingMaterial>>(`/training/${id}`);

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch training material');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch training material'));
    }
  },

  async createVideo(input: CreateVideoMaterialInput): Promise<TrainingMaterial> {
    try {
      const response = await api.post<BackendResponse<TrainingMaterial>>('/training', {
        title: input.title,
        machineModel: input.machineModel,
        description: input.description,
        type: 'VIDEO',
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create training material');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create training material'));
    }
  },

  async createPdf(
    input: CreatePdfMaterialInput,
    onProgress?: (percent: number) => void
  ): Promise<TrainingMaterial> {
    try {
      const formData = new FormData();
      formData.append('title', input.title);
      formData.append('machineModel', input.machineModel);
      formData.append('type', 'PDF');

      if (input.description) {
        formData.append('description', input.description);
      }

      formData.append('file', {
        uri: input.fileUri,
        name: input.fileName,
        type: input.fileType || 'application/pdf',
      } as any);

      const response = await api.post<BackendResponse<TrainingMaterial>>('/training', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (!event.total || !onProgress) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        },
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to upload PDF material');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to upload PDF material'));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const response = await api.delete<BackendResponse<void>>(`/training/${id}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete training material');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete training material'));
    }
  },
};

export default trainingService;
