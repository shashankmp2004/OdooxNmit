import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required")
});

export default requireRole(["ADMIN", "MANAGER", "OPERATOR"], async (req, res) => {
  const { id } = req.query; // work order ID
  const { method } = req;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Work Order ID is required" });
  }

  // Check if work order exists and user has access
  const wo = await prisma.workOrder.findUnique({
    where: { id }
  });

  if (!wo) {
    return res.status(404).json({ error: "Work Order not found" });
  }

  // Operators can only comment on their own work orders
  if (req.user.role === "OPERATOR" && wo.assignedToId !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  switch (method) {
    case "GET":
      try {
        const comments = await prisma.comment.findMany({
          where: { workOrderId: id },
          include: {
            author: {
              select: { name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ comments });
      } catch (error) {
        console.error("Comments GET error:", error);
        return res.status(500).json({ error: "Failed to fetch comments" });
      }

    case "POST":
      try {
        const parsed = commentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        const comment = await prisma.comment.create({
          data: {
            content: parsed.data.content,
            workOrderId: id,
            authorId: req.user.id
          },
          include: {
            author: {
              select: { name: true, email: true, role: true }
            }
          }
        });

        return res.status(201).json(comment);
      } catch (error) {
        console.error("Comment POST error:", error);
        return res.status(500).json({ error: "Failed to create comment" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
});