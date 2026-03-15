import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  private dashboardService = new DashboardService();

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = await this.dashboardService.getDashboard({
        role: req.user.role,
        warehouseId: req.user.warehouseId,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to load dashboard data',
      });
    }
  }
}
