import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || (session.user as any).role !== 'admin') {
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
        status: 'DONE',
        createdAt: { gte: startDate }
      }
    })

    const onTimeOrders = await prisma.manufacturingOrder.count({
      where: {
        status: 'DONE',
        createdAt: { gte: startDate },
        updatedAt: { lte: prisma.manufacturingOrder.fields.deadline }
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