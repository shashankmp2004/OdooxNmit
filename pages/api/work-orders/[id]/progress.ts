import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { socketService } from "@/lib/socket";
import { z } from "zod";

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  notes: z.string().optional()
});

export default requireRole(["ADMIN", "MANAGER", "OPERATOR"], async (req, res) => {
  const { id } = req.query;
  const { method } = req;

  if (method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end();
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Work Order ID is required" });
  }

  try {
    const parsed = updateProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: parsed.error.flatten() 
      });
    }

    // Get work order with permissions check
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

    // Permission check: Operators can only update their own work orders
    if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
      return res.status(403).json({ error: "You can only update work orders assigned to you" });
    }

    // Can only update progress for started or paused work orders
    if (!["STARTED", "PAUSED"].includes(wo.status)) {
      return res.status(400).json({ error: "Progress can only be updated for started or paused work orders" });
    }

    const updateData: any = {
      progress: parsed.data.progress
    };

    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes;
    }

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: updateData,
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

    // Emit real-time events
    socketService.emitWorkOrderUpdate(id, {
      workOrder: updatedWO,
      progressUpdatedBy: req.user.name,
      progressUpdatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      message: "Work order progress updated successfully",
      workOrder: updatedWO
    });
  } catch (error) {
    console.error("Work Order PROGRESS UPDATE error:", error);
    return res.status(500).json({ error: "Failed to update work order progress" });
  }
});