import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const weeks = parseInt(searchParams.get("weeks") || "6")

    // Generate last N weeks of data
    const weeklyData = []
    const now = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i))
      const weekEnd = endOfWeek(subWeeks(now, i))

      const [completedCount, delayedCount] = await Promise.all([
        // Completed orders in this week (use completedAt when available, fallback to updatedAt)
        prisma.manufacturingOrder.count({
          where: {
            state: "DONE",
            OR: [
              { completedAt: { gte: weekStart, lte: weekEnd } },
              {
                AND: [
                  { completedAt: null },
                  { updatedAt: { gte: weekStart, lte: weekEnd } },
                ],
              },
            ],
          },
        }),
        // Delayed orders (past due date but not completed)
        prisma.manufacturingOrder.count({
          where: {
            OR: [
              { state: "IN_PROGRESS" },
              { state: "PLANNED" },
            ],
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
            deadline: { lt: weekEnd },
          },
        }),
      ])

      weeklyData.push({
        week: `Week ${weeks - i}`,
        completed: completedCount,
        delayed: delayedCount,
      })
    }

    return NextResponse.json(weeklyData)
  } catch (error) {
    console.error("Error fetching orders analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders analytics" },
      { status: 500 }
    )
  }
}