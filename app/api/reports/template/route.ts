import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Create sample data for the Excel template
    const sampleData = [
      {
        'Date': '2024-01-15',
        'Work Center': 'Assembly Line 1',
        'Product': 'Product A',
        'Order ID': 'MO-001',
        'Status': 'COMPLETED',
        'Quantity': 100,
        'Completed Quantity': 100,
        'Lead Time (days)': 5,
        'Efficiency (%)': 95,
        'Defect Rate (%)': 2,
        'Cost ($)': 5000
      },
      {
        'Date': '2024-01-16',
        'Work Center': 'Assembly Line 2',
        'Product': 'Product B',
        'Order ID': 'MO-002',
        'Status': 'IN_PROGRESS',
        'Quantity': 150,
        'Completed Quantity': 75,
        'Lead Time (days)': 7,
        'Efficiency (%)': 88,
        'Defect Rate (%)': 1.5,
        'Cost ($)': 7500
      },
      {
        'Date': '2024-01-17',
        'Work Center': 'Quality Control',
        'Product': 'Product C',
        'Order ID': 'MO-003',
        'Status': 'PLANNED',
        'Quantity': 200,
        'Completed Quantity': 0,
        'Lead Time (days)': 3,
        'Efficiency (%)': 92,
        'Defect Rate (%)': 3,
        'Cost ($)': 10000
      }
    ]

    // Create a new workbook
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    
    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Work Center
      { wch: 15 }, // Product
      { wch: 12 }, // Order ID
      { wch: 15 }, // Status
      { wch: 10 }, // Quantity
      { wch: 18 }, // Completed Quantity
      { wch: 16 }, // Lead Time
      { wch: 15 }, // Efficiency
      { wch: 15 }, // Defect Rate
      { wch: 10 }  // Cost
    ]
    
    worksheet['!cols'] = columnWidths
    
    // Add instructions sheet
    const instructions = [
      ['Manufacturing Reports Data Import Template'],
      [''],
      ['Instructions:'],
      ['1. Fill in your data starting from row 2 (keep the headers in row 1)'],
      ['2. Date format: YYYY-MM-DD (e.g., 2024-01-15)'],
      ['3. Status options: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, DELAYED'],
      ['4. All numeric fields should contain numbers only'],
      ['5. Required fields: Date, Work Center, Product, Order ID, Status'],
      ['6. Save as .xlsx format'],
      [''],
      ['Field Descriptions:'],
      ['• Date: Production/order date'],
      ['• Work Center: Name of the work center or production line'],
      ['• Product: Product name or identifier'],
      ['• Order ID: Manufacturing order identifier'],
      ['• Status: Current status of the order'],
      ['• Quantity: Total quantity ordered'],
      ['• Completed Quantity: Quantity completed so far'],
      ['• Lead Time: Time taken in days'],
      ['• Efficiency: Production efficiency percentage'],
      ['• Defect Rate: Percentage of defective items'],
      ['• Cost: Total cost in dollars']
    ]
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionsSheet['!cols'] = [{ wch: 50 }]
    
  // Add sheets to workbook (Sample Data FIRST to match uploader logic)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Data')
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Set response headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="manufacturing_reports_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
    
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ 
      error: 'Failed to generate template file' 
    }, { status: 500 })
  }
}