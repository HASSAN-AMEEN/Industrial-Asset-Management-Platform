import { Request } from 'express';
export interface User {
    id: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
}
export interface CreateUserInput {
    email: string;
    password: string;
    role?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export interface PaginationQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
//# sourceMappingURL=index.d.ts.map