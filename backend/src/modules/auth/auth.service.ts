// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { LoginRequest, RegisterRequest, AuthResponse } from './types';
import { generateToken } from './jwt.util';
import { UserRole } from '@prisma/client';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const email = normalizeEmail(data.email);

    if (!email || !email.includes('@')) {
      throw new Error('Invalid email');
    }

    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (data.role === UserRole.WAREHOUSE_MANAGER && !data.warehouseId) {
      throw new Error('warehouseId is required for WAREHOUSE_MANAGER');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: data.role || UserRole.SALES_OPS,
        warehouseId: data.warehouseId
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId || undefined
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const email = normalizeEmail(data.email);

    if (!email || !email.includes('@') || !data.password) {
      throw new Error('Invalid credentials');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { warehouse: true }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId || undefined
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { warehouse: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}