import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(), // Added for frontend compatibility
  unit: z.string().optional(), // Added for frontend compatibility
  minStockAlert: z.number().int().nonnegative().optional(), // Added for frontend compatibility
  bomLink: z.string().optional(), // Added for frontend compatibility
  isFinished: z.boolean().default(false)
});

const updateProductSchema = createProductSchema.partial();

export default requireRole(["ADMIN", "MANAGER"], async (req, res) => {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const { search, isFinished, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        
        if (search) {
          where.OR = [
            { name: { contains: search as string, mode: "insensitive" } },
            { sku: { contains: search as string, mode: "insensitive" } },
            { description: { contains: search as string, mode: "insensitive" } }
          ];
        }

        if (isFinished !== undefined) {
          where.isFinished = isFinished === "true";
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: {
              bom: {
                include: {
                  components: {
                    include: {
                      material: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  stockEntries: true,
                  manufacturingOrders: true
                }
              }
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" }
          }),
          prisma.product.count({ where })
        ]);

        return res.status(200).json({
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      } catch (error) {
        console.error("Products GET error:", error);
        return res.status(500).json({ error: "Failed to fetch products" });
      }

    case "POST":
      try {
        const parsed = createProductSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        const product = await prisma.product.create({
          data: parsed.data,
          include: {
            bom: {
              include: {
                components: {
                  include: {
                    material: true
                  }
                }
              }
            }
          }
        });

        return res.status(201).json(product);
      } catch (error: any) {
        console.error("Products POST error:", error);
        
        if (error.code === "P2002") {
          return res.status(400).json({ error: "SKU already exists" });
        }
        
        return res.status(500).json({ error: "Failed to create product" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end();
  }
});