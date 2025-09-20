import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    // Get current month start for recent signups
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)

    // Fetch all statistics in parallel
    const [
      totalUsers,
      usersByRole,
      recentSignups,
      totalProducts,
      productsByCategory,
      lowStockProducts,
      activeManufacturingOrders,
      completedOrdersThisMonth,
      pendingWorkOrders,
      inProgressWorkOrders,
      totalStockEntries,
      stockAlerts,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: currentMonthStart
          }
        }
      }),

      // Products
      prisma.product.count(),
      prisma.product.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.product.count({
        where: {
          minStockAlert: {
            not: null
          }
          // We'll calculate actual low stock in a more complex query later
        }
      }),

      // Manufacturing Orders
      prisma.manufacturingOrder.count({
        where: {
          state: {
            in: ['PLANNED', 'IN_PROGRESS']
          }
        }
      }),
      prisma.manufacturingOrder.count({
        where: {
          state: 'DONE',
          updatedAt: {
            gte: currentMonthStart
          }
        }
      }),

      // Work Orders
      prisma.workOrder.count({
        where: {
          status: 'PENDING'
        }
      }),
      prisma.workOrder.count({
        where: {
          status: {
            in: ['STARTED', 'PAUSED']
          }
        }
      }),

      // Stock
      prisma.stockEntry.count(),
      // For now, just count products with minStockAlert set
      prisma.product.count({
        where: {
          AND: [
            { minStockAlert: { not: null } },
            { minStockAlert: { gt: 0 } }
          ]
        }
      }),
    ])

    // Calculate low stock products properly
    const productsWithStock = await prisma.product.findMany({
      where: {
        minStockAlert: {
          not: null,
          gt: 0
        }
      },
      include: {
        stockEntries: true
      }
    })

    let actualLowStockCount = 0
    for (const product of productsWithStock) {
      const stockIn = product.stockEntries
        .filter((entry: any) => entry.type === 'IN')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0)
      
      const stockOut = product.stockEntries
        .filter((entry: any) => entry.type === 'OUT')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0)
      
      const currentStock = stockIn - stockOut
      
      if (product.minStockAlert && currentStock < product.minStockAlert) {
        actualLowStockCount++
      }
    }

    // Format the response
    const stats = {
      users: {
        total: totalUsers,
        byRole: usersByRole.map(group => ({
          role: group.role,
          count: group._count.role
        })),
        recentSignups: recentSignups
      },
      products: {
        total: totalProducts,
        lowStock: actualLowStockCount,
        categories: productsByCategory.map(group => ({
          category: group.category || 'Uncategorized',
          count: group._count.category
        }))
      },
      manufacturing: {
        activeOrders: activeManufacturingOrders,
        completedThisMonth: completedOrdersThisMonth,
        pendingWork: pendingWorkOrders,
        inProgressWork: inProgressWorkOrders
      },
      stock: {
        totalValue: 0, // Would need product pricing to calculate
        movements: totalStockEntries,
        alerts: actualLowStockCount
      }
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return res.status(500).json({ error: "Failed to fetch admin statistics" })
  }
});