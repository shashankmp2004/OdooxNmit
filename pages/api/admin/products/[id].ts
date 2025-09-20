import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  if (req.method === "PUT") {
    try {
      const { name, description, category, unit, price, minStockAlert, bomLink } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Product name is required" });
      }

      // Check if name is already taken by another product
      const existingProduct = await prisma.product.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (existingProduct) {
        return res.status(400).json({ error: "Product name is already taken by another product" });
      }

      // Update product
      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description: description || null,
          category: category || null,
          unit: unit || null,
          price: price || null,
          minStockAlert: minStockAlert || null,
          bomLink: bomLink || null,
        },
        include: {
          stockEntries: true,
        }
      });

      // Calculate current stock
      const stockIn = product.stockEntries
        .filter((entry: any) => entry.type === 'IN')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0);
      
      const stockOut = product.stockEntries
        .filter((entry: any) => entry.type === 'OUT')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0);
      
      const currentStock = stockIn - stockOut;

      const { stockEntries, ...productData } = product;

      return res.status(200).json({ ...productData, currentStock });
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          manufacturingOrders: true,
          stockEntries: true,
        }
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if product has related data
      if (product.manufacturingOrders.length > 0) {
        return res.status(400).json({ error: "Cannot delete product with associated manufacturing orders" });
      }

      if (product.stockEntries.length > 0) {
        return res.status(400).json({ error: "Cannot delete product with stock entries" });
      }

      // Delete product
      await prisma.product.delete({
        where: { id }
      });

      return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end();
});