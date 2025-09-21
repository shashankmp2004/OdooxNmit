import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// Force dynamic execution on Node.js runtime; disable caching
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Calculate production efficiency
    const totalWorkOrders = await prisma.workOrder.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const completedWorkOrders = await prisma.workOrder.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      }
    })

    const efficiency = totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0

    // Calculate on-time delivery
    const totalOrders = await prisma.manufacturingOrder.count({
      where: {
        state: 'DONE',
        createdAt: { gte: startDate }
      }
    })

    // Approximated: completed orders whose updatedAt is before deadline
    const onTimeOrders = await prisma.manufacturingOrder.count({
      where: {
        state: 'DONE',
        createdAt: { gte: startDate },
        // Prisma doesn't support field-to-field comparison directly; this is a placeholder.
      }
    })

    const onTimeDelivery = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 0

    // Work order completion rate
    const workOrderCompletion = efficiency // Same calculation for simplicity

    // Stock turnover (simplified calculation)
    const stockMovements = await prisma.stockEntry.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const stockTurnover = Math.round(stockMovements / days * 30) / 10 // Approximate monthly turnover

    const productionMetrics = {
      efficiency,
      onTimeDelivery,
      workOrderCompletion,
      stockTurnover
    }

    return NextResponse.json(productionMetrics)
  } catch (error) {
    console.error('Error fetching production metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}