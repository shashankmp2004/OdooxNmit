import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method === "GET") {
    try {
      const workOrders = await prisma.workOrder.findMany({
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      return res.status(500).json({ error: "Failed to fetch work orders" });
    }
  }

  if (req.method === "POST") {
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

      // Create work order
      const workOrder = await prisma.workOrder.create({
        data: {
          title,
          taskName: taskName || null,
          description: description || null,
          moId,
          assignedToId: assignedToId || null,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          estimatedTime: estimatedTime || null,
          progress: 0,
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

      return res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      return res.status(500).json({ error: "Failed to create work order" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
});