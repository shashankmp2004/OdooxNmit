import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const [products, workOrders] = await Promise.all([
      // Get unique product names
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
        },
        take: 10, // Limit to prevent too many options
      }),
      
      // Get unique departments/work centers from work orders
      prisma.workOrder.findMany({
        select: {
          department: true,
        },
        distinct: ['department'],
        where: {
          department: { not: null },
        },
      }),
    ])

    // Process unique departments
    const workCenters = workOrders
      .map((wo: any) => wo.department)
      .filter((dept: any) => dept !== null)
      .map((dept: any) => ({ id: dept, name: dept }))

    return NextResponse.json({
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
      workCenters: workCenters,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    )
  }
}