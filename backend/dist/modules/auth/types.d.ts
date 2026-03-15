import { Request } from 'express';
import { User, UserRole } from '@prisma/client';
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    role?: UserRole;
    warehouseId?: string;
}
export interface AuthResponse {
    user: Omit<User, 'password'>;
    token: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    warehouseId?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: Omit<User, 'password'>;
}
//# sourceMappingURL=types.d.ts.map