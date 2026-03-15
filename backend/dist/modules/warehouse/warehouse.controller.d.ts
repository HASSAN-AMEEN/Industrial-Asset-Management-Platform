import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
export declare class WarehouseController {
    private warehouseService;
    create(req: Request, res: Response): Promise<void>;
    list(req: AuthenticatedRequest, res: Response): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    remove(req: Request, res: Response): Promise<void>;
    getMachines(req: AuthenticatedRequest, res: Response): Promise<void>;
    getInventory(req: AuthenticatedRequest, res: Response): Promise<void>;
    listManagers(req: AuthenticatedRequest, res: Response): Promise<void>;
    assignManager(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=warehouse.controller.d.ts.map