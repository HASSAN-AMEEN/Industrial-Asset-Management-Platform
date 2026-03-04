import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tayyab.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      address: 'Karachi Industrial Area',
      city: 'Karachi',
      capacity: 1000,
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      address: 'Lahore Industrial Area',
      city: 'Lahore',
      capacity: 500,
    },
  });

  console.log('Created warehouses:', warehouse1.name, warehouse2.name);

  // Create Warehouse Manager
  const warehouseManager = await prisma.user.create({
    data: {
      email: 'manager@tayyab.com',
      password: await bcrypt.hash('manager123', 10),
      role: UserRole.WAREHOUSE_MANAGER,
      warehouseId: warehouse1.id,
    },
  });

  console.log('Created warehouse manager:', warehouseManager.email);

  // Create sample machines
  const machine1 = await prisma.machine.create({
    data: {
      model: 'Excavator CAT 320',
      serialNumber: 'CAT320001',
      category: 'HEAVY_EQUIPMENT',
      status: 'IN_WAREHOUSE',
      warehouseId: warehouse1.id,
    },
  });

  const machine2 = await prisma.machine.create({
    data: {
      model: 'Crane Liebherr LTM 1050',
      serialNumber: 'LIEB105001',
      category: 'CRANE',
      status: 'RENTED',
      warehouseId: warehouse1.id,
      installationLocation: 'Site A - North Karachi',
    },
  });

  console.log('Created machines:', machine1.model, machine2.model);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
