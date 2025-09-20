import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method === "GET") {
    try {
      const products = await prisma.product.findMany({
        include: {
          stockEntries: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate current stock for each product
      const productsWithStock = products.map((product: any) => {
        const stockIn = product.stockEntries
          .filter((entry: any) => entry.type === 'IN')
          .reduce((sum: number, entry: any) => sum + entry.quantity, 0);
        
        const stockOut = product.stockEntries
          .filter((entry: any) => entry.type === 'OUT')
          .reduce((sum: number, entry: any) => sum + entry.quantity, 0);
        
        const currentStock = stockIn - stockOut;

        const { stockEntries, ...productData } = product;
        return {
          ...productData,
          currentStock
        };
      });

      return res.status(200).json(productsWithStock);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, description, category, unit, price, minStockAlert, bomLink } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Product name is required" });
      }

      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: { name }
      });

      if (existingProduct) {
        return res.status(400).json({ error: "Product with this name already exists" });
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name,
          description: description || null,
          category: category || null,
          unit: unit || null,
          price: price || null,
          minStockAlert: minStockAlert || null,
          bomLink: bomLink || null,
        }
      });

      return res.status(201).json({ ...product, currentStock: 0 });
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
});