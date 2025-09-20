import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get("months") || "6")

    // Generate last N months of data
    const monthlyData = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))

      const [completedOrders, totalOrders] = await Promise.all([
        // Completed manufacturing orders in this month
        prisma.manufacturingOrder.count({
          where: {
            status: "COMPLETED",
            updatedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
        // Total manufacturing orders created in this month
        prisma.manufacturingOrder.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
      ])

      // Calculate target based on historical average + 10%
      const baseTarget = Math.max(totalOrders, 50) // Minimum target of 50
      const target = Math.round(baseTarget * 1.1)

      monthlyData.push({
        month: format(monthStart, "MMM"),
        output: completedOrders,
        target: target,
      })
    }

    return NextResponse.json(monthlyData)
  } catch (error) {
    console.error("Error fetching production analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch production analytics" },
      { status: 500 }
    )
  }
}