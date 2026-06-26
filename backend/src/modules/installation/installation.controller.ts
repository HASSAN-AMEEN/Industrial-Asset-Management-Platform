import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/types';
import { InstallationService } from './installation.service';
import { CreateInstallationInput, InstallationStatus, UpdateInstallationInput } from './installation.types';

export class InstallationController {
  private installationService = new InstallationService();

  private isValidDateInput(value?: string): boolean {
    if (!value) return true;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const body = req.body as CreateInstallationInput;
      if (!body.machineId) {
        res.status(400).json({ success: false, message: 'machineId is required' });
        return;
      }

      const installation = await this.installationService.create(body, req.user.id);
      res.status(201).json({ success: true, message: 'Installation created successfully', data: installation });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create installation' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, clientId, machineId } = req.query as any;
      const installations = await this.installationService.list({ status, clientId, machineId });

      res.status(200).json({ success: true, data: installations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch installations' });
    }
  }

  async listForMap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, clientId, fromDate, toDate } = req.query as any;

      if (!this.isValidDateInput(fromDate) || !this.isValidDateInput(toDate)) {
        res.status(400).json({ success: false, message: 'Invalid date filter. Use ISO date values.' });
        return;
      }

      const installations = await this.installationService.listForMap({
        status,
        clientId,
        fromDate,
        toDate,
      });

      res.status(200).json({ success: true, data: installations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch map installations' });
    }
  }

  async listUnmapped(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, clientId, fromDate, toDate } = req.query as any;

      if (!this.isValidDateInput(fromDate) || !this.isValidDateInput(toDate)) {
        res.status(400).json({ success: false, message: 'Invalid date filter. Use ISO date values.' });
        return;
      }

      const installations = await this.installationService.listUnmapped({ status, clientId, fromDate, toDate });

      res.status(200).json({ success: true, data: installations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch unmapped installations' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const installation = await this.installationService.getById(id);
      if (!installation) {
        res.status(404).json({ success: false, message: 'Installation not found' });
        return;
      }

      res.status(200).json({ success: true, data: installation });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch installation' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updated = await this.installationService.update(id, req.body as UpdateInstallationInput, req.user.id);
      res.status(200).json({ success: true, message: 'Installation updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update installation' });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await this.installationService.remove(id);
      res.status(200).json({ success: true, message: 'Installation removed successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to remove installation' });
    }
  }
}
