import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMOSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional(),
  state: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"]).optional()
});

export default requireRole(["ADMIN", "MANAGER"], async (req, res) => {
  const { id } = req.query;
  const { method } = req;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Manufacturing Order ID is required" });
  }

  switch (method) {
    case "GET":
      try {
        const mo = await prisma.manufacturingOrder.findUnique({
          where: { id },
          include: {
            product: true,
            createdBy: {
              select: { name: true, email: true }
            },
            workOrders: {
              include: {
                assignedTo: {
                  select: { name: true, email: true }
                },
                comments: {
                  include: {
                    author: {
                      select: { name: true, email: true }
                    }
                  },
                  orderBy: { createdAt: "desc" }
                }
              },
              orderBy: { createdAt: "asc" }
            }
          }
        });

        if (!mo) {
          return res.status(404).json({ error: "Manufacturing Order not found" });
        }

        // Calculate completion metrics
        const totalWOs = mo.workOrders.length;
        const completedWOs = mo.workOrders.filter((wo: any) => wo.status === "COMPLETED").length;
        const inProgressWOs = mo.workOrders.filter((wo: any) => wo.status === "STARTED").length;
        const completionPercentage = totalWOs > 0 ? (completedWOs / totalWOs) * 100 : 0;

        // Calculate material requirements vs available stock
        let materialRequirements: any[] = [];
        if (mo.bomSnapshot && Array.isArray(mo.bomSnapshot)) {
          materialRequirements = await Promise.all(
            (mo.bomSnapshot as any[]).map(async (comp: any) => {
              const required = comp.qtyPerUnit * mo.quantity;
              
              // Get current stock
              const lastStock = await prisma.stockEntry.findFirst({
                where: { productId: comp.materialId },
                orderBy: { createdAt: "desc" }
              });
              
              const available = lastStock?.balanceAfter || 0;
              const shortage = Math.max(0, required - available);

              return {
                materialId: comp.materialId,
                materialName: comp.materialName,
                materialSku: comp.materialSku,
                qtyPerUnit: comp.qtyPerUnit,
                required,
                available,
                shortage
              };
            })
          );
        }

        return res.status(200).json({
          ...mo,
          metrics: {
            totalWorkOrders: totalWOs,
            completedWorkOrders: completedWOs,
            inProgressWorkOrders: inProgressWOs,
            completionPercentage
          },
          materialRequirements
        });
      } catch (error) {
        console.error("MO GET error:", error);
        return res.status(500).json({ error: "Failed to fetch manufacturing order" });
      }

    case "PUT":
      try {
        const parsed = updateMOSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

  const updateData: any = { ...parsed.data };
        
        if (updateData.deadline) {
          updateData.deadline = new Date(updateData.deadline);
        }

        // If state transitions to DONE here, set completedAt; note: stock operations should normally finalize MO
        if (updateData.state === "DONE" && !updateData.completedAt) {
          updateData.completedAt = new Date();
        }

        const mo = await prisma.manufacturingOrder.update({
          where: { id },
          data: updateData,
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
            }
          }
        });

        return res.status(200).json(mo);
      } catch (error: any) {
        console.error("MO PUT error:", error);
        
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Manufacturing Order not found" });
        }
        
        return res.status(500).json({ error: "Failed to update manufacturing order" });
      }

    case "DELETE":
      // Only ADMIN can delete MOs
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admin can delete manufacturing orders" });
      }

      try {
        // Check if MO has work orders
        const workOrderCount = await prisma.workOrder.count({
          where: { moId: id }
        });

        if (workOrderCount > 0) {
          return res.status(400).json({ 
            error: "Cannot delete manufacturing order with associated work orders" 
          });
        }

        await prisma.manufacturingOrder.delete({
          where: { id }
        });

        return res.status(204).end();
      } catch (error: any) {
        console.error("MO DELETE error:", error);
        
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Manufacturing Order not found" });
        }
        
        return res.status(500).json({ error: "Failed to delete manufacturing order" });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end();
  }
});