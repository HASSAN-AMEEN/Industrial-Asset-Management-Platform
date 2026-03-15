import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
export declare class MachineController {
    private machineService;
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    list(req: AuthenticatedRequest, res: Response): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    remove(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    history(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=machine.controller.d.ts.map