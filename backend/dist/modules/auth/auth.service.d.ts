import { LoginRequest, RegisterRequest, AuthResponse } from './types';
export declare class AuthService {
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest): Promise<AuthResponse>;
    getMe(userId: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            manager: string | null;
            contact: string | null;
            capacity: number | null;
        } | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map