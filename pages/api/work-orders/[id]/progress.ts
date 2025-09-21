import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const { progress } = req.body || {};
  const parsed = Number(progress);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return res.status(400).json({ error: "progress must be a number between 0 and 100" });
  }

  try {
    const ip = getClientIp(req as any);
    const rl = checkRateLimit(`wo:progress:${id}:${ip}`, 30, 60 * 1000);
    rateLimitResponse(res, rl.remaining, rl.resetAt);
    if (!rl.allowed) return res.status(429).json({ error: "Too many progress updates, slow down" });
    const wo = await prisma.workOrder.findUnique({ where: { id } });
    if (!wo) return res.status(404).json({ error: "Work Order not found" });

    if (req.user.role === "OPERATOR" && wo.assignedToId && wo.assignedToId !== req.user.id) {
      return res.status(403).json({ error: "You can only update progress of work orders assigned to you" });
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: { progress: Math.round(parsed) },
    });

    return res.status(200).json({ workOrder: updated });
  } catch (error) {
    console.error("Work Order PROGRESS error:", error);
    return res.status(500).json({ error: "Failed to update progress" });
  }
});
