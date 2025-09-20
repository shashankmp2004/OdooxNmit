import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// GET /api/admin/work-centers/[id] - Get specific work center
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workCenter = await prisma.workCenter.findUnique({
      where: { id: params.id }
    })

    if (!workCenter) {
      return NextResponse.json({ error: 'Work center not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...workCenter,
      location: "Not specified", // Will be available after schema update
      status: "AVAILABLE", // Will be available after schema update
      currentUtilization: 0, // Will be calculated properly after Prisma client regeneration
      _count: {
        workOrders: 0 // Will be calculated properly after Prisma client regeneration
      }
    })
  } catch (error) {
    console.error('Error fetching work center:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/work-centers/[id] - Update work center
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if work center exists
    const existingWorkCenter = await prisma.workCenter.findUnique({
      where: { id: params.id }
    })

    if (!existingWorkCenter) {
      return NextResponse.json({ error: 'Work center not found' }, { status: 404 })
    }

    // Check if another work center with same name exists (excluding current one)
    if (name !== existingWorkCenter.name) {
      const duplicateWorkCenter = await prisma.workCenter.findFirst({
        where: { 
          name,
          NOT: { id: params.id }
        }
      })

      if (duplicateWorkCenter) {
        return NextResponse.json({ 
          error: 'Work center with this name already exists' 
        }, { status: 400 })
      }
    }

    const workCenter = await prisma.workCenter.update({
      where: { id: params.id },
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
      currentUtilization: 0, // Will be calculated properly after Prisma client regeneration
      _count: {
        workOrders: 0 // Will be calculated properly after Prisma client regeneration
      }
    })
  } catch (error) {
    console.error('Error updating work center:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/work-centers/[id] - Delete work center
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if work center exists
    const existingWorkCenter = await prisma.workCenter.findUnique({
      where: { id: params.id }
    })

    if (!existingWorkCenter) {
      return NextResponse.json({ error: 'Work center not found' }, { status: 404 })
    }

    // Note: In a real application, you'd want to check if there are active work orders
    // assigned to this work center before allowing deletion
    // For now, we'll proceed with deletion (this will be enhanced after Prisma client update)

    await prisma.workCenter.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Work center deleted successfully' })
  } catch (error) {
    console.error('Error deleting work center:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}