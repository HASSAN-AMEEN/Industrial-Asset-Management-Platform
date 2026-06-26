import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
import { UserService } from './user.service';

export class UserController {
  private userService = new UserService();

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await this.userService.list();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await this.userService.getById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch user' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, role, warehouseId, contact } = req.body;
      const user = await this.userService.create({ email, password, role, warehouseId, contact });
      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create user' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, role, warehouseId, password, contact } = req.body;
      const user = await this.userService.update(req.params.id, { email, role, warehouseId, password, contact });
      res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update user' });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await this.userService.remove(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete user' });
    }
  }
}
