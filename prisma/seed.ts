const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Hash passwords
  const adminPass = await bcrypt.hash("Admin@123", 10);
  const managerPass = await bcrypt.hash("Manager@123", 10);
  const operatorPass = await bcrypt.hash("Operator@123", 10);
  const inventoryPass = await bcrypt.hash("Inventory@123", 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { 
      name: "Admin User", 
      email: "admin@demo.com", 
      role: "ADMIN", 
      password: adminPass 
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: { 
      name: "Production Manager", 
      email: "manager@demo.com", 
      role: "MANAGER", 
      password: managerPass 
    }
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@demo.com" },
    update: {},
    create: { 
      name: "Floor Operator", 
      email: "operator@demo.com", 
      role: "OPERATOR", 
      password: operatorPass 
    }
  });

  const inventory = await prisma.user.upsert({
    where: { email: "inventory@demo.com" },
    update: {},
    create: { 
      name: "Inventory Manager", 
      email: "inventory@demo.com", 
      role: "INVENTORY", 
      password: inventoryPass 
    }
  });

  console.log("✅ Users created");

  // Create raw materials
  const steel = await prisma.product.upsert({
    where: { sku: "STEEL-01" },
    update: {},
    create: { 
      name: "Steel Plate", 
      sku: "STEEL-01", 
      description: "High quality steel plate for manufacturing",
      isFinished: false 
    }
  });

  const screws = await prisma.product.upsert({
    where: { sku: "SCR-01" },
    update: {},
    create: { 
      name: "Screws Pack", 
      sku: "SCR-01", 
      description: "M6 screws pack",
      isFinished: false 
    }
  });

  const bolts = await prisma.product.upsert({
    where: { sku: "BOLT-01" },
    update: {},
    create: { 
      name: "Hex Bolts", 
      sku: "BOLT-01", 
      description: "M8 hex bolts",
      isFinished: false 
    }
  });

  // Create finished products
  const table = await prisma.product.upsert({
    where: { sku: "TABLE-100" },
    update: {},
    create: { 
      name: "Metal Table", 
      sku: "TABLE-100", 
      description: "Industrial metal table",
      isFinished: true 
    }
  });

  const chair = await prisma.product.upsert({
    where: { sku: "CHAIR-100" },
    update: {},
    create: { 
      name: "Metal Chair", 
      sku: "CHAIR-100", 
      description: "Industrial metal chair",
      isFinished: true 
    }
  });

  console.log("✅ Products created");

  // Create BOMs for finished products
  const tableBom = await prisma.bOM.upsert({
    where: { productId: table.id },
    update: {},
    create: {
      productId: table.id,
      components: {
        create: [
          { materialId: steel.id, qtyPerUnit: 2 },
          { materialId: screws.id, qtyPerUnit: 20 },
          { materialId: bolts.id, qtyPerUnit: 8 }
        ]
      }
    }
  });

  const chairBom = await prisma.bOM.upsert({
    where: { productId: chair.id },
    update: {},
    create: {
      productId: chair.id,
      components: {
        create: [
          { materialId: steel.id, qtyPerUnit: 1 },
          { materialId: screws.id, qtyPerUnit: 12 },
          { materialId: bolts.id, qtyPerUnit: 4 }
        ]
      }
    }
  });

  console.log("✅ BOMs created");

  // Create work centers
  const cuttingCenter = await prisma.workCenter.upsert({
    where: { id: "cutting-center" },
    update: {},
    create: {
      id: "cutting-center",
      name: "Cutting & Welding",
      description: "Steel cutting and welding station",
      costPerHour: 45.0,
      capacity: 2
    }
  });

  const assemblyCenter = await prisma.workCenter.upsert({
    where: { id: "assembly-center" },
    update: {},
    create: {
      id: "assembly-center",
      name: "Assembly Line",
      description: "Final assembly and quality check",
      costPerHour: 35.0,
      capacity: 4
    }
  });

  console.log("✅ Work centers created");

  // Initial stock entries
  const stockEntries = [
    { productId: steel.id, change: 100, sourceType: "INITIAL", balanceAfter: 100 },
    { productId: screws.id, change: 1000, sourceType: "INITIAL", balanceAfter: 1000 },
    { productId: bolts.id, change: 500, sourceType: "INITIAL", balanceAfter: 500 }
  ];

  for (const entry of stockEntries) {
    await prisma.stockEntry.upsert({
      where: { 
        id: `${entry.productId}-initial` 
      },
      update: {},
      create: {
        ...entry,
        id: `${entry.productId}-initial`
      }
    });
  }

  console.log("✅ Initial stock created");

  // Sample Manufacturing Orders
  const tableMO = await prisma.manufacturingOrder.create({
    data: {
      orderNo: "MO-2024-001",
      name: "Produce 5 Metal Tables",
      productId: table.id,
      quantity: 5,
      state: "PLANNED",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: manager.id,
      bomSnapshot: [
        { materialId: steel.id, qtyPerUnit: 2 },
        { materialId: screws.id, qtyPerUnit: 20 },
        { materialId: bolts.id, qtyPerUnit: 8 }
      ]
    }
  });

  const chairMO = await prisma.manufacturingOrder.create({
    data: {
      orderNo: "MO-2024-002",
      name: "Produce 10 Metal Chairs",
      productId: chair.id,
      quantity: 10,
      state: "IN_PROGRESS",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      createdById: manager.id,
      bomSnapshot: [
        { materialId: steel.id, qtyPerUnit: 1 },
        { materialId: screws.id, qtyPerUnit: 12 },
        { materialId: bolts.id, qtyPerUnit: 4 }
      ]
    }
  });

  console.log("✅ Manufacturing orders created");

  // Sample Work Orders
  const workOrders = [
    { 
      moId: tableMO.id, 
      title: "Cut & Weld Table Frame", 
      description: "Cut steel plates and weld table frame",
      assignedToId: operator.id, 
      workCenterId: cuttingCenter.id,
      status: "PENDING" as const
    },
    { 
      moId: tableMO.id, 
      title: "Assemble Table", 
      description: "Final assembly with screws and bolts",
      assignedToId: operator.id, 
      workCenterId: assemblyCenter.id,
      status: "PENDING" as const
    },
    { 
      moId: chairMO.id, 
      title: "Cut Chair Components", 
      description: "Cut steel for chair frames",
      assignedToId: operator.id, 
      workCenterId: cuttingCenter.id,
      status: "STARTED" as const,
      startTime: new Date()
    },
    { 
      moId: chairMO.id, 
      title: "Assemble Chairs", 
      description: "Assemble chair frames and attach components",
      assignedToId: operator.id, 
      workCenterId: assemblyCenter.id,
      status: "PENDING" as const
    }
  ];

  for (const wo of workOrders) {
    await prisma.workOrder.create({
      data: wo
    });
  }

  console.log("✅ Work orders created");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📋 Demo accounts:");
  console.log("  👑 Admin: admin@demo.com / Admin@123");
  console.log("  👨‍💼 Manager: manager@demo.com / Manager@123");
  console.log("  👷 Operator: operator@demo.com / Operator@123");
  console.log("  📦 Inventory: inventory@demo.com / Inventory@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });