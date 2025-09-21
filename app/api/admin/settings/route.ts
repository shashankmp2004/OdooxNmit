import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// Force dynamic execution on Node.js runtime; disable caching
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Mock settings storage - in a real app, this would be in a database
let systemSettings = {
  general: {
    companyName: 'ManufactureOS',
    companyAddress: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en'
  },
  manufacturing: {
    defaultWorkOrderPriority: 'MEDIUM',
    autoCreateWorkOrders: true,
    stockConsumptionMethod: 'FIFO',
    qualityControlRequired: false,
    defaultLeadTime: 7
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    lowStockAlerts: true,
    overdueOrderAlerts: true,
    systemMaintenanceAlerts: true
  },
  security: {
    sessionTimeout: 480,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowMultipleSessions: true,
    auditLogging: true
  },
  system: {
    backupFrequency: 'daily',
    dataRetentionDays: 365,
    maintenanceMode: false,
    debugMode: false,
    performanceLogging: false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(systemSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newSettings = await request.json()
    
    // Validate and update settings
    systemSettings = { ...systemSettings, ...newSettings }

    // In a real application, save to database here
    console.log('Settings updated:', systemSettings)

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}