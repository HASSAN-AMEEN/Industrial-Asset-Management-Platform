import { TrainingMaterialType } from '@prisma/client';

export interface CreateTrainingMaterialRequest {
  title: string;
  machineModel: string;
  description?: string;
  type: 'VIDEO' | 'PDF';
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface TrainingMaterialResponse {
  id: string;
  title: string;
  machineModel: string;
  description?: string;
  type: TrainingMaterialType;
  videoUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface ListTrainingMaterialsQuery {
  search?: string;
  type?: 'VIDEO' | 'PDF';
  machineModel?: string;
}
