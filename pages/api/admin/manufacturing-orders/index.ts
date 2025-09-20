import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method === "GET") {
    try {
      const orders = await prisma.manufacturingOrder.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching manufacturing orders:", error);
      return res.status(500).json({ error: "Failed to fetch manufacturing orders" });
    }
  }

  if (req.method === "POST") {
    try {
      const { orderNo, name, productId, quantity, state, deadline } = req.body;

      if (!orderNo || !name || !productId || !quantity) {
        return res.status(400).json({ error: "Order number, name, product, and quantity are required" });
      }

      // Check if order number already exists
      const existingOrder = await prisma.manufacturingOrder.findFirst({
        where: { orderNo }
      });

      if (existingOrder) {
        return res.status(400).json({ error: "Order number already exists" });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }

      // Try to build a BOM snapshot for this product (using either new BOM.items or legacy BOM.components)
      // Prefer active BOM version if available
      const activeBOM = await prisma.bOM.findFirst({
        where: { productId, isActive: true },
        include: {
          items: { include: { component: true } },
          components: { include: { material: true } }
        }
      });

      let bomSnapshot: any = null;
      if (activeBOM) {
        if (activeBOM.items && activeBOM.items.length > 0) {
          // New structure
          bomSnapshot = activeBOM.items.map((i: any) => ({
            materialId: i.componentId,
            materialName: i.component?.name,
            materialSku: i.component?.sku,
            qtyPerUnit: i.quantity
          }));
        } else if (activeBOM.components && activeBOM.components.length > 0) {
          // Legacy structure
          bomSnapshot = activeBOM.components.map((c: any) => ({
            materialId: c.materialId,
            materialName: c.material?.name,
            materialSku: c.material?.sku,
            qtyPerUnit: c.qtyPerUnit
          }));
        }
      }

      // Create manufacturing order
      const order = await prisma.manufacturingOrder.create({
        data: {
          orderNo,
          name,
          productId,
          quantity: parseInt(quantity),
          state: state || 'PLANNED',
          deadline: deadline ? new Date(deadline) : null,
          bomSnapshot,
          // Record who created the MO when available via auth wrapper
          createdById: (req as any).user?.id || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              name: true
            }
          }
        }
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error("Error creating manufacturing order:", error);
      return res.status(500).json({ error: "Failed to create manufacturing order" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
});