"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  left: ReactNode
  right?: ReactNode
  className?: string
}

export function FilterBar({ left, right, className }: FilterBarProps) {
  return (
    <div className={cn(
      "w-full bg-card border border-border rounded-lg",
      "px-4 py-3 md:px-5 md:py-4",
      className
    )}>
      <div className="flex w-full items-center gap-3 md:gap-4">
        <div className="flex min-w-0 grow items-center gap-3 md:gap-4 flex-wrap">
          {left}
        </div>
        {right && (
          <div className="shrink-0 flex items-center gap-2">
            {right}
          </div>
        )}
      </div>
    </div>
  )
}
