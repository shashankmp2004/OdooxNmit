import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid work order ID" });
  }

  if (req.method === "PUT") {
    try {
      const { title, taskName, description, moId, assignedToId, status, priority, estimatedTime } = req.body;

      if (!title || !moId) {
        return res.status(400).json({ error: "Title and manufacturing order are required" });
      }

      // Check if manufacturing order exists
      const mo = await prisma.manufacturingOrder.findUnique({
        where: { id: moId }
      });

      if (!mo) {
        return res.status(400).json({ error: "Manufacturing order not found" });
      }

      // Check if assigned user exists (if provided)
      if (assignedToId) {
        const user = await prisma.user.findUnique({
          where: { id: assignedToId }
        });

        if (!user) {
          return res.status(400).json({ error: "Assigned user not found" });
        }
      }

      // Update work order
      const workOrder = await prisma.workOrder.update({
        where: { id },
        data: {
          title,
          taskName: taskName || null,
          description: description || null,
          moId,
          assignedToId: assignedToId || null,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          estimatedTime: estimatedTime || null,
        },
        include: {
          mo: {
            select: {
              orderNo: true,
              name: true
            }
          },
          assignedTo: {
            select: {
              name: true
            }
          }
        }
      });

      return res.status(200).json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      return res.status(500).json({ error: "Failed to update work order" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Check if work order exists
      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          comments: true
        }
      });

      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }

      // Delete work order and its comments
      await prisma.workOrder.delete({
        where: { id }
      });

      return res.status(200).json({ message: "Work order deleted successfully" });
    } catch (error) {
      console.error("Error deleting work order:", error);
      return res.status(500).json({ error: "Failed to delete work order" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end();
});