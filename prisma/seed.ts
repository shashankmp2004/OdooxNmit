import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearAll() {
  console.log("🧹 Clearing database...");
  // Order matters due to relations
  await prisma.comment.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.manufacturingOrder.deleteMany({});
  await prisma.bOMComponent.deleteMany({});
  await prisma.bOM.deleteMany({});
  await prisma.stockEntry.deleteMany({});
  await prisma.workCenter.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Database cleared");
}

async function main() {
  console.log("🌱 Starting seed (large dataset)...");

  await clearAll();

  // Create users
  const adminPass = await bcrypt.hash("Admin@123", 10);
  const managerPass = await bcrypt.hash("Manager@123", 10);
  const operatorPass = await bcrypt.hash("Operator@123", 10);
  const inventoryPass = await bcrypt.hash("Inventory@123", 10);

  const [admin, manager, operator1, operator2, operator3, inventory] = await Promise.all([
    prisma.user.create({ data: { name: "Admin User", email: "admin@demo.com", role: "ADMIN", password: adminPass } }),
    prisma.user.create({ data: { name: "Production Manager", email: "manager@demo.com", role: "MANAGER", password: managerPass } }),
    prisma.user.create({ data: { name: "Operator One", email: "operator1@demo.com", role: "OPERATOR", password: operatorPass } }),
    prisma.user.create({ data: { name: "Operator Two", email: "operator2@demo.com", role: "OPERATOR", password: operatorPass } }),
    prisma.user.create({ data: { name: "Operator Three", email: "operator3@demo.com", role: "OPERATOR", password: operatorPass } }),
    prisma.user.create({ data: { name: "Inventory Manager", email: "inventory@demo.com", role: "INVENTORY", password: inventoryPass } }),
  ]);

  console.log("✅ Users created");

  // Work centers
  const wcNames = [
    "Cutting", "Welding", "Machining", "Painting", "Assembly",
    "Packaging", "Quality Control", "CNC Mill", "Lathe", "Polishing",
  ];
  const workCenters = [] as any[];
  for (let i = 0; i < wcNames.length; i++) {
    workCenters.push(
      await prisma.workCenter.create({
        data: {
          name: wcNames[i],
          description: `${wcNames[i]} station`,
          capacity: rand(1, 6),
          costPerHour: rand(20, 80),
        },
      })
    );
  }
  console.log(`✅ Work centers created: ${workCenters.length}`);

  // Raw materials (150)
  const rawMaterials = [] as any[];
  for (let i = 1; i <= 150; i++) {
    const sku = `RM-${String(i).padStart(4, "0")}`;
    rawMaterials.push(
      await prisma.product.create({
        data: {
          name: `Raw Material ${i}`,
          sku,
          category: "Raw Material",
          unit: i % 3 === 0 ? "kg" : "pcs",
          minStockAlert: rand(10, 200),
          isFinished: false,
        },
      })
    );
    const qty = rand(200, 1000);
    await prisma.stockEntry.create({
      data: {
        productId: rawMaterials[i - 1].id,
  type: "IN",
        quantity: qty,
        change: qty,
        reference: `INIT-${sku}`,
        notes: "Initial stock",
        sourceType: "INITIAL",
        balanceAfter: qty,
      },
    });
  }
  console.log(`✅ Raw materials created: ${rawMaterials.length}`);

  // Finished goods (50) + BOMs
  const finished = [] as any[];
  for (let i = 1; i <= 50; i++) {
    const sku = `FG-${String(i).padStart(4, "0")}`;
    const prod = await prisma.product.create({
      data: {
        name: `Finished Product ${i}`,
        sku,
        category: "Finished",
        unit: "pcs",
        minStockAlert: rand(2, 25),
        isFinished: true,
        bomLink: `BOM-${sku}`,
      },
    });
    finished.push(prod);

    const componentsCount = rand(3, 6);
    const chosen = new Set<number>();
    const comps: any[] = [];
    while (chosen.size < componentsCount) {
      chosen.add(rand(0, rawMaterials.length - 1));
    }
    for (const idx of chosen) {
      const rm = rawMaterials[idx];
      comps.push({ materialId: rm.id, qtyPerUnit: rand(1, 10), unit: rm.unit || "pcs", cost: rand(1, 20) });
    }
    await prisma.bOM.create({
      data: {
        productId: prod.id,
        version: "v1.0",
        components: { create: comps },
      },
    });
  }
  console.log(`✅ Finished products + BOMs created: ${finished.length}`);

  // Create Manufacturing Orders (200) and Work Orders (2-4 per MO)
  const moCount = 200;
  const steps = ["Cutting", "Welding", "Assembly", "Painting", "QC", "Packaging"];
  const operators = [operator1, operator2, operator3];
  let woCreated = 0;
  for (let i = 1; i <= moCount; i++) {
    const product = finished[rand(0, finished.length - 1)];
    const bom = await prisma.bOM.findFirst({ where: { productId: product.id }, include: { components: true } });
    const qty = rand(5, 50);
    const statePick = rand(1, 100);
  const state = statePick <= 60 ? "PLANNED" : statePick <= 90 ? "IN_PROGRESS" : "DONE";
    const orderNo = `MO-${new Date().getFullYear()}-${String(i).padStart(4, "0")}`;
    const createdAt = new Date(Date.now() - rand(0, 60) * 24 * 60 * 60 * 1000);
    const deadline = new Date(Date.now() + rand(3, 60) * 24 * 60 * 60 * 1000);
    const completedAt = state === "DONE" ? new Date(Date.now() - rand(0, 10) * 24 * 60 * 60 * 1000) : null;

    const mo = await prisma.manufacturingOrder.create({
      data: {
        orderNo,
        name: `${product.name} x${qty}`,
        productId: product.id,
        quantity: qty,
        state,
        deadline,
        createdById: manager.id,
        createdAt,
        completedAt: completedAt || undefined,
        bomSnapshot: (bom?.components || []).map((c: any) => ({ materialId: c.materialId, qtyPerUnit: c.qtyPerUnit })),
      },
    });

    const stepsCount = rand(2, 4);
    const usedSteps = steps.slice(0, stepsCount);
    for (let s = 0; s < usedSteps.length; s++) {
      const step = usedSteps[s];
      const wc = workCenters[rand(0, workCenters.length - 1)];
      const assignee = operators[rand(0, operators.length - 1)];
      const estimated = rand(1, 6);
  let status: any = "PENDING";
      let progress = 0;
      let startTime: Date | undefined = undefined;
      let endTime: Date | undefined = undefined;
      let actualTime: number | undefined = undefined;
      if (state === "IN_PROGRESS" && s === 0) {
  status = "STARTED";
        progress = rand(10, 80);
        startTime = new Date(Date.now() - rand(1, 6) * 60 * 60 * 1000);
        actualTime = rand(1, estimated);
      } else if (state === "DONE") {
  status = "COMPLETED";
        progress = 100;
        endTime = completedAt || new Date();
        actualTime = rand(1, estimated + 2);
      }
      await prisma.workOrder.create({
        data: {
          moId: mo.id,
          title: `${step} - ${product.name}`,
          taskName: step,
          description: `${step} step for ${product.name}`,
          assignedToId: assignee.id,
          workCenterId: wc.id,
          machineWorkCenter: wc.name,
          status,
          priority: ["LOW", "MEDIUM", "HIGH"][rand(0, 2)] as any,
          progress,
          estimatedTime: estimated,
          actualTime,
          startTime,
          endTime,
        },
      });
      woCreated++;
    }
  }
  console.log(`✅ Manufacturing Orders created: ${moCount}`);
  console.log(`✅ Work Orders created: ${woCreated}`);

  console.log("🎉 Seed completed successfully!");
  console.log("\n📋 Demo accounts:");
  console.log("  👑 Admin: admin@demo.com / Admin@123");
  console.log("  👨‍💼 Manager: manager@demo.com / Manager@123");
  console.log("  👷 Operator: operator1@demo.com / Operator@123");
  console.log("  👷 Operator: operator2@demo.com / Operator@123");
  console.log("  👷 Operator: operator3@demo.com / Operator@123");
  console.log("  📦 Inventory: inventory@demo.com / Inventory@123");
}

main()
  .catch((e: any) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });