import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

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

    // Format BOM data for export
    const exportData = {
      bom: {
        id: bom.id,
        version: bom.version,
        description: bom.description,
        isActive: bom.isActive,
        createdAt: bom.createdAt,
        updatedAt: bom.updatedAt
      },
      product: {
        name: bom.product.name,
        sku: bom.product.sku,
        category: bom.product.category
      },
      items: bom.items.map((item: any) => ({
        component: {
          name: item.component.name,
          sku: item.component.sku,
          category: item.component.category
        },
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes
      })),
      summary: {
        totalComponents: bom.items.length,
        exportedAt: new Date().toISOString(),
        exportedBy: session.user?.name || 'Unknown'
      }
    }

    // Return as downloadable JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bom_${bom.product.sku}_${bom.version}_${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting BOM:', error)
    return NextResponse.json({ error: 'Failed to export BOM' }, { status: 500 })
  }
}