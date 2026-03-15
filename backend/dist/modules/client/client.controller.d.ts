import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types';
export declare class ClientController {
    private clientService;
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    list(req: AuthenticatedRequest, res: Response): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    remove(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=client.controller.d.ts.map