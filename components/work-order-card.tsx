"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { Play, Pause, CheckCircle, AlertCircle, Clock, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkOrder {
  id: string
  taskName: string
  machineWorkCenter: string
  estimatedTime: number
  actualTime?: number
  status: "planned" | "in-progress" | "completed" | "cancelled" | "delayed"
  priority: "low" | "medium" | "high"
  assignedOperator: string
  progress: number
  startTime?: string
  notes?: string
}

interface WorkOrderCardProps {
  workOrder: WorkOrder
  onStatusChange?: (id: string, status: WorkOrder["status"]) => void
  onReportIssue?: (id: string) => void
}

export function WorkOrderCard({ workOrder, onStatusChange, onReportIssue }: WorkOrderCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: WorkOrder["status"]) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    onStatusChange?.(workOrder.id, newStatus)
    setIsLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Play className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "delayed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const canStart = workOrder.status === "planned"
  const canPause = workOrder.status === "in-progress"
  const canComplete = workOrder.status === "in-progress"
  const isCompleted = workOrder.status === "completed"

  return (
    <Card
      className={cn(
        "bg-card border-border transition-all duration-200 hover:shadow-lg",
        workOrder.priority === "high" && "border-l-4 border-l-red-500",
        workOrder.priority === "medium" && "border-l-4 border-l-yellow-500",
        workOrder.priority === "low" && "border-l-4 border-l-green-500",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">{workOrder.taskName}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{workOrder.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(workOrder.priority)}>
              {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Work Center & Machine */}
        <div className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{workOrder.machineWorkCenter}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={workOrder.status} />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {getStatusIcon(workOrder.status)}
            <span>{workOrder.actualTime ? `${workOrder.actualTime}h` : `Est. ${workOrder.estimatedTime}h`}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-medium">{workOrder.progress}%</span>
          </div>
          <Progress value={workOrder.progress} className="h-2" />
        </div>

        {/* Start Time */}
        {workOrder.startTime && (
          <div className="text-sm text-muted-foreground">Started: {new Date(workOrder.startTime).toLocaleString()}</div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {canStart && (
            <Button
              onClick={() => handleStatusChange("in-progress")}
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Work
            </Button>
          )}

          {canPause && (
            <Button
              onClick={() => handleStatusChange("planned")}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}

          {canComplete && (
            <Button
              onClick={() => handleStatusChange("completed")}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}

          {!isCompleted && (
            <Button
              onClick={() => onReportIssue?.(workOrder.id)}
              variant="outline"
              className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          )}
        </div>

        {/* Notes */}
        {workOrder.notes && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Notes:</strong> {workOrder.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
