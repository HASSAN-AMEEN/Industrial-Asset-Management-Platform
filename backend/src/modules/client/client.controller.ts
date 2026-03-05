import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/types';
import { ClientService } from './client.service';
import { CreateClientInput, UpdateClientInput } from './client.types';

export class ClientController {
  private clientService = new ClientService();

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const body = req.body as CreateClientInput;
      if (!body.name) {
        res.status(400).json({ success: false, message: 'name is required' });
        return;
      }

      const client = await this.clientService.create(body, req.user.id);
      res.status(201).json({ success: true, message: 'Client created successfully', data: client });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create client' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { q, city } = req.query as any;
      const clients = await this.clientService.list({ q, city });
      res.status(200).json({ success: true, data: clients });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch clients' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch client' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updated = await this.clientService.update(id, req.body as UpdateClientInput);
      res.status(200).json({ success: true, message: 'Client updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update client' });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await this.clientService.remove(id);
      res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete client' });
    }
  }
}
