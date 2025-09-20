import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    const [
      totalProducts,
      lowStockItems,
      stockInToday,
      stockOutToday,
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),

      // Low stock items (assuming items with quantity < 10 are low stock)
      prisma.product.count({
        where: {
          quantity: {
            lt: 10,
          },
        },
      }),

      // Stock in today (sum of positive stock entries today)
      prisma.stockEntry.aggregate({
        where: {
          quantity: { gt: 0 },
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // Stock out today (sum of negative stock entries today)
      prisma.stockEntry.aggregate({
        where: {
          quantity: { lt: 0 },
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          quantity: true,
        },
      }),
    ])

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      lowStockItems: lowStockItems || 0,
      stockInToday: stockInToday._sum.quantity || 0,
      stockOutToday: Math.abs(stockOutToday._sum.quantity || 0), // Make positive for display
    })
  } catch (error) {
    console.error("Error fetching stock stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock statistics" },
      { status: 500 }
    )
  }
}