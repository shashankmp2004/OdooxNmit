import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { socketService } from "@/lib/socket";
import { checkMaterialAvailability } from "@/lib/stock";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

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
    // Rate limit per IP per WO start
    const ip = getClientIp(req as any);
    const rl = checkRateLimit(`wo:start:${id}:${ip}`, 10, 60 * 1000);
    rateLimitResponse(res, rl.remaining, rl.resetAt);
    if (!rl.allowed) return res.status(429).json({ error: "Too many start attempts, slow down" });
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
    if (!["PENDING", "PAUSED"].includes(wo.status)) {
      return res.status(400).json({ error: "Work order can only be started from PENDING or PAUSED status" });
    }

    // Check if MO is not completed/canceled
    if (wo.mo.state === "DONE" || wo.mo.state === "CANCELED") {
      return res.status(400).json({ error: "Cannot start work order for completed/canceled manufacturing order" });
    }

    // Ensure materials available before starting the first step
    try {
      const availability = await checkMaterialAvailability(wo.moId);
      if (!availability.canProduce) {
        return res.status(400).json({
          error: "Insufficient materials to start this work order",
          shortages: availability.shortages
        });
      }
    } catch (_) {
      // If check fails, allow start but log warning
      console.warn("Material availability check failed; proceeding to start WO.");
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
    socketService.emitWorkOrderUpdate(id, {
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