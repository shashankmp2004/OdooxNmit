import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// Force dynamic execution on Node.js runtime; disable caching
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalWorkOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.manufacturingOrder.count(),
      prisma.workOrder.count()
    ])

    // Calculate uptime (mock data)
    const uptime = Math.floor(Math.random() * 30) + 1 // Random days between 1-30

    const systemStats = {
      dbSize: `${Math.floor(Math.random() * 500) + 100} MB`, // Mock database size
      totalUsers,
      totalProducts,
      totalOrders,
      totalWorkOrders,
      lastBackup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Random date within last week
      uptime: `${uptime} days`,
      version: '1.0.0'
    }

    return NextResponse.json(systemStats)
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}