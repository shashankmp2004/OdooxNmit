import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createStockEntrySchema = z.object({
  productId: z.string(),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().positive("Quantity must be positive"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional()
});

const updateStockEntrySchema = createStockEntrySchema.partial();

export default requireRole(["ADMIN", "MANAGER", "INVENTORY"], async (req, res) => {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { 
          productId, 
          type, 
          search, 
          page = "1", 
          limit = "10" 
        } = req.query;
        
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        
        if (productId) {
          where.productId = productId;
        }

        if (type) {
          where.type = type;
        }

        if (search) {
          where.OR = [
            { reference: { contains: search as string, mode: "insensitive" } },
            { notes: { contains: search as string, mode: "insensitive" } },
            { product: { name: { contains: search as string, mode: "insensitive" } } }
          ];
        }

        const [entries, total] = await Promise.all([
          prisma.stockEntry.findMany({
            where,
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: true,
                  unit: true
                }
              }
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" }
          }),
          prisma.stockEntry.count({ where })
        ]);

        return res.status(200).json({
          entries,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        console.error("Stock Entries GET error:", error);
        return res.status(500).json({ error: "Failed to fetch stock entries" });
      }

    case "POST":
      try {
        const parsed = createStockEntrySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Verify product exists
        const product = await prisma.product.findUnique({
          where: { id: parsed.data.productId }
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        // Calculate change value based on type
        const change = parsed.data.type === "IN" ? parsed.data.quantity : -parsed.data.quantity;

        // Get current stock to calculate balance after
        const currentStock = await getCurrentStock(parsed.data.productId);
        const balanceAfter = currentStock + change;

        // Create stock entry
        const entry = await prisma.stockEntry.create({
          data: {
            productId: parsed.data.productId,
            type: parsed.data.type,
            quantity: parsed.data.quantity,
            change,
            reference: parsed.data.reference,
            notes: parsed.data.notes,
            sourceType: parsed.data.sourceType,
            sourceId: parsed.data.sourceId,
            balanceAfter
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                unit: true
              }
            }
          }
        });

        return res.status(201).json(entry);
      } catch (error) {
        console.error("Stock Entry POST error:", error);
        return res.status(500).json({ error: "Failed to create stock entry" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
});

// Helper function to calculate current stock
async function getCurrentStock(productId: string): Promise<number> {
  const entries = await prisma.stockEntry.findMany({
    where: { productId },
    select: { change: true }
  });

  return entries.reduce((total: number, entry: { change: number }) => total + entry.change, 0);
}