import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid work center ID' })
    }

    switch (req.method) {
      case 'GET':
        return await getWorkCenter(req, res, id)
      case 'PUT':
        return await updateWorkCenter(req, res, id, session)
      case 'DELETE':
        return await deleteWorkCenter(req, res, id, session)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Work center API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getWorkCenter(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const workCenter = await prisma.workCenter.findUnique({
      where: { id }
    })

    if (!workCenter) {
      return res.status(404).json({ error: 'Work center not found' })
    }

    // Get associated work orders
    const workOrders = await prisma.workOrder.findMany({
      where: { workCenterId: id },
      include: {
        mo: {
          include: {
            product: true
          }
        },
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const activeWorkOrders = workOrders.filter(wo => wo.status === 'STARTED')
    const pendingWorkOrders = workOrders.filter(wo => wo.status === 'PENDING')
    
    const utilization = workCenter.capacity ? 
      Math.min(100, (activeWorkOrders.length / workCenter.capacity) * 100) : 0

    return res.status(200).json({
      ...workCenter,
      workOrders,
      activeWorkOrders: activeWorkOrders.length,
      pendingWorkOrders: pendingWorkOrders.length,
      utilization: Math.round(utilization),
      isOverloaded: workCenter.capacity ? activeWorkOrders.length > workCenter.capacity : false
    })
  } catch (error) {
    console.error('Error fetching work center:', error)
    return res.status(500).json({ error: 'Failed to fetch work center' })
  }
}

async function updateWorkCenter(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Check if user has permission to update work centers
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { name, description, capacity, costPerHour, status } = req.body

    const workCenter = await prisma.workCenter.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
        ...(costPerHour !== undefined && { costPerHour: costPerHour ? parseFloat(costPerHour) : null }),
        ...(status && { status })
      }
    })

    return res.status(200).json(workCenter)
  } catch (error: any) {
    console.error('Error updating work center:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work center not found' })
    }
    return res.status(500).json({ error: 'Failed to update work center' })
  }
}

async function deleteWorkCenter(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Check if user has permission to delete work centers
    if (!['ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Check if work center has active work orders
    const activeWorkOrders = await prisma.workOrder.count({
      where: {
        workCenterId: id,
        status: {
          in: ['PENDING', 'STARTED']
        }
      }
    })

    if (activeWorkOrders > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete work center with active work orders' 
      })
    }

    await prisma.workCenter.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'Work center deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting work center:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work center not found' })
    }
    return res.status(500).json({ error: 'Failed to delete work center' })
  }
}