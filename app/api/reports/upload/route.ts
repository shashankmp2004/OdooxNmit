import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// Ensure Node.js runtime for reliable file parsing and XLSX
export const runtime = 'nodejs'

interface ExcelReportData {
  date: string
  workCenter: string
  product: string
  orderId: string
  status: string
  quantity: number
  completedQuantity: number
  leadTime: number
  efficiency: number
  defectRate: number
  cost: number
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type by MIME or fallback to extension
    const allowedTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf'
    ])
    const isAllowedByMime = allowedTypes.has(file.type)
    const lowerName = file.name.toLowerCase()
    const isAllowedByExt = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.pdf')
    if (!isAllowedByMime && !isAllowedByExt) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only Excel (.xlsx, .xls) and PDF files are allowed.' 
      }, { status: 400 })
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

  let parsedData: ExcelReportData[] = []

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || file.type.includes('excel') || file.type.includes('spreadsheet')) {
      // Process Excel file
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
  // Use formatted values to better handle dates stored as strings
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
      
      // Validate headers
      const expectedHeaders = [
        'Date', 'Work Center', 'Product', 'Order ID', 'Status', 
        'Quantity', 'Completed Quantity', 'Lead Time (days)', 
        'Efficiency (%)', 'Defect Rate (%)', 'Cost ($)'
      ]
      
      if (jsonData.length === 0) {
        return NextResponse.json({ 
          error: 'Excel file is empty' 
        }, { status: 400 })
      }
      
      const headers = (jsonData[0] as string[]).map(h => String(h || '').trim())
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/\(.*?\)/g, '').trim()
      const missingHeaders = expectedHeaders.filter(header => {
        const normExpected = normalize(header)
        return !headers.some(h => normalize(h) === normExpected)
      })
      
      if (missingHeaders.length > 0) {
        return NextResponse.json({ 
          error: `Missing required columns: ${missingHeaders.join(', ')}. Please use the sample template.`,
          expectedHeaders
        }, { status: 400 })
      }
      
      // Process data rows
      const dataRows = jsonData.slice(1) as any[][]
      
      parsedData = dataRows.map((row, index) => {
        try {
          const toISODate = (val: any) => {
            if (!val) return ''
            // If Excel date serial-like
            if (typeof val === 'number') {
              const d = XLSX.SSF.parse_date_code(val)
              if (d) {
                const jsDate = new Date(Date.UTC(d.y, (d.m || 1) - 1, d.d || 1))
                return jsDate.toISOString().split('T')[0]
              }
            }
            // If string date
            const d2 = new Date(val)
            if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0]
            return ''
          }
          return {
            date: toISODate(row[0]),
            workCenter: String((row[1] || '')).trim(),
            product: String((row[2] || '')).trim(),
            orderId: String((row[3] || '')).trim(),
            status: String((row[4] || '')).trim(),
            quantity: Number(row[5]) || 0,
            completedQuantity: Number(row[6]) || 0,
            leadTime: Number(row[7]) || 0,
            efficiency: Number(row[8]) || 0,
            defectRate: Number(row[9]) || 0,
            cost: Number(row[10]) || 0
          }
        } catch (error) {
          throw new Error(`Error processing row ${index + 2}: Invalid data format`)
        }
      }).filter(row => row.date && row.workCenter && row.product)
      
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'll just acknowledge receipt for now
      // In a real implementation, you would use pdf-parse or similar
      return NextResponse.json({ 
        message: 'PDF file received. PDF parsing is not fully implemented yet.',
        filename: file.name,
        size: file.size
      })
    }

    // Validate parsed data
    if (parsedData.length === 0) {
      return NextResponse.json({ 
        error: 'No valid data found in the file' 
      }, { status: 400 })
    }

    // Persist to DB: map rows to Product, WorkCenter, ManufacturingOrder, WorkOrder
    let createdProducts = 0
    let createdWorkCenters = 0
    let createdMOs = 0
    let updatedMOs = 0
    let createdWOs = 0
    let updatedWOs = 0

    const normalizeStr = (s: string) => s.trim().toLowerCase()

    const mapOrderState = (s: string): 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' => {
      const v = normalizeStr(s)
      if (['done', 'completed', 'complete'].includes(v)) return 'DONE'
      if (['in progress', 'started', 'start', 'running', 'active'].includes(v)) return 'IN_PROGRESS'
      if (['canceled', 'cancelled', 'void'].includes(v)) return 'CANCELED'
      return 'PLANNED'
    }
    const mapWorkStatus = (s: string): 'PENDING' | 'STARTED' | 'PAUSED' | 'COMPLETED' => {
      const v = normalizeStr(s)
      if (['done', 'completed', 'complete'].includes(v)) return 'COMPLETED'
      if (['paused', 'hold'].includes(v)) return 'PAUSED'
      if (['in progress', 'started', 'start', 'running', 'active'].includes(v)) return 'STARTED'
      return 'PENDING'
    }

    // Helper to add days
    const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000)

    for (const row of parsedData) {
      // Resolve or create Product
      const productName = row.product.trim() || 'Unnamed Product'
      let product = await prisma.product.findFirst({
        where: { name: { equals: productName, mode: 'insensitive' } },
        select: { id: true }
      })
      if (!product) {
        const created = await prisma.product.create({
          data: { name: productName, description: null, isFinished: true }
        })
        product = { id: created.id }
        createdProducts++
      }

      // Resolve or create WorkCenter
      const wcName = row.workCenter.trim() || 'General'
      let wc = await prisma.workCenter.findFirst({
        where: { name: { equals: wcName, mode: 'insensitive' } },
        select: { id: true }
      })
      if (!wc) {
        const created = await prisma.workCenter.create({ data: { name: wcName } })
        wc = { id: created.id }
        createdWorkCenters++
      }

      const orderNo = row.orderId?.trim() || `IMP-${product.id}-${Date.now()}`
      const baseDate = row.date ? new Date(row.date) : new Date()
      const deadline = row.leadTime ? addDays(baseDate, Number(row.leadTime)) : null
      const moState = mapOrderState(row.status)
      const woStatus = mapWorkStatus(row.status)
      const qty = Number(row.quantity) > 0 ? Math.round(Number(row.quantity)) : 1
      const completedQty = Number(row.completedQuantity) || 0
      const progress = qty > 0 ? Math.max(0, Math.min(100, Math.round((completedQty / qty) * 100))) : 0

      // Upsert Manufacturing Order (unique by orderNo)
      const mo = await prisma.manufacturingOrder.upsert({
        where: { orderNo },
        create: {
          orderNo,
          name: `MO ${orderNo} - ${productName}`,
          productId: product.id,
          quantity: qty,
          state: moState as any,
          deadline: deadline ?? undefined,
          createdAt: baseDate,
          completedAt: moState === 'DONE' ? baseDate : undefined,
        },
        update: {
          productId: product.id,
          name: `MO ${orderNo} - ${productName}`,
          quantity: qty,
          state: moState as any,
          deadline: deadline ?? undefined,
          completedAt: moState === 'DONE' ? baseDate : undefined,
        },
        select: { id: true }
      })
      if (moState === 'PLANNED') updatedMOs++ // conservative count
      else if (moState === 'DONE' || moState === 'IN_PROGRESS' || moState === 'CANCELED') updatedMOs++
      else createdMOs++

      // Find existing WO for this MO and WorkCenter (if any)
      const existingWO = await prisma.workOrder.findFirst({
        where: { moId: mo.id, workCenterId: wc.id },
        select: { id: true }
      })

      const estimatedHours = Number(row.leadTime) > 0 ? Number(row.leadTime) * 24 : null
      const efficiency = Number(row.efficiency) || null
      const actualHours = estimatedHours && efficiency && efficiency > 0 ? estimatedHours * (100 / efficiency) : null

      if (existingWO) {
        await prisma.workOrder.update({
          where: { id: existingWO.id },
          data: {
            title: `WO for ${productName} @ ${wcName}`,
            workCenterId: wc.id,
            status: woStatus as any,
            progress: woStatus === 'COMPLETED' ? 100 : progress,
            estimatedTime: estimatedHours ?? undefined,
            actualTime: actualHours ?? undefined,
            startTime: baseDate,
            endTime: woStatus === 'COMPLETED' ? baseDate : null,
          }
        })
        updatedWOs++
      } else {
        await prisma.workOrder.create({
          data: {
            moId: mo.id,
            title: `WO for ${productName} @ ${wcName}`,
            workCenterId: wc.id,
            status: woStatus as any,
            priority: 'MEDIUM',
            progress: woStatus === 'COMPLETED' ? 100 : progress,
            estimatedTime: estimatedHours ?? undefined,
            actualTime: actualHours ?? undefined,
            startTime: baseDate,
            endTime: woStatus === 'COMPLETED' ? baseDate : null,
          }
        })
        createdWOs++
      }
    }

    return NextResponse.json({
      message: `Imported ${parsedData.length} records. Products: +${createdProducts}, WorkCenters: +${createdWorkCenters}, MOs: ${createdMOs} created/${updatedMOs} updated, WOs: ${createdWOs} created/${updatedWOs} updated`,
      filename: file.name,
      recordCount: parsedData.length,
      preview: parsedData.slice(0, 5)
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    }, { status: 500 })
  }
}