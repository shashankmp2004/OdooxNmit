"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Plus, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DashboardFiltersProps {
  onStatusChange?: (status: string) => void
  onSearchChange?: (search: string) => void
  onDateRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DashboardFilters({ onStatusChange, onSearchChange, onDateRangeChange }: DashboardFiltersProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    onDateRangeChange?.(date, endDate)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    onDateRangeChange?.(startDate, date)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border border-border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-background border-input"
          />
        </div>

        {/* Status Filter */}
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-40 bg-background border-input cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800 transition-colors duration-200">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
            <SelectItem value="planned" className="cursor-pointer">Planned</SelectItem>
            <SelectItem value="in-progress" className="cursor-pointer">In Progress</SelectItem>
            <SelectItem value="completed" className="cursor-pointer">Completed</SelectItem>
            <SelectItem value="delayed" className="cursor-pointer">Delayed</SelectItem>
            <SelectItem value="cancelled" className="cursor-pointer">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal bg-background border-input cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800 transition-colors duration-200",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM dd") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={handleStartDateChange} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal bg-background border-input cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800 transition-colors duration-200",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM dd") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={handleEndDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="bg-background border-input cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800 transition-colors duration-200">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>
    </div>
  )
}
