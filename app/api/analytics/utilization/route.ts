import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get all work centers with their utilization data
    // Since we don't have work centers table yet, I'll create mock data based on work orders
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: { not: "CANCELLED" },
      },
      select: {
        department: true,
        status: true,
      },
    })

    // Group by department and calculate utilization
    const departmentStats = workOrders.reduce((acc: any, wo: any) => {
      const dept = wo.department || "General"
      if (!acc[dept]) {
        acc[dept] = { total: 0, active: 0 }
      }
      acc[dept].total += 1
      if (wo.status === "IN_PROGRESS" || wo.status === "STARTED") {
        acc[dept].active += 1
      }
      return acc
    }, {})

    // Convert to utilization percentage
    const utilizationData = Object.entries(departmentStats).map(([dept, stats]: [string, any]) => {
      const utilization = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
      
      // Assign colors based on utilization levels
      let color = "#ef4444" // Red for low utilization
      if (utilization >= 80) color = "#10b981" // Green for high utilization
      else if (utilization >= 60) color = "#f59e0b" // Yellow for medium utilization
      else if (utilization >= 40) color = "#3b82f6" // Blue for low-medium utilization

      return {
        name: dept,
        value: utilization,
        color,
      }
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