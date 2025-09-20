import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bomComponentSchema = z.object({
  materialId: z.string(),
  qtyPerUnit: z.number().positive()
});

const createBomSchema = z.object({
  components: z.array(bomComponentSchema).min(1, "At least one component is required")
});

export default requireRole(["ADMIN", "MANAGER"], async (req, res) => {
  const { id } = req.query; // product ID
  const { method } = req;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Product ID is required" });
  }

  switch (method) {
    case "GET":
      try {
        const bom = await prisma.bOM.findUnique({
          where: { productId: id },
          include: {
            components: {
              include: {
                material: true
              }
            },
            product: true
          }
        });

        if (!bom) {
          return res.status(404).json({ error: "BOM not found for this product" });
        }

        return res.status(200).json(bom);
      } catch (error) {
        console.error("BOM GET error:", error);
        return res.status(500).json({ error: "Failed to fetch BOM" });
      }

    case "POST":
      try {
        // Check if product exists and is a finished product
        const product = await prisma.product.findUnique({
          where: { id }
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        if (!product.isFinished) {
          return res.status(400).json({ error: "BOM can only be created for finished products" });
        }

        const parsed = createBomSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Check if BOM already exists
        const existingBom = await prisma.bOM.findUnique({
          where: { productId: id }
        });

        if (existingBom) {
          return res.status(400).json({ error: "BOM already exists for this product" });
        }

        // Validate that all materials exist
        const materialIds = parsed.data.components.map(c => c.materialId);
        const materials = await prisma.product.findMany({
          where: { 
            id: { in: materialIds },
            isFinished: false // Only raw materials can be used in BOM
          }
        });

        if (materials.length !== materialIds.length) {
          return res.status(400).json({ error: "Some materials not found or are finished products" });
        }

        const bom = await prisma.bOM.create({
          data: {
            productId: id,
            components: {
              create: parsed.data.components
            }
          },
          include: {
            components: {
              include: {
                material: true
              }
            },
            product: true
          }
        });

        return res.status(201).json(bom);
      } catch (error) {
        console.error("BOM POST error:", error);
        return res.status(500).json({ error: "Failed to create BOM" });
      }

    case "PUT":
      try {
        const parsed = createBomSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            error: "Invalid input", 
            details: parsed.error.flatten() 
          });
        }

        // Validate that all materials exist
        const materialIds = parsed.data.components.map(c => c.materialId);
        const materials = await prisma.product.findMany({
          where: { 
            id: { in: materialIds },
            isFinished: false
          }
        });

        if (materials.length !== materialIds.length) {
          return res.status(400).json({ error: "Some materials not found or are finished products" });
        }

        // Update BOM using transaction
        const bom = await prisma.$transaction(async (tx: any) => {
          // Delete existing components
          await tx.bOMComponent.deleteMany({
            where: { 
              bom: { productId: id }
            }
          });

          // Update or create BOM with new components
          return tx.bOM.upsert({
            where: { productId: id },
            update: {
              components: {
                create: parsed.data.components
              }
            },
            create: {
              productId: id,
              components: {
                create: parsed.data.components
              }
            },
            include: {
              components: {
                include: {
                  material: true
                }
              },
              product: true
            }
          });
        });

        return res.status(200).json(bom);
      } catch (error) {
        console.error("BOM PUT error:", error);
        return res.status(500).json({ error: "Failed to update BOM" });
      }

    case "DELETE":
      // Only ADMIN can delete BOMs
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admin can delete BOMs" });
      }

      try {
        await prisma.bOM.delete({
          where: { productId: id }
        });

        return res.status(204).end();
      } catch (error: any) {
        console.error("BOM DELETE error:", error);
        
        if (error.code === "P2025") {
          return res.status(404).json({ error: "BOM not found" });
        }
        
        return res.status(500).json({ error: "Failed to delete BOM" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end();
  }
});