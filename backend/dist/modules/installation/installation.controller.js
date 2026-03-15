"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallationController = void 0;
const installation_service_1 = require("./installation.service");
class InstallationController {
    constructor() {
        this.installationService = new installation_service_1.InstallationService();
    }
    async create(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const body = req.body;
            if (!body.machineId) {
                res.status(400).json({ success: false, message: 'machineId is required' });
                return;
            }
            const installation = await this.installationService.create(body, req.user.id);
            res.status(201).json({ success: true, message: 'Installation created successfully', data: installation });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to create installation' });
        }
    }
    async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { status, clientId, machineId } = req.query;
            const installations = await this.installationService.list({ status, clientId, machineId });
            res.status(200).json({ success: true, data: installations });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch installations' });
        }
    }
    async getById(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch installation' });
        }
    }
    async update(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            const updated = await this.installationService.update(id, req.body, req.user.id);
            res.status(200).json({ success: true, message: 'Installation updated successfully', data: updated });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to update installation' });
        }
    }
    async remove(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            await this.installationService.remove(id);
            res.status(200).json({ success: true, message: 'Installation removed successfully' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to remove installation' });
        }
    }
}
exports.InstallationController = InstallationController;
//# sourceMappingURL=installation.controller.js.map