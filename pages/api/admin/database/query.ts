import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    const { table, limit = '50', offset = '0', search = '' } = req.query;

    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: "Table name is required" });
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const searchTerm = search as string;

    let data: any[] = [];
    let totalCount = 0;
    let columns: string[] = [];

    // Switch based on table name and fetch data accordingly
    switch (table.toLowerCase()) {
      case 'user':
        const whereClause = searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { email: { contains: searchTerm, mode: 'insensitive' as const } },
            { role: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.user.findMany({
          where: whereClause,
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.user.count({ where: whereClause });
        columns = ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'];
        break;

      case 'product':
        const productWhere = searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
            { category: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.product.findMany({
          where: productWhere,
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.product.count({ where: productWhere });
        columns = ['id', 'name', 'description', 'category', 'unit', 'price', 'minStockAlert', 'bomLink', 'createdAt', 'updatedAt'];
        break;

      case 'manufacturingorder':
        const moWhere = searchTerm ? {
          OR: [
            { orderNo: { contains: searchTerm, mode: 'insensitive' as const } },
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { state: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.manufacturingOrder.findMany({
          where: moWhere,
          include: {
            product: { select: { name: true } },
            createdBy: { select: { name: true } }
          },
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.manufacturingOrder.count({ where: moWhere });
        columns = ['id', 'orderNo', 'name', 'quantity', 'state', 'deadline', 'product', 'createdBy', 'createdAt', 'updatedAt'];
        break;

      case 'workorder':
        const woWhere = searchTerm ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { taskName: { contains: searchTerm, mode: 'insensitive' as const } },
            { status: { contains: searchTerm, mode: 'insensitive' as const } },
            { priority: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.workOrder.findMany({
          where: woWhere,
          include: {
            mo: { select: { orderNo: true, name: true } },
            assignedTo: { select: { name: true } }
          },
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.workOrder.count({ where: woWhere });
        columns = ['id', 'title', 'taskName', 'description', 'status', 'priority', 'progress', 'estimatedTime', 'actualTime', 'mo', 'assignedTo', 'createdAt', 'updatedAt'];
        break;

      case 'stockentry':
        const stockWhere = searchTerm ? {
          OR: [
            { type: { contains: searchTerm, mode: 'insensitive' as const } },
            { reference: { contains: searchTerm, mode: 'insensitive' as const } },
            { notes: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.stockEntry.findMany({
          where: stockWhere,
          include: {
            product: { select: { name: true } }
          },
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.stockEntry.count({ where: stockWhere });
        columns = ['id', 'type', 'quantity', 'reference', 'notes', 'product', 'createdAt'];
        break;

      case 'comment':
        const commentWhere = searchTerm ? {
          OR: [
            { text: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {};

        data = await prisma.comment.findMany({
          where: commentWhere,
          include: {
            user: { select: { name: true } },
            workOrder: { select: { title: true } }
          },
          skip: offsetNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        totalCount = await prisma.comment.count({ where: commentWhere });
        columns = ['id', 'text', 'user', 'workOrder', 'createdAt'];
        break;

      default:
        return res.status(400).json({ error: "Invalid table name" });
    }

    return res.status(200).json({
      data,
      columns,
      recordCount: totalCount
    });

  } catch (error) {
    console.error("Error querying database:", error);
    return res.status(500).json({ error: "Failed to query database" });
  }
});