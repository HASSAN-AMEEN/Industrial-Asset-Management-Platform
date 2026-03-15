"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const warehouse_service_1 = require("./warehouse.service");
class WarehouseController {
    constructor() {
        this.warehouseService = new warehouse_service_1.WarehouseService();
    }
    async create(req, res) {
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create warehouse',
            });
        }
    }
    async list(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch warehouses',
            });
        }
    }
    async getById(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch warehouse',
            });
        }
    }
    async update(req, res) {
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update warehouse',
            });
        }
    }
    async remove(req, res) {
        try {
            const { id } = req.params;
            await this.warehouseService.remove(id);
            res.status(200).json({
                success: true,
                message: 'Warehouse deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete warehouse',
            });
        }
    }
    async getMachines(req, res) {
        try {
            const { id } = req.params;
            const { category, status } = req.query;
            if (req.user?.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId !== id) {
                res.status(403).json({
                    success: false,
                    message: 'Forbidden',
                });
                return;
            }
            const machines = await this.warehouseService.getWarehouseMachines(id, {
                category: category,
                status: status,
            });
            res.status(200).json({
                success: true,
                data: machines,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch warehouse machines',
            });
        }
    }
    async getInventory(req, res) {
        try {
            const { id } = req.params;
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch warehouse inventory',
            });
        }
    }
    async listManagers(req, res) {
        try {
            const managers = await this.warehouseService.listWarehouseManagers();
            res.status(200).json({
                success: true,
                data: managers,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch warehouse managers',
            });
        }
    }
    async assignManager(req, res) {
        try {
            const { id } = req.params;
            const { managerUserId } = req.body;
            if (!managerUserId) {
                res.status(400).json({
                    success: false,
                    message: 'managerUserId is required',
                });
                return;
            }
            const data = await this.warehouseService.assignManager(id, managerUserId);
            res.status(200).json({
                success: true,
                message: 'Warehouse manager assigned successfully',
                data,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to assign warehouse manager',
            });
        }
    }
}
exports.WarehouseController = WarehouseController;
//# sourceMappingURL=warehouse.controller.js.map