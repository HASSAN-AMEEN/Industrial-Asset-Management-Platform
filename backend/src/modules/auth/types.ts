// src/modules/auth/types.ts
import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

// Auth request/response types
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

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  warehouseId?: string;
}

// Extended Request with user
export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}