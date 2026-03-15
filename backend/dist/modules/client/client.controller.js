"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const client_service_1 = require("./client.service");
class ClientController {
    constructor() {
        this.clientService = new client_service_1.ClientService();
    }
    async create(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const body = req.body;
            if (!body.name) {
                res.status(400).json({ success: false, message: 'name is required' });
                return;
            }
            const client = await this.clientService.create(body, req.user.id);
            res.status(201).json({ success: true, message: 'Client created successfully', data: client });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to create client' });
        }
    }
    async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { q, city } = req.query;
            const clients = await this.clientService.list({ q, city });
            res.status(200).json({ success: true, data: clients });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch clients' });
        }
    }
    async getById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            const client = await this.clientService.getById(id);
            if (!client) {
                res.status(404).json({ success: false, message: 'Client not found' });
                return;
            }
            res.status(200).json({ success: true, data: client });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch client' });
        }
    }
    async update(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            const updated = await this.clientService.update(id, req.body);
            res.status(200).json({ success: true, message: 'Client updated successfully', data: updated });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to update client' });
        }
    }
    async remove(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            await this.clientService.remove(id);
            res.status(200).json({ success: true, message: 'Client deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message || 'Failed to delete client' });
        }
    }
}
exports.ClientController = ClientController;
//# sourceMappingURL=client.controller.js.map