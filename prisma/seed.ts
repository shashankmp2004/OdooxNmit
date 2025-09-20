// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create some Work Centers
  const assemblyLine = await prisma.workCenter.create({
    data: {
      name: 'Assembly Line',
      costPerHour: 50.0,
    },
  });

  const paintFloor = await prisma.workCenter.create({
    data: {
      name: 'Paint Floor',
      costPerHour: 40.0,
    },
  });

  // Create some raw material Products
  const woodenLeg = await prisma.product.create({
    data: {
      name: 'Wooden Leg',
      stock: 100,
      isFinishedGood: false,
    },
  });

  const woodenTop = await prisma.product.create({
    data: {
      name: 'Wooden Top',
      stock: 50,
      isFinishedGood: false,
    },
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });