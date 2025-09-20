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

  // Create users with updated schema fields
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { 
      fullName: "Admin User",
      name: "Admin User", // Keep for NextAuth compatibility
      email: "admin@demo.com",
      role: "admin", // Updated enum value
      passwordHash: adminPass // Updated field name
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: { 
      fullName: "Production Manager",
      name: "Production Manager",
      email: "manager@demo.com", 
      role: "manager", // Updated enum value
      passwordHash: managerPass // Updated field name
    }
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@demo.com" },
    update: {},
    create: { 
      fullName: "Floor Operator",
      name: "Floor Operator",
      email: "operator@demo.com", 
      role: "operator", // Updated enum value
      passwordHash: operatorPass // Updated field name
    }
  });

  const inventory = await prisma.user.upsert({
    where: { email: "inventory@demo.com" },
    update: {},
    create: { 
      fullName: "Inventory Manager",
      name: "Inventory Manager",
      email: "inventory@demo.com", 
      role: "inventory_manager", // Updated enum value
      passwordHash: inventoryPass // Updated field name
    }
  });

  console.log("✅ Users created");

  // Create raw materials with new schema fields
  const steel = await prisma.product.upsert({
    where: { sku: "STEEL-01" },
    update: {},
    create: { 
      name: "Steel Plate", 
      sku: "STEEL-01", 
      description: "High quality steel plate for manufacturing",
      productType: "raw_material", // New required field
      currentStock: 100, // New required field
      unitOfMeasure: "kg", // New required field
      // Legacy fields for compatibility
      category: "Raw Material",
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
      productType: "raw_material", // New required field
      currentStock: 1000, // New required field
      unitOfMeasure: "pcs", // New required field
      // Legacy fields for compatibility
      category: "Hardware",
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
      productType: "raw_material", // New required field
      currentStock: 500, // New required field
      unitOfMeasure: "pcs", // New required field
      // Legacy fields for compatibility
      category: "Hardware",
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
      productType: "finished_good", // New required field
      currentStock: 0, // New required field
      unitOfMeasure: "pcs", // New required field
      // Legacy fields for compatibility
      category: "Furniture",
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
      productType: "finished_good", // New required field
      currentStock: 0, // New required field
      unitOfMeasure: "pcs", // New required field
      // Legacy fields for compatibility
      category: "Furniture",
      minStockAlert: 10,
      bomLink: "BOM-CHAIR-001",
      isFinished: true 
    }
  });

  console.log("✅ Products created");

  // Create work centers with new schema
  const cuttingCenter = await prisma.workCenter.upsert({
    where: { id: "cutting-center" },
    update: {},
    create: {
      id: "cutting-center",
      name: "Cutting & Welding",
      costPerHour: 45.0, // Using Decimal type
      status: "active", // New enum value
      // Legacy fields for compatibility
      description: "Steel cutting and welding station",
      capacity: 2
    }
  });

  const assemblyCenter = await prisma.workCenter.upsert({
    where: { id: "assembly-center" },
    update: {},
    create: {
      id: "assembly-center",
      name: "Assembly Line",
      costPerHour: 35.0, // Using Decimal type
      status: "active", // New enum value
      // Legacy fields for compatibility
      description: "Final assembly and quality check",
      capacity: 4
    }
  });

  console.log("✅ Work centers created");

  // Create BOMs with updated structure
  const tableBom = await prisma.bOM.upsert({
    where: { productId: table.id },
    update: {},
    create: {
      productId: table.id,
      name: "Metal Table BOM",
      description: "Bill of materials for metal table production",
      bomComponents: {
        create: [
          {
            componentProductId: steel.id,
            quantity: 2.0,
            // Legacy fields for compatibility
            materialId: steel.id,
            qtyPerUnit: 2,
            unit: "kg",
            cost: 15.50
          },
          {
            componentProductId: screws.id,
            quantity: 20.0,
            // Legacy fields for compatibility
            materialId: screws.id,
            qtyPerUnit: 20,
            unit: "pcs",
            cost: 0.25
          },
          {
            componentProductId: bolts.id,
            quantity: 8.0,
            // Legacy fields for compatibility
            materialId: bolts.id,
            qtyPerUnit: 8,
            unit: "pcs",
            cost: 0.75
          }
        ]
      },
      bomOperations: {
        create: [
          {
            workCenterId: cuttingCenter.id,
            operationName: "Cut & Weld Frame",
            sequence: 1,
            estimatedDurationMinutes: 240 // 4 hours
          },
          {
            workCenterId: assemblyCenter.id,
            operationName: "Final Assembly",
            sequence: 2,
            estimatedDurationMinutes: 120 // 2 hours
          }
        ]
      }
    }
  });

  const chairBom = await prisma.bOM.upsert({
    where: { productId: chair.id },
    update: {},
    create: {
      productId: chair.id,
      name: "Metal Chair BOM",
      description: "Bill of materials for metal chair production",
      bomComponents: {
        create: [
          {
            componentProductId: steel.id,
            quantity: 1.0,
            // Legacy fields for compatibility
            materialId: steel.id,
            qtyPerUnit: 1,
            unit: "kg",
            cost: 15.50
          },
          {
            componentProductId: screws.id,
            quantity: 12.0,
            // Legacy fields for compatibility
            materialId: screws.id,
            qtyPerUnit: 12,
            unit: "pcs",
            cost: 0.25
          },
          {
            componentProductId: bolts.id,
            quantity: 4.0,
            // Legacy fields for compatibility
            materialId: bolts.id,
            qtyPerUnit: 4,
            unit: "pcs",
            cost: 0.75
          }
        ]
      },
      bomOperations: {
        create: [
          {
            workCenterId: cuttingCenter.id,
            operationName: "Cut & Weld Chair Frame",
            sequence: 1,
            estimatedDurationMinutes: 180 // 3 hours
          },
          {
            workCenterId: assemblyCenter.id,
            operationName: "Chair Assembly & Finishing",
            sequence: 2,
            estimatedDurationMinutes: 90 // 1.5 hours
          }
        ]
      }
    }
  });

  console.log("✅ BOMs created");

  // Create initial stock ledger entries
  const stockEntries = [
    { 
      productId: steel.id, 
      quantityChange: 100,
      newStockLevel: 100,
      transactionType: "initial_stock",
    },
    {
      productId: screws.id,
      quantityChange: 1000,
      newStockLevel: 1000,
      transactionType: "initial_stock",
    },
    {
      productId: bolts.id,
      quantityChange: 500,
      newStockLevel: 500,
      transactionType: "initial_stock",
    }
  ];

  for (const entry of stockEntries) {
    await prisma.stockLedger.create({
      data: entry
    });
  }

  // Also create legacy stock entries for backward compatibility
  const legacyStockEntries = [
    {
      productId: steel.id,
      type: "IN",
      quantity: 100,
      change: 100, 
      reference: "INIT-001",
      notes: "Initial steel stock",
      sourceType: "INITIAL", 
      balanceAfter: 100 
    },
    { 
      productId: screws.id, 
      type: "IN",
      quantity: 1000,
      change: 1000, 
      reference: "INIT-002",
      notes: "Initial screws stock",
      sourceType: "INITIAL", 
      balanceAfter: 1000 
    },
    { 
      productId: bolts.id, 
      type: "IN",
      quantity: 500,
      change: 500, 
      reference: "INIT-003",
      notes: "Initial bolts stock",
      sourceType: "INITIAL", 
      balanceAfter: 500 
    }
  ];

  for (const entry of legacyStockEntries) {
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

  console.log("✅ Stock entries created");

  // Sample Manufacturing Orders with updated schema
  const tableMO = await prisma.manufacturingOrder.upsert({
    where: { orderNo: "MO-2024-001" },
    update: {},
    create: {
      productId: table.id,
      bomId: tableBom.id,
      quantityToProduce: 5,
      status: "Planned",
      assigneeId: manager.id,
      scheduledStartDate: new Date(),
      // Legacy fields for compatibility
      orderNo: "MO-2024-001",
      name: "Produce 5 Metal Tables",
      quantity: 5,
      state: "Planned",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
      bomSnapshot: [
        { materialId: steel.id, qtyPerUnit: 2 },
        { materialId: screws.id, qtyPerUnit: 20 },
        { materialId: bolts.id, qtyPerUnit: 8 }
      ]
    }
  });

  const chairMO = await prisma.manufacturingOrder.upsert({
    where: { orderNo: "MO-2024-002" },
    update: {},
    create: {
      productId: chair.id,
      bomId: chairBom.id,
      quantityToProduce: 10,
      status: "In_Progress",
      assigneeId: manager.id,
      scheduledStartDate: new Date(),
      actualStartDate: new Date(),
      // Legacy fields for compatibility
      orderNo: "MO-2024-002",
      name: "Produce 10 Metal Chairs",
      quantity: 10,
      state: "In_Progress",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
      bomSnapshot: [
        { materialId: steel.id, qtyPerUnit: 1 },
        { materialId: screws.id, qtyPerUnit: 12 },
        { materialId: bolts.id, qtyPerUnit: 4 }
      ]
    }
  });

  console.log("✅ Manufacturing orders created");

  // Sample Work Orders with updated schema
  const workOrder1 = await prisma.workOrder.create({
    data: {
      moId: tableMO.id,
      workCenterId: cuttingCenter.id,
      operatorId: operator.id,
      operationName: "Cut & Weld Table Frame",
      status: "Pending",
      sequence: 1,
      estimatedDurationMinutes: 240,
      // Legacy fields for compatibility
      title: "Cut & Weld Table Frame",
      taskName: "Frame Cutting & Welding",
      description: "Cut steel plates and weld table frame",
      assignedToId: operator.id,
      machineWorkCenter: "Cutting Station A",
      priority: "HIGH",
      progress: 0,
      estimatedTime: 4.0,
      notes: "Use safety equipment for welding operations"
    }
  });

  const workOrder2 = await prisma.workOrder.create({
    data: {
      moId: tableMO.id,
      workCenterId: assemblyCenter.id,
      operatorId: operator.id,
      operationName: "Table Final Assembly",
      status: "Pending",
      sequence: 2,
      estimatedDurationMinutes: 120,
      // Legacy fields for compatibility
      title: "Table Final Assembly",
      taskName: "Assembly & Quality Check",
      description: "Assemble table components and perform quality check",
      assignedToId: operator.id,
      machineWorkCenter: "Assembly Line B",
      priority: "MEDIUM",
      progress: 0,
      estimatedTime: 2.0,
      notes: "Check all bolts are properly tightened"
    }
  });

  // Create work order logs
  await prisma.workOrderLog.create({
    data: {
      woId: workOrder1.id,
      userId: manager.id,
      logType: "comment",
      details: "Work order created and assigned to operator"
    }
  });

  console.log("✅ Work orders and logs created");

  console.log("🌱 Seed completed successfully!");
  console.log("\n📋 Demo Accounts Created:");
  console.log("👨‍💼 Admin: admin@demo.com / Admin@123");
  console.log("👨‍🔧 Manager: manager@demo.com / Manager@123");
  console.log("👨‍🏭 Operator: operator@demo.com / Operator@123");
  console.log("📦 Inventory: inventory@demo.com / Inventory@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });