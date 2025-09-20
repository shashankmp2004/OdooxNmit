import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

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

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
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

    if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      // Process Excel file
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
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
      
      const headers = jsonData[0] as string[]
      const missingHeaders = expectedHeaders.filter(header => 
        !headers.some(h => h?.toLowerCase().includes(header.toLowerCase().split('(')[0].trim()))
      )
      
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
          return {
            date: row[0] ? new Date(row[0]).toISOString().split('T')[0] : '',
            workCenter: String(row[1] || ''),
            product: String(row[2] || ''),
            orderId: String(row[3] || ''),
            status: String(row[4] || ''),
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

    // Return processed data for now
    // In a real implementation, you would save this to your database
    return NextResponse.json({
      message: `Successfully processed ${parsedData.length} records`,
      filename: file.name,
      recordCount: parsedData.length,
      data: parsedData.slice(0, 5), // Return first 5 records as preview
      totalRecords: parsedData.length
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    }, { status: 500 })
  }
}