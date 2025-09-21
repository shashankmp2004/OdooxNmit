import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

// Force dynamic execution on Node.js runtime; disable caching
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const [products, workCenters] = await Promise.all([
      // Get unique product names
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
        },
        take: 10, // Limit to prevent too many options
      }),
      
      // Get available work centers
      prisma.workCenter.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 50,
      }),
    ])

    return NextResponse.json({
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
      workCenters,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    )
  }
}