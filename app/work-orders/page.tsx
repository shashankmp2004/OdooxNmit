"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { WorkOrderCard } from "@/components/work-order-card"
import { IssueReportDialog } from "@/components/issue-report-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

const mockWorkOrders: WorkOrder[] = [
  {
    id: "WO-2024-101",
    taskName: "Steel Frame Welding",
    machineWorkCenter: "Welding Station A",
    estimatedTime: 4,
    actualTime: 2.5,
    status: "in-progress",
    priority: "high",
    assignedOperator: "John Smith",
    progress: 65,
    startTime: "2024-01-20T08:00:00Z",
    notes: "Use 316L stainless steel rods",
  },
  {
    id: "WO-2024-102",
    taskName: "Hydraulic Assembly",
    machineWorkCenter: "Assembly Line B",
    estimatedTime: 6,
    status: "planned",
    priority: "medium",
    assignedOperator: "John Smith",
    progress: 0,
  },
  {
    id: "WO-2024-103",
    taskName: "Quality Inspection",
    machineWorkCenter: "QC Station 1",
    estimatedTime: 2,
    actualTime: 2,
    status: "completed",
    priority: "low",
    assignedOperator: "John Smith",
    progress: 100,
    startTime: "2024-01-19T14:00:00Z",
  },
  {
    id: "WO-2024-104",
    taskName: "Motor Housing Machining",
    machineWorkCenter: "CNC Machine 3",
    estimatedTime: 8,
    actualTime: 5,
    status: "delayed",
    priority: "high",
    assignedOperator: "John Smith",
    progress: 45,
    startTime: "2024-01-20T06:00:00Z",
    notes: "Tool wear detected, replacement needed",
  },
  {
    id: "WO-2024-105",
    taskName: "Control Panel Wiring",
    machineWorkCenter: "Electrical Station",
    estimatedTime: 3,
    status: "planned",
    priority: "medium",
    assignedOperator: "John Smith",
    progress: 0,
  },
]

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  const filteredWorkOrders = workOrders.filter((order) => {
    const matchesSearch =
      order.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.machineWorkCenter.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleStatusChange = (id: string, newStatus: WorkOrder["status"]) => {
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status: newStatus,
              startTime: newStatus === "in-progress" && !order.startTime ? new Date().toISOString() : order.startTime,
              progress: newStatus === "completed" ? 100 : order.progress,
            }
          : order,
      ),
    )

    toast({
      title: "Status Updated",
      description: `Work order ${id} status changed to ${newStatus}`,
    })
  }

  const handleReportIssue = (id: string) => {
    setSelectedWorkOrderId(id)
    setIssueDialogOpen(true)
  }

  const handleIssueSubmit = (data: { type: string; description: string; severity: string }) => {
    if (data.severity === "high" || data.severity === "critical") {
      setWorkOrders((prev) =>
        prev.map((order) => (order.id === selectedWorkOrderId ? { ...order, status: "delayed" as const } : order)),
      )
    }

    toast({
      title: "Issue Reported",
      description: `Issue reported for work order ${selectedWorkOrderId}`,
    })
  }

  const getStatusCounts = () => {
    return {
      planned: workOrders.filter((o) => o.status === "planned").length,
      inProgress: workOrders.filter((o) => o.status === "in-progress").length,
      completed: workOrders.filter((o) => o.status === "completed").length,
      delayed: workOrders.filter((o) => o.status === "delayed").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <ProtectedRoute allowedRoles={["Operator", "Manager", "Admin"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Work Orders" userName={`${user?.name} (${user?.role})`} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-foreground">{statusCounts.planned}</div>
                  <div className="text-sm text-muted-foreground">Planned</div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-blue-400">{statusCounts.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-green-400">{statusCounts.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-orange-400">{statusCounts.delayed}</div>
                  <div className="text-sm text-muted-foreground">Delayed</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search work orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-input"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-background border-input">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-background border-input">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="bg-background border-input">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWorkOrders.map((workOrder) => (
                  <WorkOrderCard
                    key={workOrder.id}
                    workOrder={workOrder}
                    onStatusChange={handleStatusChange}
                    onReportIssue={handleReportIssue}
                  />
                ))}
              </div>

              {filteredWorkOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No work orders found matching your criteria.</p>
                </div>
              )}
            </div>
          </main>
        </div>

        <IssueReportDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          workOrderId={selectedWorkOrderId}
          onSubmit={handleIssueSubmit}
        />
      </div>
    </ProtectedRoute>
  )
}
