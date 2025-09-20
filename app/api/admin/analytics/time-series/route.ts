import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

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

    // Generate time series data
    const timeSeriesData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Get user signups for this date
      const userCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(currentDate),
            lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      // Get manufacturing orders for this date
      const orderCount = await prisma.manufacturingOrder.count({
        where: {
          createdAt: {
            gte: new Date(currentDate),
            lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      // Get production activities (work orders completed)
      const productionCount = await prisma.workOrder.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(currentDate),
            lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      timeSeriesData.push({
        date: dateStr,
        users: userCount,
        orders: orderCount,
        production: productionCount
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json(timeSeriesData)
  } catch (error) {
    console.error('Error fetching time series data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}