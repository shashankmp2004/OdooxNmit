import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    const { table } = req.query;

    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: "Table name is required" });
    }

    let data: any[] = [];

    // Fetch all data from the specified table
    switch (table.toLowerCase()) {
      case 'user':
        data = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'product':
        data = await prisma.product.findMany({
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'manufacturingorder':
        data = await prisma.manufacturingOrder.findMany({
          include: {
            product: { select: { name: true } },
            createdBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'workorder':
        data = await prisma.workOrder.findMany({
          include: {
            mo: { select: { orderNo: true, name: true } },
            assignedTo: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'stockentry':
        data = await prisma.stockEntry.findMany({
          include: {
            product: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
      case 'comment':
        data = await prisma.comment.findMany({
          include: {
            user: { select: { name: true } },
            workOrder: { select: { title: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
      default:
        return res.status(400).json({ error: "Invalid table name" });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${table}_export.json"`);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({ error: "Failed to export data" });
  }
});