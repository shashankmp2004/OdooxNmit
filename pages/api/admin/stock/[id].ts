import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid stock entry ID" });
  }

  if (req.method === "PUT") {
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

      // Update stock entry
      const stockEntry = await prisma.stockEntry.update({
        where: { id },
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

      return res.status(200).json(stockEntry);
    } catch (error) {
      console.error("Error updating stock entry:", error);
      return res.status(500).json({ error: "Failed to update stock entry" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Check if stock entry exists
      const stockEntry = await prisma.stockEntry.findUnique({
        where: { id }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      // Delete stock entry
      await prisma.stockEntry.delete({
        where: { id }
      });

      return res.status(200).json({ message: "Stock entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting stock entry:", error);
      return res.status(500).json({ error: "Failed to delete stock entry" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end();
});