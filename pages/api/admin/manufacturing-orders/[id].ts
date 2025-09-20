import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid manufacturing order ID" });
  }

  if (req.method === "PUT") {
    try {
      const { orderNo, name, productId, quantity, state, deadline } = req.body;

      if (!orderNo || !name || !productId || !quantity) {
        return res.status(400).json({ error: "Order number, name, product, and quantity are required" });
      }

      // Check if order number is already taken by another order
      const existingOrder = await prisma.manufacturingOrder.findFirst({
        where: {
          orderNo,
          id: { not: id }
        }
      });

      if (existingOrder) {
        return res.status(400).json({ error: "Order number is already taken by another order" });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }

      // Decide BOM snapshot handling: if product changed or snapshot missing, regenerate snapshot
      const existing = await prisma.manufacturingOrder.findUnique({ where: { id } });

      let bomSnapshot: any = existing?.bomSnapshot || null;
      const productChanged = existing?.productId !== productId;
      if (productChanged || !bomSnapshot) {
        const activeBOM = await prisma.bOM.findFirst({
          where: { productId, isActive: true },
          include: {
            items: { include: { component: true } },
            components: { include: { material: true } }
          }
        });
        if (activeBOM) {
          if (activeBOM.items && activeBOM.items.length > 0) {
            bomSnapshot = activeBOM.items.map((i: any) => ({
              materialId: i.componentId,
              materialName: i.component?.name,
              materialSku: i.component?.sku,
              qtyPerUnit: i.quantity
            }));
          } else if (activeBOM.components && activeBOM.components.length > 0) {
            bomSnapshot = activeBOM.components.map((c: any) => ({
              materialId: c.materialId,
              materialName: c.material?.name,
              materialSku: c.material?.sku,
              qtyPerUnit: c.qtyPerUnit
            }));
          }
        }
      }

      // Update manufacturing order
      const order = await prisma.manufacturingOrder.update({
        where: { id },
        data: {
          orderNo,
          name,
          productId,
          quantity: parseInt(quantity),
          state: state || 'PLANNED',
          deadline: deadline ? new Date(deadline) : null,
          bomSnapshot,
          updatedAt: new Date(),
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

      return res.status(200).json(order);
    } catch (error) {
      console.error("Error updating manufacturing order:", error);
      return res.status(500).json({ error: "Failed to update manufacturing order" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Check if order exists
      const order = await prisma.manufacturingOrder.findUnique({
        where: { id },
        include: {
          workOrders: true
        }
      });

      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }

      // Check if order has related work orders
      if (order.workOrders.length > 0) {
        return res.status(400).json({ error: "Cannot delete manufacturing order with associated work orders" });
      }

      // Delete manufacturing order
      await prisma.manufacturingOrder.delete({
        where: { id }
      });

      return res.status(200).json({ message: "Manufacturing order deleted successfully" });
    } catch (error) {
      console.error("Error deleting manufacturing order:", error);
      return res.status(500).json({ error: "Failed to delete manufacturing order" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end();
});