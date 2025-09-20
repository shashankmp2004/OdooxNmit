import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    // Get record counts for all tables
    const [
      userCount,
      productCount,
      manufacturingOrderCount,
      workOrderCount,
      stockEntryCount,
      commentCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.manufacturingOrder.count(),
      prisma.workOrder.count(),
      prisma.stockEntry.count(),
      prisma.comment.count()
    ]);

    const tablesInfo = [
      { tableName: 'User', recordCount: userCount },
      { tableName: 'Product', recordCount: productCount },
      { tableName: 'ManufacturingOrder', recordCount: manufacturingOrderCount },
      { tableName: 'WorkOrder', recordCount: workOrderCount },
      { tableName: 'StockEntry', recordCount: stockEntryCount },
      { tableName: 'Comment', recordCount: commentCount },
    ];

    return res.status(200).json(tablesInfo);
  } catch (error) {
    console.error("Error fetching tables info:", error);
    return res.status(500).json({ error: "Failed to fetch database information" });
  }
});