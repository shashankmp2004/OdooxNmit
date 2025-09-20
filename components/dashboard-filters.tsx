"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar-fixed"
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
          <SelectTrigger className="w-full sm:w-40 bg-background border-input">
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

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Active Date Filter Indicator */}
          {(startDate || endDate) && (
            <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
              {startDate && endDate 
                ? `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`
                : startDate 
                ? `From ${format(startDate, "MMM dd")}`
                : `Until ${format(endDate!, "MMM dd")}`
              }
            </div>
          )}
          
          {/* Quick Date Range Options */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                setStartDate(lastWeek)
                setEndDate(today)
                onDateRangeChange?.(lastWeek, today)
              }}
              className="bg-background border-input text-xs"
            >
              7d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                setStartDate(lastMonth)
                setEndDate(today)
                onDateRangeChange?.(lastMonth, today)
              }}
              className="bg-background border-input text-xs"
            >
              30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(undefined)
                setEndDate(undefined)
                onDateRangeChange?.(undefined, undefined)
              }}
              className="bg-background border-input text-xs"
            >
              Clear
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-32 justify-start text-left font-normal bg-background border-input",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        setStartDate(date)
                        onDateRangeChange?.(date, endDate)
                      }
                    }}
                    disabled={(date: Date) => date > new Date() || (endDate ? date > endDate : false)}
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-32 justify-start text-left font-normal bg-background border-input",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        setEndDate(date)
                        onDateRangeChange?.(startDate, date)
                      }
                    }}
                    disabled={(date: Date) => date > new Date() || (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="bg-background border-input">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>
    </div>
  )
}
