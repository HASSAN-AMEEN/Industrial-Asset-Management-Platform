import { Request } from 'express';

/**
 * Common types used throughout the application
 */

// User-related types
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Express request with user (for future auth implementation)
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Pagination types
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
