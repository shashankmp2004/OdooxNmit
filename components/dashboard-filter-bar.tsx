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
}

export function DashboardFilterBar({ onStatusChange, onSearchChange, onDateRangeChange }: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [range, setRange] = useState<DateRange>({})

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
          onStatusChange?.(v)
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

      <div className="hidden md:flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-9 bg-background border-input"
          onClick={() => {
            const today = new Date()
            const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            const r = { from, to: today }
            setRange(r)
            onDateRangeChange?.(from, today)
          }}
        >
          7d
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 bg-background border-input"
          onClick={() => {
            const today = new Date()
            const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            const r = { from, to: today }
            setRange(r)
            onDateRangeChange?.(from, today)
          }}
        >
          30d
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 bg-background border-input"
          onClick={() => {
            const r = { from: undefined, to: undefined }
            setRange(r)
            onDateRangeChange?.(undefined, undefined)
          }}
        >
          Clear
        </Button>
      </div>
    </>
  )

  const right = (
    <>
      <Button variant="outline" className="h-10 bg-background border-input">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button className="h-10 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>
    </>
  )

  return <FilterBar left={left} right={right} />
}
