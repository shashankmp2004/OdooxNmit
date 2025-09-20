import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeStockForMO } from "@/lib/stock";
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

    // Permission check: Operators can only complete their own work orders
    if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
      return res.status(403).json({ error: "You can only complete work orders assigned to you" });
    }

    // Check if work order can be completed
    if (!["STARTED", "PAUSED"].includes(wo.status)) {
      return res.status(400).json({ error: "Work order can only be completed from STARTED or PAUSED status" });
    }

    // Calculate duration
    const endTime = new Date();
    const durationMin = wo.startTime 
      ? Math.round((endTime.getTime() - new Date(wo.startTime).getTime()) / (1000 * 60))
      : null;

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        endTime,
        durationMin
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

    // Check if all work orders for the MO are completed
    const allWorkOrders = await prisma.workOrder.findMany({
      where: { moId: wo.moId }
    });

    const allCompleted = allWorkOrders.every((workOrder: any) => workOrder.status === "COMPLETED");

    let updatedMO = null;
    let stockConsumptionResult = null;
    
    if (allCompleted) {
      // Complete the manufacturing order and handle stock consumption
      updatedMO = await prisma.manufacturingOrder.update({
        where: { id: wo.moId },
        data: { state: "DONE" }
      });

      try {
        // Consume raw materials and produce finished goods
        stockConsumptionResult = await consumeStockForMO(wo.moId);
      } catch (stockError) {
        console.error("Stock consumption error:", stockError);
        // MO is marked as DONE but stock consumption failed
        // This should be handled in a real system (rollback or alert)
        return res.status(500).json({ 
          error: "Manufacturing order completed but stock consumption failed",
          details: stockError instanceof Error ? stockError.message : "Unknown stock error"
        });
      }
    }

    // Emit real-time events
    socketService.emitWorkOrderCompleted(id, {
      workOrder: updatedWO,
      completedBy: req.user.name,
      completedAt: new Date().toISOString(),
      manufacturingOrderCompleted: allCompleted,
      stockConsumption: stockConsumptionResult
    });

    // If MO completed, emit MO completion event too
    if (allCompleted && updatedMO) {
      socketService.emitMOCompleted(wo.moId, {
        manufacturingOrder: updatedMO,
        stockConsumption: stockConsumptionResult
      });
    }

    return res.status(200).json({
      message: "Work order completed successfully",
      workOrder: updatedWO,
      manufacturingOrderCompleted: allCompleted,
      manufacturingOrder: updatedMO,
      stockConsumption: stockConsumptionResult
    });
  } catch (error) {
    console.error("Work Order COMPLETE error:", error);
    return res.status(500).json({ error: "Failed to complete work order" });
  }
});