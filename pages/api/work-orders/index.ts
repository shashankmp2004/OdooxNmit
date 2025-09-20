import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWOSchema = z.object({
  moId: z.string(),
  title: z.string().min(1, "Title is required"),
  taskName: z.string().optional(), // Added for frontend compatibility
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  workCenterId: z.string().optional(),
  machineWorkCenter: z.string().optional(), // Added for frontend compatibility
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"), // Added for frontend compatibility
  estimatedTime: z.number().positive().optional(), // Added for frontend compatibility
  notes: z.string().optional() // Added for frontend compatibility
});

export default requireRole(["ADMIN", "MANAGER", "OPERATOR"], async (req, res) => {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { 
          status, 
          assignedToId, 
          moId, 
          search,
          page = "1", 
          limit = "10" 
        } = req.query;
        
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        
        if (status) {
          where.status = status;
        }

        if (moId) {
          where.moId = moId;
        }

        // Role-based filtering
        if (req.user.role === "OPERATOR") {
          // Operators can only see their assigned work orders
          where.assignedToId = req.user.id;
        } else if (assignedToId) {
          where.assignedToId = assignedToId;
        }

        if (search) {
          where.OR = [
            { title: { contains: search as string, mode: "insensitive" } },
            { description: { contains: search as string, mode: "insensitive" } },
            { mo: { name: { contains: search as string, mode: "insensitive" } } },
            { mo: { orderNo: { contains: search as string, mode: "insensitive" } } }
          ];
        }

        const [workOrders, total] = await Promise.all([
          prisma.workOrder.findMany({
            where,
            include: {
              mo: {
                include: {
                  product: true
                }
              },
              assignedTo: {
                select: { name: true, email: true }
              },
              comments: {
                include: {
                  author: {
                    select: { name: true, email: true }
                  }
                },
                orderBy: { createdAt: "desc" },
                take: 3
              },
              _count: {
                select: {
                  comments: true
                }
              }
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" }
          }),
          prisma.workOrder.count({ where })
        ]);

        return res.status(200).json({
          workOrders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        console.error("Work Orders GET error:", error);
        return res.status(500).json({ error: "Failed to fetch work orders" });
      }

    case "POST":
      // Only ADMIN and MANAGER can create work orders
      if (!["ADMIN", "MANAGER"].includes(req.user.role)) {
        return res.status(403).json({ error: "Only admin and managers can create work orders" });
      }

      try {
        const parsed = createWOSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Verify MO exists and is not completed
        const mo = await prisma.manufacturingOrder.findUnique({
          where: { id: parsed.data.moId }
        });

        if (!mo) {
          return res.status(404).json({ error: "Manufacturing Order not found" });
        }

        if (mo.state === "DONE" || mo.state === "CANCELED") {
          return res.status(400).json({ error: "Cannot create work order for completed/canceled MO" });
        }

        // Verify assigned user exists and is an operator
        if (parsed.data.assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: parsed.data.assignedToId }
          });

          if (!assignedUser) {
            return res.status(404).json({ error: "Assigned user not found" });
          }

          if (assignedUser.role !== "OPERATOR") {
            return res.status(400).json({ error: "Work orders can only be assigned to operators" });
          }
        }

        const workOrder = await prisma.workOrder.create({
          data: {
            ...parsed.data,
            status: "PENDING",
            progress: 0 // Initialize progress to 0
          },
          include: {
            mo: {
              include: {
                product: true
              }
            },
            assignedTo: {
              select: { name: true, email: true }
            }
          }
        });

        return res.status(201).json(workOrder);
      } catch (error) {
        console.error("Work Order POST error:", error);
        return res.status(500).json({ error: "Failed to create work order" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
});