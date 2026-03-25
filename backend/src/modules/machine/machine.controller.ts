import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/types';
import { MachineService } from './machine.service';
import { MachineStatus } from './machine.types';

export class MachineController {
  private machineService = new MachineService();

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { serialNumber, model, category, purchaseDate, cost, warehouseId, clientId } = req.body;

      if (!serialNumber || !model || !category) {
        res.status(400).json({ success: false, message: 'serialNumber, model, category are required' });
        return;
      }

      let finalWarehouseId = warehouseId as string | undefined;

      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        if (!req.user.warehouseId) {
          res.status(403).json({ success: false, message: 'Forbidden' });
          return;
        }
        finalWarehouseId = req.user.warehouseId ?? undefined;
      }

      if (!finalWarehouseId) {
        res.status(400).json({ success: false, message: 'warehouseId is required' });
        return;
      }

      const machine = await this.machineService.create(
        {
          serialNumber,
          model,
          category,
          purchaseDate,
          cost,
          warehouseId: finalWarehouseId,
          clientId,
        },
        req.user.id
      );

      res.status(201).json({ success: true, message: 'Machine created successfully', data: machine });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create machine' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, warehouseId, model, serialNumber, fromDate, toDate } = req.query as any;

      let effectiveWarehouseId = warehouseId as string | undefined;
      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        effectiveWarehouseId = (req.user.warehouseId ?? undefined) || '__none__';
      }

      const machines = await this.machineService.list({
        status,
        warehouseId: effectiveWarehouseId === '__none__' ? undefined : effectiveWarehouseId,
        model,
        serialNumber,
        fromDate,
        toDate,
      });

      const filtered =
        req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId
          ? machines.filter(m => m.warehouseId === req.user!.warehouseId)
          : machines;

      res.status(200).json({ success: true, data: filtered });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch machines' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const machine = await this.machineService.getById(id);

      if (!machine) {
        res.status(404).json({ success: false, message: 'Machine not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== machine.warehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      res.status(200).json({ success: true, data: machine });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch machine' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.machineService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Machine not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.warehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const { serialNumber, model, category, purchaseDate, cost, warehouseId, clientId, installationId, status, comment } = req.body;

      let finalWarehouseId = warehouseId as string | undefined;
      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        finalWarehouseId = req.user.warehouseId ?? undefined;
      }

      const updated = await this.machineService.update(
        id,
        {
          serialNumber,
          model,
          category,
          purchaseDate,
          cost,
          warehouseId: finalWarehouseId,
          clientId,
          installationId,
          status,
        },
        req.user.id,
        comment
      );

      res.status(200).json({ success: true, message: 'Machine updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update machine' });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.machineService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Machine not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.warehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      await this.machineService.remove(id);
      res.status(200).json({ success: true, message: 'Machine deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete machine' });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.machineService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Machine not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.warehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const { status, comment, installation } = req.body as {
        status: MachineStatus;
        comment?: string;
        installation?: {
          installedAt?: string;
          latitude?: number;
          longitude?: number;
          siteAddress?: string;
          siteNotes?: string;
        };
      };
      if (!status) {
        res.status(400).json({ success: false, message: 'status is required' });
        return;
      }

      const updated = await this.machineService.updateStatus(id, status, req.user.id, comment, installation);
      res.status(200).json({ success: true, message: 'Status updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update status' });
    }
  }

  async history(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const machine = await this.machineService.getById(id);
      if (!machine) {
        res.status(404).json({ success: false, message: 'Machine not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== machine.warehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const history = await this.machineService.history(id);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch history' });
    }
  }
}
