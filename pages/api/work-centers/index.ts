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

    switch (req.method) {
      case 'GET':
        return await getWorkCenters(req, res)
      case 'POST':
        return await createWorkCenter(req, res, session)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Work centers API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getWorkCenters(req: NextApiRequest, res: NextApiResponse) {
  try {
    const workCenters = await prisma.workCenter.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    // Get work order counts for each work center
    const workCentersWithStats = await Promise.all(
      workCenters.map(async (center) => {
        const activeWorkOrders = await prisma.workOrder.count({
          where: {
            workCenterId: center.id,
            status: 'STARTED'
          }
        })

        const pendingWorkOrders = await prisma.workOrder.count({
          where: {
            workCenterId: center.id,
            status: 'PENDING'
          }
        })

        const utilization = center.capacity ? 
          Math.min(100, (activeWorkOrders / center.capacity) * 100) : 0

        return {
          ...center,
          activeWorkOrders,
          pendingWorkOrders,
          utilization: Math.round(utilization),
          isOverloaded: center.capacity ? activeWorkOrders > center.capacity : false
        }
      })
    )

    return res.status(200).json(workCentersWithStats)
  } catch (error) {
    console.error('Error fetching work centers:', error)
    return res.status(500).json({ error: 'Failed to fetch work centers' })
  }
}

async function createWorkCenter(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Check if user has permission to create work centers
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { name, description, capacity, costPerHour, status } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Work center name is required' })
    }

    const workCenter = await prisma.workCenter.create({
      data: {
        name,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        costPerHour: costPerHour ? parseFloat(costPerHour) : null,
        status: status || 'AVAILABLE'
      }
    })

    return res.status(201).json(workCenter)
  } catch (error: any) {
    console.error('Error creating work center:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Work center name must be unique' })
    }
    return res.status(500).json({ error: 'Failed to create work center' })
  }
}