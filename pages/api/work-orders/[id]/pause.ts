import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { socketService } from "@/lib/socket";

export default requireRole(["ADMIN", "MANAGER", "OPERATOR"], async (req, res) => {
  const { id } = req.query;
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Work Order ID is required" });
  }

  try {
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

    // Permission check: Operators can only pause their own work orders
    if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
      return res.status(403).json({ error: "You can only pause work orders assigned to you" });
    }

    // Check if work order can be paused
    if (wo.status !== "STARTED") {
      return res.status(400).json({ error: "Work order can only be paused from STARTED status" });
    }

    // Calculate actual time spent so far
    let actualTime = wo.actualTime || 0;
    if (wo.startTime) {
      const timeSpent = (new Date().getTime() - new Date(wo.startTime).getTime()) / (1000 * 60 * 60); // hours
      actualTime += timeSpent;
    }

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "PAUSED",
        actualTime,
        // Clear startTime since we'll set it again when resuming
        startTime: null
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

    // Emit real-time events
    socketService.emitWorkOrderUpdate(id, {
      workOrder: updatedWO,
      pausedBy: req.user.name,
      pausedAt: new Date().toISOString(),
      actualTimeSpent: actualTime
    });

    return res.status(200).json({
      message: "Work order paused successfully",
      workOrder: updatedWO
    });
  } catch (error) {
    console.error("Work Order PAUSE error:", error);
    return res.status(500).json({ error: "Failed to pause work order" });
  }
});