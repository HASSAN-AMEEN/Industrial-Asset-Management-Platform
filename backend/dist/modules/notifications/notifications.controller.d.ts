import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
export declare class NotificationsController {
    private notificationsService;
    getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=notifications.controller.d.ts.map