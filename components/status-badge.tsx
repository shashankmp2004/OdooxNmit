import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "planned" | "in-progress" | "completed" | "cancelled" | "delayed"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    planned: {
      label: "Planned",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    completed: {
      label: "Completed",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    delayed: {
      label: "Delayed",
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
