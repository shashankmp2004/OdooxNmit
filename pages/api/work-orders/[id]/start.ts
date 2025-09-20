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

    // Permission check: Operators can only start their own work orders
    if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
      return res.status(403).json({ error: "You can only start work orders assigned to you" });
    }

    // Check if work order can be started
    if (wo.status !== "PENDING") {
      return res.status(400).json({ error: "Work order can only be started from PENDING status" });
    }

    // Check if MO is not completed/canceled
    if (wo.mo.state === "DONE" || wo.mo.state === "CANCELED") {
      return res.status(400).json({ error: "Cannot start work order for completed/canceled manufacturing order" });
    }

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "STARTED",
        startTime: new Date()
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

    // Update MO status to IN_PROGRESS if it's still PLANNED
    if (wo.mo.state === "PLANNED") {
      await prisma.manufacturingOrder.update({
        where: { id: wo.moId },
        data: { state: "IN_PROGRESS" }
      });
    }

    // Emit real-time events
    socketService.emitWorkOrderStarted(id, {
      workOrder: updatedWO,
      startedBy: req.user.name,
      startedAt: new Date().toISOString()
    });

    return res.status(200).json({
      message: "Work order started successfully",
      workOrder: updatedWO
    });
  } catch (error) {
    console.error("Work Order START error:", error);
    return res.status(500).json({ error: "Failed to start work order" });
  }
});