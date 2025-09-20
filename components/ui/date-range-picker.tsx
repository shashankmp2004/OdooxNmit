"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar-fixed"

export interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  startLabel?: string
  endLabel?: string
  disableFuture?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  className,
  startLabel = "Start date",
  endLabel = "End date",
  disableFuture = true,
}: DateRangePickerProps) {
  const [openStart, setOpenStart] = useState(false)
  const [openEnd, setOpenEnd] = useState(false)

  const { from, to } = value

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={openStart} onOpenChange={setOpenStart}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-40 justify-start text-left font-normal bg-background border-input",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? format(from, "MMM dd, yyyy") : startLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={from}
              onSelect={(date: Date | undefined) => {
                onChange({ from: date, to })
                if (date) setOpenStart(false)
              }}
              disabled={(date: Date) => (disableFuture ? date > new Date() : false) || (to ? date > to : false)}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      <Popover open={openEnd} onOpenChange={setOpenEnd}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-40 justify-start text-left font-normal bg-background border-input",
              !to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {to ? format(to, "MMM dd, yyyy") : endLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={to}
              onSelect={(date: Date | undefined) => {
                onChange({ from, to: date })
                if (date) setOpenEnd(false)
              }}
              disabled={(date: Date) => (disableFuture ? date > new Date() : false) || (from ? date < from : false)}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
