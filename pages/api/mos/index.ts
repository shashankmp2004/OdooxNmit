import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getRoutingForProduct, resolveWorkCenterIdByName } from "@/lib/routing";
import { checkMaterialAvailability } from "@/lib/stock";
import type { PrismaClient } from "@prisma/client";

const createMOSchema = z.object({
  name: z.string().min(1, "Name is required"),
  productId: z.string(),
  quantity: z.number().int().positive("Quantity must be positive"),
  deadline: z.string().datetime().optional()
});

const updateMOSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional(),
  state: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"]).optional()
});

export default requireRole(["ADMIN", "MANAGER"], async (req, res) => {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { 
          state, 
          search, 
          productId, 
          page = "1", 
          limit = "10" 
        } = req.query;
        
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        
        if (state) {
          where.state = state;
        }

        if (productId) {
          where.productId = productId;
        }

        if (search) {
          where.OR = [
            { name: { contains: search as string, mode: "insensitive" } },
            { orderNo: { contains: search as string, mode: "insensitive" } },
            { product: { name: { contains: search as string, mode: "insensitive" } } }
          ];
        }

        const [mos, total] = await Promise.all([
          prisma.manufacturingOrder.findMany({
            where,
            include: {
              product: true,
              createdBy: {
                select: { name: true, email: true }
              },
              workOrders: {
                include: {
                  assignedTo: {
                    select: { name: true, email: true }
                  }
                }
              },
              _count: {
                select: {
                  workOrders: true
                }
              }
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" }
          }),
          prisma.manufacturingOrder.count({ where })
        ]);

        // Calculate completion status and material availability for each MO
        const mosWithStatus = await Promise.all(
          mos.map(async (mo: any) => {
            const [completedWOs, availability] = await Promise.all([
              prisma.workOrder.count({ where: { moId: mo.id, status: "COMPLETED" } }),
              checkMaterialAvailability(mo.id).catch(() => ({ canProduce: false, shortages: [] } as any))
            ]);

            const totalWOs = mo._count.workOrders;
            const completionPercentage = totalWOs > 0 ? (completedWOs / totalWOs) * 100 : 0;

            return {
              ...mo,
              completionPercentage,
              completedWorkOrders: completedWOs,
              totalWorkOrders: totalWOs,
              canProduce: availability?.canProduce ?? false,
              shortagesCount: availability?.shortages?.length ?? 0
            };
          })
        );

        return res.status(200).json({
          manufacturingOrders: mosWithStatus,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        console.error("MOs GET error:", error);
        return res.status(500).json({ error: "Failed to fetch manufacturing orders" });
      }

    case "POST":
      try {
        const parsed = createMOSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Verify product exists and load active BOM (new structure preferred)
        const product = await prisma.product.findUnique({
          where: { id: parsed.data.productId },
          include: {
            boms: {
              where: { isActive: true },
              include: {
                items: { include: { component: true } },
                components: { include: { material: true } }, // fallback
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        if (!product.isFinished) {
          return res.status(400).json({ error: "Can only create MO for finished products" });
        }

        // Get BOM snapshot (prefer new BOMItem list, fallback to old components)
        const activeBOM = product.boms?.[0] || null;
        const bomSnapshot = activeBOM
          ? (activeBOM.items.length > 0
              ? activeBOM.items.map((i: any) => ({
                  materialId: i.componentId,
                  materialName: i.component?.name,
                  materialSku: i.component?.sku,
                  qtyPerUnit: i.quantity,
                }))
              : activeBOM.components.map((c: any) => ({
                  materialId: c.materialId,
                  materialName: c.material?.name,
                  materialSku: c.material?.sku,
                  qtyPerUnit: c.qtyPerUnit,
                })))
          : null;

        // Generate unique order number
        const orderNo = `MO-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        // Compute routing up front
        const route = await getRoutingForProduct(parsed.data.productId);

    // Create MO and initial WOs atomically
  const created = await prisma.$transaction(async (tx: PrismaClient) => {
          const createdMO = await tx.manufacturingOrder.create({
            data: {
              orderNo,
              name: parsed.data.name,
              productId: parsed.data.productId,
              quantity: parsed.data.quantity,
              deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
              bomSnapshot,
              createdById: req.user.id,
            },
          });
          if (route.length > 0) {
            for (const step of route) {
              const wcId = await resolveWorkCenterIdByName(step);
              // Derive estimated time in hours from work center capacity (units/hour) or default to 1h
              let estimatedTime = 1; // default 1 hour if no capacity data
              let machineWorkCenter: string | null = step;
              if (wcId) {
                const wc = await tx.workCenter.findUnique({ where: { id: wcId }, select: { capacity: true, name: true } });
                machineWorkCenter = wc?.name || step;
                if (wc?.capacity && wc.capacity > 0) {
                  estimatedTime = parsed.data.quantity / wc.capacity;
                }
              }
              await tx.workOrder.create({
                data: {
                  moId: createdMO.id,
                  title: `${step} - ${parsed.data.name}`,
                  taskName: step,
                  status: "PENDING",
                  priority: "MEDIUM",
                  workCenterId: wcId || undefined,
                  machineWorkCenter: machineWorkCenter || undefined,
                  estimatedTime,
                },
              });
            }
          }
          return createdMO.id;
        });

        // Return MO with relations
        const moFull = await prisma.manufacturingOrder.findUnique({
          where: { id: created },
          include: {
            product: true,
            createdBy: { select: { name: true, email: true } },
            workOrders: true,
          },
        });

        return res.status(201).json(moFull);
      } catch (error) {
        console.error("MO POST error:", error);
        return res.status(500).json({ error: "Failed to create manufacturing order" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
});