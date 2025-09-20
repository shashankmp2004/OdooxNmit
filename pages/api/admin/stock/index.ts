import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method === "GET") {
    try {
      const stockEntries = await prisma.stockEntry.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(stockEntries);
    } catch (error) {
      console.error("Error fetching stock entries:", error);
      return res.status(500).json({ error: "Failed to fetch stock entries" });
    }
  }

  if (req.method === "POST") {
    try {
      const { productId, type, quantity, reference, notes } = req.body;

      if (!productId || !type || !quantity) {
        return res.status(400).json({ error: "Product, type, and quantity are required" });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }

      // Validate type
      if (!['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ error: "Type must be 'IN' or 'OUT'" });
      }

      // Create stock entry
      const stockEntry = await prisma.stockEntry.create({
        data: {
          productId,
          type,
          quantity: parseInt(quantity),
          reference: reference || null,
          notes: notes || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return res.status(201).json(stockEntry);
    } catch (error) {
      console.error("Error creating stock entry:", error);
      return res.status(500).json({ error: "Failed to create stock entry" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
});