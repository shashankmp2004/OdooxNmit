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
      stockInToday,
      stockOutToday,
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),

      // Stock in today (sum of IN type stock entries today)
      prisma.stockEntry.aggregate({
        where: {
          type: 'IN',
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // Stock out today (sum of OUT type stock entries today)
      prisma.stockEntry.aggregate({
        where: {
          type: 'OUT',
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

    // Calculate low stock items by getting products with current stock below minStockAlert
    const productsWithStock = await prisma.product.findMany({
      where: {
        minStockAlert: {
          not: null,
        },
      },
      include: {
        stockEntries: true,
      },
    })

    let lowStockItems = 0
    for (const product of productsWithStock) {
      // Calculate current stock (sum of IN entries minus sum of OUT entries)
      const stockIn = product.stockEntries
        .filter((entry: any) => entry.type === 'IN')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0)
      
      const stockOut = product.stockEntries
        .filter((entry: any) => entry.type === 'OUT')
        .reduce((sum: number, entry: any) => sum + entry.quantity, 0)
      
      const currentStock = stockIn - stockOut
      
      if (product.minStockAlert && currentStock < product.minStockAlert) {
        lowStockItems++
      }
    }

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      lowStockItems: lowStockItems || 0,
      stockInToday: stockInToday._sum.quantity || 0,
      stockOutToday: stockOutToday._sum.quantity || 0,
    })
  } catch (error) {
    console.error("Error fetching stock stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock statistics" },
      { status: 500 }
    )
  }
}