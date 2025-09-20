import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN", "MANAGER", "INVENTORY"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    const { category } = req.query;

    // Get all stock entries grouped by product
    const stockEntries = await prisma.stockEntry.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

  // Group entries by product and calculate summary
    const productStockMap = new Map();

    stockEntries.forEach((entry: any) => {
      const productId = entry.product.id;
      
      if (!productStockMap.has(productId)) {
        productStockMap.set(productId, {
          productId: entry.product.id,
          productName: entry.product.name,
          category: entry.product.category || "Uncategorized",
          unit: entry.product.unit || "pcs",
          currentStock: 0,
          totalIn: 0,
          totalOut: 0,
          lastUpdated: entry.createdAt
        });
      }

      const productStock = productStockMap.get(productId);
      
      // Use balanceAfter for current stock; add totals by type for reporting
      productStock.currentStock = entry.balanceAfter ?? productStock.currentStock + entry.change;

      if (entry.type === "IN") {
        productStock.totalIn += entry.quantity;
      } else if (entry.type === "OUT") {
        productStock.totalOut += entry.quantity;
      }
      
      // Update last updated time
      if (entry.createdAt > productStock.lastUpdated) {
        productStock.lastUpdated = entry.createdAt;
      }
    });

    let stockSummary = Array.from(productStockMap.values());

    // Apply category filter if provided
    if (category && category !== "all") {
      stockSummary = stockSummary.filter(item => item.category === category);
    }

    return res.status(200).json(stockSummary);
  } catch (error) {
    console.error("Stock Summary GET error:", error);
    return res.status(500).json({ error: "Failed to fetch stock summary" });
  }
});