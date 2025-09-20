import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  isFinished: z.boolean().optional()
});

export default requireRole(["ADMIN", "MANAGER"], async (req, res) => {
  const { id } = req.query;
  const { method } = req;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Product ID is required" });
  }

  switch (method) {
    case "GET":
      try {
        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            boms: {
              include: {
                items: {
                  include: {
                    component: true
                  }
                }
              }
            },
            stockEntries: {
              orderBy: { createdAt: "desc" },
              take: 10
            },
            manufacturingOrders: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                createdBy: {
                  select: { name: true, email: true }
                }
              }
            },
            _count: {
              select: {
                stockEntries: true,
                manufacturingOrders: true
              }
            }
          }
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        // Calculate current stock balance
        const lastStockEntry = await prisma.stockEntry.findFirst({
          where: { productId: id },
          orderBy: { createdAt: "desc" }
        });

        const currentStock = lastStockEntry?.balanceAfter ?? 0;

        return res.status(200).json({
          ...product,
          currentStock
        });
      } catch (error) {
        console.error("Product GET error:", error);
        return res.status(500).json({ error: "Failed to fetch product" });
      }

    case "PUT":
      try {
        const parsed = updateProductSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        const product = await prisma.product.update({
          where: { id },
          data: parsed.data,
          include: {
            boms: {
              include: {
                items: {
                  include: {
                    component: true
                  }
                }
              }
            }
          }
        });

        return res.status(200).json(product);
      } catch (error: any) {
        console.error("Product PUT error:", error);
        
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Product not found" });
        }
        
        if (error.code === "P2002") {
          return res.status(400).json({ error: "SKU already exists" });
        }
        
        return res.status(500).json({ error: "Failed to update product" });
      }

    case "DELETE":
      // Only ADMIN can delete products
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admin can delete products" });
      }

      try {
        await prisma.product.delete({
          where: { id }
        });

        return res.status(204).end();
      } catch (error: any) {
        console.error("Product DELETE error:", error);
        
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Product not found" });
        }
        
        return res.status(500).json({ error: "Failed to delete product" });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end();
  }
});