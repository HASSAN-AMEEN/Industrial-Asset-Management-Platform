import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
import { trainingService } from './training.service';
import { ListTrainingMaterialsQuery } from './training.types';

export class TrainingController {
  /**
   * POST /training - Create a new training material
   * Admin only
   * VIDEO: JSON body with videoUrl. PDF: multipart with `file` saved to local disk.
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, machineModel, description, type, videoUrl, thumbnailUrl } = req.body;

      // Validate required fields
      if (!title || !machineModel) {
        res.status(400).json({
          success: false,
          message: 'title and machineModel are required',
        });
        return;
      }

      if (!type || !['VIDEO', 'PDF'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'type must be either VIDEO or PDF',
        });
        return;
      }

      // Validate type-specific fields
      if (type === 'VIDEO' && !videoUrl) {
        res.status(400).json({
          success: false,
          message: 'videoUrl is required for VIDEO type',
        });
        return;
      }

      if (type === 'PDF' && !req.file) {
        res.status(400).json({
          success: false,
          message: 'PDF file is required for PDF type',
        });
        return;
      }

      const trainingMaterial = await trainingService.create(
        {
          title,
          machineModel,
          description,
          type,
          videoUrl,
          thumbnailUrl,
        },
        req.user!.id,
        req.file
      );

      res.status(201).json({
        success: true,
        message: 'Training material created successfully',
        data: trainingMaterial,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create training material',
      });
    }
  }

  /**
   * GET /training - List all training materials with optional filters
   * All authenticated users
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query: ListTrainingMaterialsQuery = {
        search: req.query.search as string | undefined,
        type: req.query.type as 'VIDEO' | 'PDF' | undefined,
        machineModel: req.query.machineModel as string | undefined,
      };

      const trainingMaterials = await trainingService.list(query);

      res.status(200).json({
        success: true,
        message: 'Training materials retrieved successfully',
        data: trainingMaterials,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve training materials',
      });
    }
  }

  /**
   * GET /training/:id - Get a single training material
   * All authenticated users
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trainingMaterial = await trainingService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Training material retrieved successfully',
        data: trainingMaterial,
      });
    } catch (error: any) {
      if (error.message === 'Training material not found') {
        res.status(404).json({
          success: false,
          message: 'Training material not found',
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to retrieve training material',
        });
      }
    }
  }

  /**
   * DELETE /training/:id - Delete a training material
   * Admin only
   * Removes the locally-stored PDF file if applicable.
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await trainingService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Training material deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Training material not found') {
        res.status(404).json({
          success: false,
          message: 'Training material not found',
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to delete training material',
        });
      }
    }
  }
}

export const trainingController = new TrainingController();
