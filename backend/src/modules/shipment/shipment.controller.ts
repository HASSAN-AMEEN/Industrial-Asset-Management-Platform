import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/types';
import { ShipmentService } from './shipment.service';
import { CreateShipmentInput, DeliverShipmentInput, ShipmentStatus, UpdateShipmentInput } from './shipment.types';

export class ShipmentController {
  private shipmentService = new ShipmentService();

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const body = req.body as CreateShipmentInput;
      if (!Array.isArray(body.machineIds) || body.machineIds.length === 0) {
        res.status(400).json({ success: false, message: 'machineIds is required' });
        return;
      }

      const destinationCount = Number(!!body.toWarehouseId) + Number(!!body.toClientId) + Number(!!body.client);
      if (destinationCount !== 1) {
        res.status(400).json({ success: false, message: 'Destination must be exactly one of: toWarehouseId, toClientId, or client' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        if (!req.user.warehouseId) {
          res.status(403).json({ success: false, message: 'Forbidden' });
          return;
        }

        body.fromWarehouseId = req.user.warehouseId;
      }

      if (!body.fromWarehouseId) {
        res.status(400).json({ success: false, message: 'fromWarehouseId is required' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        if (req.user.warehouseId !== body.fromWarehouseId) {
          res.status(403).json({ success: false, message: 'Forbidden' });
          return;
        }
      }

      const shipment = await this.shipmentService.create(body, req.user.id);
      res.status(201).json({ success: true, message: 'Shipment created successfully', data: shipment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create shipment' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, fromDate, toDate, machineId, fromWarehouseId, toWarehouseId, toClientId, search, page, limit } =
        req.query as any;

      // Warehouse Managers see shipments from their own warehouse.
      let effectiveFromWarehouseId = fromWarehouseId as string | undefined;
      if (req.user.role === UserRole.WAREHOUSE_MANAGER) {
        if (!req.user.warehouseId) {
          res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 0, hasMore: false } });
          return;
        }
        effectiveFromWarehouseId = req.user.warehouseId;
      }

      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : undefined;

      const result = await this.shipmentService.list({
        status,
        fromDate,
        toDate,
        machineId,
        fromWarehouseId: effectiveFromWarehouseId,
        toWarehouseId,
        toClientId,
        search,
        page: pageNum,
        limit: limitNum,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.page * result.limit < result.total,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipments' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const shipment = await this.shipmentService.getById(id);
      if (!shipment) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== shipment.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      res.status(200).json({ success: true, data: shipment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipment' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.shipmentService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const updated = await this.shipmentService.update(id, req.body as UpdateShipmentInput, req.user.id);
      res.status(200).json({ success: true, message: 'Shipment updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update shipment' });
    }
  }

  async setStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.shipmentService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const { status, comment } = req.body as { status: ShipmentStatus; comment?: string };
      if (!status) {
        res.status(400).json({ success: false, message: 'status is required' });
        return;
      }

      const updated = await this.shipmentService.setStatus(id, status, req.user.id, comment);
      res.status(200).json({ success: true, message: 'Shipment status updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update shipment status' });
    }
  }

  async deliver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.shipmentService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const delivered = await this.shipmentService.deliver(id, req.body as DeliverShipmentInput, req.user.id);
      res.status(200).json({ success: true, message: 'Shipment delivered successfully', data: delivered });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to deliver shipment' });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const existing = await this.shipmentService.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const payload = req.body as { comment?: string };
      const cancelled = await this.shipmentService.cancel(id, req.user.id, payload.comment);
      res.status(200).json({ success: true, message: 'Shipment cancelled successfully', data: cancelled });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to cancel shipment' });
    }
  }

  async history(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const shipment = await this.shipmentService.getById(id);
      if (!shipment) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      if (req.user.role === UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== shipment.fromWarehouseId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const history = await this.shipmentService.history(id);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipment history' });
    }
  }
}
