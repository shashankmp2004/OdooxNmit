import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// GET /api/admin/work-centers - Get all work centers
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workCenters = await prisma.workCenter.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add default values for missing fields (simplified until Prisma client is regenerated)
    const workCentersWithDefaults = workCenters.map(workCenter => ({
      ...workCenter,
      location: "Not specified", // Will be available after schema update
      status: "AVAILABLE", // Will be available after schema update
      currentUtilization: 0, // Will be calculated properly after Prisma client regeneration
      _count: {
        workOrders: 0 // Will be calculated properly after Prisma client regeneration
      }
    }))

    return NextResponse.json(workCentersWithDefaults)
  } catch (error) {
    console.error('Error fetching work centers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/work-centers - Create new work center
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, capacity } = body

    // Validate required fields
    if (!name || !capacity) {
      return NextResponse.json({ 
        error: 'Name and capacity are required' 
      }, { status: 400 })
    }

    // Check if work center with same name already exists
    const existingWorkCenter = await prisma.workCenter.findFirst({
      where: { name }
    })

    if (existingWorkCenter) {
      return NextResponse.json({ 
        error: 'Work center with this name already exists' 
      }, { status: 400 })
    }

    const workCenter = await prisma.workCenter.create({
      data: {
        name,
        description: description || null,
        capacity: parseInt(capacity)
      }
    })

    return NextResponse.json({
      ...workCenter,
      location: "Not specified", // Will be available after schema update
      status: "AVAILABLE", // Will be available after schema update
      currentUtilization: 0, // New work center starts with 0% utilization
      _count: {
        workOrders: 0
      }
    })
  } catch (error) {
    console.error('Error creating work center:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}