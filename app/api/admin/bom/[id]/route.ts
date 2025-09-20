import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, version, description, isActive, items } = await request.json()
    const bomId = params.id

    // Validate required fields
    if (!productId || !version) {
      return NextResponse.json({ error: 'Product and version are required' }, { status: 400 })
    }

    // Check if BOM exists
    const existingBOM = await prisma.bOM.findUnique({
      where: { id: bomId }
    })

    if (!existingBOM) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Check if another BOM with same product and version exists (excluding current)
    const duplicateBOM = await prisma.bOM.findFirst({
      where: {
        productId,
        version,
        id: { not: bomId }
      }
    })

    if (duplicateBOM) {
      return NextResponse.json({ error: 'BOM version already exists for this product' }, { status: 400 })
    }

    // Update BOM by first deleting existing items, then creating new ones
    await prisma.bOMItem.deleteMany({
      where: { bomId }
    })

    const updatedBOM = await prisma.bOM.update({
      where: { id: bomId },
      data: {
        productId,
        version,
        description,
        isActive: isActive !== undefined ? isActive : true,
        items: {
          create: items.map((item: any) => ({
            componentId: item.componentId,
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'pcs',
            notes: item.notes
          }))
        }
      },
      include: {
        product: true,
        items: {
          include: {
            component: true
          }
        }
      }
    })

    return NextResponse.json(updatedBOM)
  } catch (error) {
    console.error('Error updating BOM:', error)
    return NextResponse.json({ error: 'Failed to update BOM' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bomId = params.id

    // Check if BOM exists
    const existingBOM = await prisma.bOM.findUnique({
      where: { id: bomId }
    })

    if (!existingBOM) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Delete BOM (items will be deleted automatically due to cascade)
    await prisma.bOM.delete({
      where: { id: bomId }
    })

    return NextResponse.json({ message: 'BOM deleted successfully' })
  } catch (error) {
    console.error('Error deleting BOM:', error)
    return NextResponse.json({ error: 'Failed to delete BOM' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bomId = params.id

    const bom = await prisma.bOM.findUnique({
      where: { id: bomId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            price: true,
            stock: true
          }
        },
        items: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                price: true,
                stock: true
              }
            }
          }
        }
      }
    })

    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    return NextResponse.json(bom)
  } catch (error) {
    console.error('Error fetching BOM:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}