"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentController = void 0;
const client_1 = require("@prisma/client");
const shipment_service_1 = require("./shipment.service");
class ShipmentController {
    constructor() {
        this.shipmentService = new shipment_service_1.ShipmentService();
    }
    async create(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const body = req.body;
            if (!Array.isArray(body.machineIds) || body.machineIds.length === 0) {
                res.status(400).json({ success: false, message: 'machineIds is required' });
                return;
            }
            const destinationCount = Number(!!body.toWarehouseId) + Number(!!body.toClientId) + Number(!!body.client);
            if (destinationCount !== 1) {
                res.status(400).json({ success: false, message: 'Destination must be exactly one of: toWarehouseId, toClientId, or client' });
                return;
            }
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER) {
                if (req.user.warehouseId !== body.fromWarehouseId) {
                    res.status(403).json({ success: false, message: 'Forbidden' });
                    return;
                }
            }
            const shipment = await this.shipmentService.create(body, req.user.id);
            res.status(201).json({ success: true, message: 'Shipment created successfully', data: shipment });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to create shipment' });
        }
    }
    async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { status, fromDate, toDate, machineId, fromWarehouseId, toWarehouseId, toClientId } = req.query;
            const shipments = await this.shipmentService.list({
                status,
                fromDate,
                toDate,
                machineId,
                fromWarehouseId,
                toWarehouseId,
                toClientId,
            });
            const filtered = req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId
                ? shipments.filter((s) => s.fromWarehouseId === req.user.warehouseId)
                : shipments;
            res.status(200).json({ success: true, data: filtered });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipments' });
        }
    }
    async getById(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== shipment.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            res.status(200).json({ success: true, data: shipment });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipment' });
        }
    }
    async update(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const updated = await this.shipmentService.update(id, req.body, req.user.id);
            res.status(200).json({ success: true, message: 'Shipment updated successfully', data: updated });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to update shipment' });
        }
    }
    async setStatus(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const { status, comment } = req.body;
            if (!status) {
                res.status(400).json({ success: false, message: 'status is required' });
                return;
            }
            const updated = await this.shipmentService.setStatus(id, status, req.user.id, comment);
            res.status(200).json({ success: true, message: 'Shipment status updated successfully', data: updated });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to update shipment status' });
        }
    }
    async deliver(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const delivered = await this.shipmentService.deliver(id, req.body, req.user.id);
            res.status(200).json({ success: true, message: 'Shipment delivered successfully', data: delivered });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to deliver shipment' });
        }
    }
    async cancel(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== existing.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const payload = req.body;
            const cancelled = await this.shipmentService.cancel(id, req.user.id, payload.comment);
            res.status(200).json({ success: true, message: 'Shipment cancelled successfully', data: cancelled });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to cancel shipment' });
        }
    }
    async history(req, res) {
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
            if (req.user.role === client_1.UserRole.WAREHOUSE_MANAGER && req.user.warehouseId !== shipment.fromWarehouseId) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const history = await this.shipmentService.history(id);
            res.status(200).json({ success: true, data: history });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipment history' });
        }
    }
}
exports.ShipmentController = ShipmentController;
//# sourceMappingURL=shipment.controller.js.map