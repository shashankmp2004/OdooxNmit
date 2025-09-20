import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWOSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  workCenterId: z.string().optional(),
  status: z.enum(["PENDING", "STARTED", "PAUSED", "COMPLETED"]).optional()
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required")
});

export default requireRole(["ADMIN", "MANAGER", "OPERATOR"], async (req, res) => {
  const { id } = req.query;
  const { method } = req;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Work Order ID is required" });
  }

  // Check if user has access to this work order
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      mo: true,
      assignedTo: true
    }
  });

  if (!wo) {
    return res.status(404).json({ error: "Work Order not found" });
  }

  // Operators can only access their own work orders
  if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  switch (method) {
    case "GET":
      try {
        const workOrder = await prisma.workOrder.findUnique({
          where: { id },
          include: {
            mo: {
              include: {
                product: true,
                createdBy: {
                  select: { name: true, email: true }
                }
              }
            },
            assignedTo: {
              select: { name: true, email: true, role: true }
            },
            comments: {
              include: {
                author: {
                  select: { name: true, email: true }
                }
              },
              orderBy: { createdAt: "desc" }
            }
          }
        });

        // Calculate duration if completed
        let duration = null;
        if (workOrder?.startTime && workOrder?.endTime) {
          duration = Math.round(
            (new Date(workOrder.endTime).getTime() - new Date(workOrder.startTime).getTime()) / (1000 * 60)
          );
        }

        return res.status(200).json({
          ...workOrder,
          calculatedDuration: duration
        });
      } catch (error) {
        console.error("Work Order GET error:", error);
        return res.status(500).json({ error: "Failed to fetch work order" });
      }

    case "PUT":
      try {
        // Only ADMIN and MANAGER can update work order details
        if (req.user.role === "OPERATOR") {
          return res.status(403).json({ error: "Operators cannot update work order details" });
        }

        const parsed = updateWOSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Verify assigned user if provided
        if (parsed.data.assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: parsed.data.assignedToId }
          });

          if (!assignedUser || assignedUser.role !== "OPERATOR") {
            return res.status(400).json({ error: "Invalid assigned user" });
          }
        }

        const updatedWO = await prisma.workOrder.update({
          where: { id },
          data: parsed.data,
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

        return res.status(200).json(updatedWO);
      } catch (error) {
        console.error("Work Order PUT error:", error);
        return res.status(500).json({ error: "Failed to update work order" });
      }

    case "DELETE":
      // Only ADMIN can delete work orders
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admin can delete work orders" });
      }

      try {
        await prisma.workOrder.delete({
          where: { id }
        });

        return res.status(204).end();
      } catch (error) {
        console.error("Work Order DELETE error:", error);
        return res.status(500).json({ error: "Failed to delete work order" });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end();
  }
});