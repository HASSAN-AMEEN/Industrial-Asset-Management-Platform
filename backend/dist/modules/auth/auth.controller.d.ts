import { Request, Response } from 'express';
import { AuthenticatedRequest } from './types';
export declare class AuthController {
    private authService;
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    getMe(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map