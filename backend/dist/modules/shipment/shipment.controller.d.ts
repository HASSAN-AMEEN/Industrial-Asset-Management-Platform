import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
export declare class ShipmentController {
    private shipmentService;
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    list(req: AuthenticatedRequest, res: Response): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    setStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    deliver(req: AuthenticatedRequest, res: Response): Promise<void>;
    history(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=shipment.controller.d.ts.map