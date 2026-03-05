import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
import { WarehouseService } from './warehouse.service';

export class WarehouseController {
  private warehouseService = new WarehouseService();

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, city, manager, contact, capacity } = req.body;

      if (!name || !address || !city) {
        res.status(400).json({
          success: false,
          message: 'name, address, and city are required',
        });
        return;
      }

      const warehouse = await this.warehouseService.create({
        name,
        address,
        city,
        manager,
        contact,
        capacity,
      });

      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: warehouse,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create warehouse',
      });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role === 'WAREHOUSE_MANAGER') {
        if (!req.user.warehouseId) {
          res.status(200).json({
            success: true,
            data: [],
          });
          return;
        }

        const warehouse = await this.warehouseService.getById(req.user.warehouseId);
        res.status(200).json({
          success: true,
          data: warehouse ? [warehouse] : [],
        });
        return;
      }

      const warehouses = await this.warehouseService.listAll();
      res.status(200).json({
        success: true,
        data: warehouses,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch warehouses',
      });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId !== id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const warehouse = await this.warehouseService.getById(id);

      if (!warehouse) {
        res.status(404).json({
          success: false,
          message: 'Warehouse not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: warehouse,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch warehouse',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, address, city, manager, contact, capacity } = req.body;

      const warehouse = await this.warehouseService.update(id, {
        name,
        address,
        city,
        manager,
        contact,
        capacity,
      });

      res.status(200).json({
        success: true,
        message: 'Warehouse updated successfully',
        data: warehouse,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update warehouse',
      });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.warehouseService.remove(id);

      res.status(200).json({
        success: true,
        message: 'Warehouse deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete warehouse',
      });
    }
  }

  async getMachines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { category, status } = req.query;

      // Check warehouse access permissions
      if (req.user?.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId !== id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const machines = await this.warehouseService.getWarehouseMachines(id, {
        category: category as string,
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: machines,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch warehouse machines',
      });
    }
  }

  async getInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check warehouse access permissions
      if (req.user?.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId !== id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const inventory = await this.warehouseService.getWarehouseInventory(id);

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch warehouse inventory',
      });
    }
  }
}
