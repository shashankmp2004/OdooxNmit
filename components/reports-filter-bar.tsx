"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterBar } from "@/components/filter-bar"
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker"
import { Download, Filter } from "lucide-react"

interface Option { id: string; name: string; sku?: string }

interface Props {
  products: Option[]
  workCenters: Option[]
  value: DateRange
  onChange: (range: DateRange) => void
  productValue: string
  onProductChange: (value: string) => void
  workCenterValue: string
  onWorkCenterChange: (value: string) => void
}

export function ReportsFilterBar({
  products,
  workCenters,
  value,
  onChange,
  productValue,
  onProductChange,
  workCenterValue,
  onWorkCenterChange,
}: Props) {
  const [range, setRange] = useState<DateRange>(value)

  const left = (
    <>
      <div className="hidden md:flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const to = new Date()
            const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
            const r = { from, to }
            setRange(r)
            onChange(r)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          Last 7 days
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const to = new Date()
            const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
            const r = { from, to }
            setRange(r)
            onChange(r)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          Last 30 days
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const to = new Date()
            const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000)
            const r = { from, to }
            setRange(r)
            onChange(r)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          Last 90 days
        </a>
      </div>

      <DateRangePicker
        value={range}
        onChange={(r) => {
          setRange(r)
          onChange(r)
        }}
      />

      <Select value={productValue} onValueChange={onProductChange}>
        <SelectTrigger className="bg-background border-input h-10 w-56">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}{p.sku ? ` (${p.sku})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={workCenterValue} onValueChange={onWorkCenterChange}>
        <SelectTrigger className="bg-background border-input h-10 w-56">
          <SelectValue placeholder="All Work Centers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Work Centers</SelectItem>
          {workCenters.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  const right = (
    <>
      <Button
        variant="default"
        className="h-10 bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98] transition-transform shadow-sm hover:shadow"
        onClick={async () => {
          try {
            const res = await fetch('/api/reports/template')
            if (!res.ok) throw new Error(`Download failed (${res.status})`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const disposition = res.headers.get('content-disposition') || ''
            const match = disposition.match(/filename=\"?([^\";]+)\"?/i)
            const filename = match?.[1] || 'manufacturing_reports_template.xlsx'
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
          } catch (e) {
            console.error(e)
          }
        }}
      >
        <Download className="mr-2 h-4 w-4" /> Excel
      </Button>
      <Button
        variant="default"
        className="h-10 bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98] transition-transform shadow-sm hover:shadow"
        onClick={async () => {
          try {
            const res = await fetch('/api/reports/sample-pdf')
            if (!res.ok) throw new Error(`Download failed (${res.status})`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const disposition = res.headers.get('content-disposition') || ''
            const match = disposition.match(/filename=\"?([^\";]+)\"?/i)
            const filename = match?.[1] || 'manufacturing_reports_sample.pdf'
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
          } catch (e) {
            console.error(e)
          }
        }}
      >
        <Download className="mr-2 h-4 w-4" /> PDF
      </Button>
    </>
  )

  return <FilterBar left={left} right={right} />
}
