import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boms = await prisma.bOM.findMany({
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
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(boms)
  } catch (error) {
    console.error('Error fetching BOMs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, version, description, isActive, items } = await request.json()

    // Validate required fields
    if (!productId || !version) {
      return NextResponse.json({ error: 'Product and version are required' }, { status: 400 })
    }

    // Check if BOM version already exists for this product
    const existingBOM = await prisma.bOM.findFirst({
      where: {
        productId,
        version
      }
    })

    if (existingBOM) {
      return NextResponse.json({ error: 'BOM version already exists for this product' }, { status: 400 })
    }

    // Create BOM with items
    const bom = await prisma.bOM.create({
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

    return NextResponse.json(bom, { status: 201 })
  } catch (error) {
    console.error('Error creating BOM:', error)
    return NextResponse.json({ error: 'Failed to create BOM' }, { status: 500 })
  }
}