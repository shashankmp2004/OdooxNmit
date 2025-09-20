import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Get all work centers with their utilization data
    const centers = await prisma.workCenter.findMany({ select: { id: true, name: true } })
    const woByCenter = await prisma.workOrder.groupBy({
      by: ['workCenterId', 'status'],
      _count: { _all: true },
      where: { workCenterId: { not: null } },
    } as any)

    const map = new Map<string, { total: number; active: number }>()
    for (const row of woByCenter as any[]) {
      const key = row.workCenterId as string
      const status = row.status as string
      const count = row._count._all as number
      const entry = map.get(key) || { total: 0, active: 0 }
      entry.total += count
      if (status === 'STARTED' || status === 'IN_PROGRESS') entry.active += count
      map.set(key, entry)
    }

    const utilizationData = centers.map((c) => {
      const stats = map.get(c.id) || { total: 0, active: 0 }
      const utilization = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
      let color = "#ef4444"
      if (utilization >= 80) color = "#10b981"
      else if (utilization >= 60) color = "#f59e0b"
      else if (utilization >= 40) color = "#3b82f6"
      return { name: c.name, value: utilization, color }
    })

    // If no data, return default mock data
    if (utilizationData.length === 0) {
      return NextResponse.json([
        { name: "Welding Station A", value: 75, color: "#3b82f6" },
        { name: "Assembly Line B", value: 85, color: "#10b981" },
        { name: "CNC Machine 3", value: 65, color: "#f59e0b" },
        { name: "QC Station 1", value: 45, color: "#ef4444" },
        { name: "Electrical Station", value: 70, color: "#8b5cf6" },
      ])
    }

    return NextResponse.json(utilizationData)
  } catch (error) {
    console.error("Error fetching utilization analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch utilization analytics" },
      { status: 500 }
    )
  }
}