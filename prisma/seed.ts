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
      category: "Raw Material",
      unit: "kg",
      minStockAlert: 20,
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
      category: "Hardware",
      unit: "pcs",
      minStockAlert: 100,
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
      category: "Hardware",
      unit: "pcs",
      minStockAlert: 50,
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
      category: "Furniture",
      unit: "pcs",
      minStockAlert: 5,
      bomLink: "BOM-TABLE-001",
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
      category: "Furniture",
      unit: "pcs",
      minStockAlert: 10,
      bomLink: "BOM-CHAIR-001",
      isFinished: true 
    }
  });

  console.log("✅ Products created");

  // Create BOMs for finished products
  const tableBom = await prisma.bOM.upsert({
    where: { productId_version: { productId: table.id, version: "v1.0" } },
    update: {},
    create: {
      productId: table.id,
      components: {
        create: [
          { materialId: steel.id, qtyPerUnit: 2, unit: "kg", cost: 15.50 },
          { materialId: screws.id, qtyPerUnit: 20, unit: "pcs", cost: 0.25 },
          { materialId: bolts.id, qtyPerUnit: 8, unit: "pcs", cost: 0.75 }
        ]
      }
    }
  });

  const chairBom = await prisma.bOM.upsert({
    where: { productId_version: { productId: chair.id, version: "v1.0" } },
    update: {},
    create: {
      productId: chair.id,
      components: {
        create: [
          { materialId: steel.id, qtyPerUnit: 1, unit: "kg", cost: 15.50 },
          { materialId: screws.id, qtyPerUnit: 12, unit: "pcs", cost: 0.25 },
          { materialId: bolts.id, qtyPerUnit: 4, unit: "pcs", cost: 0.75 }
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
    { 
      productId: steel.id, 
      type: "IN" as const,
      quantity: 100,
      change: 100, 
      reference: "INIT-001",
      notes: "Initial steel stock",
      sourceType: "INITIAL", 
      balanceAfter: 100 
    },
    { 
      productId: screws.id, 
      type: "IN" as const,
      quantity: 1000,
      change: 1000, 
      reference: "INIT-002",
      notes: "Initial screws stock",
      sourceType: "INITIAL", 
      balanceAfter: 1000 
    },
    { 
      productId: bolts.id, 
      type: "IN" as const,
      quantity: 500,
      change: 500, 
      reference: "INIT-003",
      notes: "Initial bolts stock",
      sourceType: "INITIAL", 
      balanceAfter: 500 
    }
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
      taskName: "Frame Cutting & Welding",
      description: "Cut steel plates and weld table frame",
      assignedToId: operator.id, 
      workCenterId: cuttingCenter.id,
      machineWorkCenter: "Cutting Station A",
      status: "PENDING" as const,
      priority: "HIGH" as const,
      progress: 0,
      estimatedTime: 4.0,
      notes: "Use safety equipment for welding operations"
    },
    { 
      moId: tableMO.id, 
      title: "Assemble Table", 
      taskName: "Final Assembly",
      description: "Final assembly with screws and bolts",
      assignedToId: operator.id, 
      workCenterId: assemblyCenter.id,
      machineWorkCenter: "Assembly Line B",
      status: "PENDING" as const,
      priority: "MEDIUM" as const,
      progress: 0,
      estimatedTime: 2.5,
      notes: "Quality check after assembly"
    },
    { 
      moId: chairMO.id, 
      title: "Cut Chair Components", 
      taskName: "Chair Frame Cutting",
      description: "Cut steel for chair frames",
      assignedToId: operator.id, 
      workCenterId: cuttingCenter.id,
      machineWorkCenter: "Cutting Station B",
      status: "STARTED" as const,
      priority: "HIGH" as const,
      progress: 25,
      estimatedTime: 3.0,
      actualTime: 0.75,
      startTime: new Date(),
      notes: "In progress - 25% completed"
    },
    { 
      moId: chairMO.id, 
      title: "Assemble Chairs", 
      taskName: "Chair Assembly",
      description: "Assemble chair frames and attach components",
      assignedToId: operator.id, 
      workCenterId: assemblyCenter.id,
      machineWorkCenter: "Assembly Line A",
      status: "PENDING" as const,
      priority: "MEDIUM" as const,
      progress: 0,
      estimatedTime: 1.5,
      notes: "Waiting for cutting to complete"
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