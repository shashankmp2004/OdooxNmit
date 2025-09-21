"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FilterBar } from "@/components/filter-bar"
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker"
import { Download, Plus, Filter } from "lucide-react"

interface Props {
  onStatusChange?: (status: string) => void
  onSearchChange?: (search: string) => void
  onDateRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void
  onExportClick?: () => void
  onNewOrderClick?: () => void
  onMaterialsReadyChange?: (readyOnly: boolean) => void
}

export function DashboardFilterBar({ onStatusChange, onSearchChange, onDateRangeChange, onExportClick, onNewOrderClick, onMaterialsReadyChange }: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [range, setRange] = useState<DateRange>({})
  const [readyOnly, setReadyOnly] = useState(false)

  const left = (
    <>
      <Input
        placeholder="Search orders"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onSearchChange?.(e.target.value)
        }}
        className="bg-background border-input h-10 w-56"
      />

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v)
          // Normalize to backend enums where applicable
          const mapped = v === 'all'
            ? 'all'
            : v === 'planned'
              ? 'PLANNED'
              : v === 'in-progress'
                ? 'IN_PROGRESS'
                : v === 'completed'
                  ? 'DONE'
                  : v === 'cancelled'
                    ? 'CANCELED'
                    : v === 'delayed'
                      ? 'DELAYED'
                      : v
          onStatusChange?.(mapped)
        }}
      >
        <SelectTrigger className="bg-background border-input h-10 w-40">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="planned">Planned</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="delayed">Delayed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        value={range}
        onChange={(r) => {
          setRange(r)
          onDateRangeChange?.(r.from, r.to)
        }}
      />

      <div className="hidden md:flex items-center gap-2 pl-2">
        <label className="text-sm text-foreground/80 select-none cursor-pointer" htmlFor="ready-only">
          Ready only
        </label>
        <input
          id="ready-only"
          type="checkbox"
          className="h-4 w-4 accent-primary cursor-pointer"
          checked={readyOnly}
          onChange={(e) => {
            setReadyOnly(e.target.checked)
            onMaterialsReadyChange?.(e.target.checked)
          }}
        />
      </div>

      <div className="hidden md:flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const today = new Date()
            const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            const r = { from, to: today }
            setRange(r)
            onDateRangeChange?.(from, today)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          7d
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const today = new Date()
            const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            const r = { from, to: today }
            setRange(r)
            onDateRangeChange?.(from, today)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          30d
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            const r = { from: undefined, to: undefined }
            setRange(r)
            onDateRangeChange?.(undefined, undefined)
          }}
          className="text-sm text-foreground/80 hover:text-foreground transition-colors"
        >
          Clear
        </a>
      </div>
    </>
  )

  const right = (
    <>
      <Button
        variant="default"
        onClick={onExportClick}
        className="h-10 bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98] transition-transform shadow-sm hover:shadow"
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button
        onClick={onNewOrderClick}
        className="h-10 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>
    </>
  )

  return <FilterBar left={left} right={right} />
}
