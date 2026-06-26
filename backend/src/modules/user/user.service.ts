import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';

// Never return the password hash.
const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  contact: true,
  warehouseId: true,
  createdAt: true,
  updatedAt: true,
  warehouses: { select: { id: true, name: true } },
} as const;

const VALID_ROLES = Object.values(UserRole);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  warehouseId?: string | null;
  contact?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  role?: UserRole;
  warehouseId?: string | null;
  password?: string;
  contact?: string | null;
}

export class UserService {
  async list() {
    return prisma.users.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.users.findUnique({ where: { id }, select: USER_SELECT });
  }

  async create(input: CreateUserInput) {
    const email = normalizeEmail(input.email || '');

    if (!email || !email.includes('@')) {
      throw new Error('A valid email is required');
    }
    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!input.role || !VALID_ROLES.includes(input.role)) {
      throw new Error('A valid role is required');
    }
    if (input.role === UserRole.WAREHOUSE_MANAGER && !input.warehouseId) {
      throw new Error('A warehouse must be assigned for a Warehouse Manager');
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    if (input.warehouseId) {
      const warehouse = await prisma.warehouses.findUnique({ where: { id: input.warehouseId } });
      if (!warehouse) {
        throw new Error('Selected warehouse not found');
      }
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    return prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: input.role,
        contact: input.contact?.trim() || null,
        // Only a Warehouse Manager is tied to a warehouse.
        warehouseId: input.role === UserRole.WAREHOUSE_MANAGER ? input.warehouseId ?? null : null,
        updatedAt: new Date(),
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, input: UpdateUserInput) {
    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    const nextRole = input.role ?? existing.role;
    if (input.role && !VALID_ROLES.includes(input.role)) {
      throw new Error('A valid role is required');
    }

    // Resolve the warehouse for the resulting role.
    let nextWarehouseId: string | null = existing.warehouseId;
    if (input.warehouseId !== undefined) {
      nextWarehouseId = input.warehouseId;
    }
    if (nextRole === UserRole.WAREHOUSE_MANAGER) {
      if (!nextWarehouseId) {
        throw new Error('A warehouse must be assigned for a Warehouse Manager');
      }
      const warehouse = await prisma.warehouses.findUnique({ where: { id: nextWarehouseId } });
      if (!warehouse) {
        throw new Error('Selected warehouse not found');
      }
    } else {
      // Non-managers are not tied to a warehouse.
      nextWarehouseId = null;
    }

    const data: any = { role: nextRole, warehouseId: nextWarehouseId, updatedAt: new Date() };

    if (input.contact !== undefined) {
      data.contact = input.contact?.trim() || null;
    }

    if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      if (!email || !email.includes('@')) {
        throw new Error('A valid email is required');
      }
      if (email !== existing.email) {
        const dupe = await prisma.users.findUnique({ where: { email } });
        if (dupe) {
          throw new Error('A user with this email already exists');
        }
      }
      data.email = email;
    }

    if (input.password !== undefined && input.password !== '') {
      if (input.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      data.password = await bcrypt.hash(input.password, 12);
    }

    return prisma.users.update({ where: { id }, data, select: USER_SELECT });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    // Never leave the system without a Super Admin.
    if (existing.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await prisma.users.count({ where: { role: UserRole.SUPER_ADMIN } });
      if (superAdminCount <= 1) {
        throw new Error('Cannot delete the last Super Admin');
      }
    }

    // training_materials.uploadedBy references users; block deletion if they own uploads.
    const uploadCount = await prisma.training_materials.count({ where: { uploadedBy: id } });
    if (uploadCount > 0) {
      throw new Error(
        `Cannot delete user: they uploaded ${uploadCount} training material(s). Reassign or remove those first.`
      );
    }

    await prisma.users.delete({ where: { id } });
    return { id };
  }
}
