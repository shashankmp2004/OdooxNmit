import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use pdfkit for a valid PDF
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require('pdfkit')
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    doc.fontSize(18).text('Manufacturing Reports Sample', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text('This is a sample PDF report.', { align: 'left' })
    doc.text(`Generated: ${new Date().toLocaleString()}`)
    doc.moveDown()
    doc.text('Report contains manufacturing data including:')
    const items = [
      'Work Order Status',
      'Production Efficiency',
      'Quality Metrics',
      'Cost Analysis',
    ]
    items.forEach(i => doc.text(`• ${i}`))
    doc.end()

    await new Promise(resolve => doc.on('end', resolve))
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="manufacturing_reports_sample.pdf"',
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Error generating sample PDF:', error)
    return NextResponse.json({ error: 'Failed to generate sample PDF file' }, { status: 500 })
  }
}