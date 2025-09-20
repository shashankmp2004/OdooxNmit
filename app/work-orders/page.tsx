"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { WorkOrderCard } from "@/components/work-order-card"
import { IssueReportDialog } from "@/components/issue-report-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, RefreshCw, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkOrder {
  id: string
  orderNo: string
  name: string
  workCenter: {
    id: string
    name: string
  }
  estimatedHours: number
  actualHours: number | null
  state: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED"
  assignedUser: {
    id: string
    name: string
  } | null
  deadline: string | null
  createdAt: string
  updatedAt: string
  manufacturingOrder: {
    id: string
    orderNo: string
    name: string
  }
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("")
  const { toast } = useToast()
  const { data: session } = useAuth()
  const user = session?.user

  // Fetch work orders from API
  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true)
        const response = await fetch('/api/work-orders')
        
        if (response.ok) {
          const data = await response.json()
          // Handle paginated response structure
          const workOrdersArray = data.workOrders || data || []
          setWorkOrders(Array.isArray(workOrdersArray) ? workOrdersArray : [])
        } else {
          setError('Failed to fetch work orders')
        }
      } catch (err) {
        setError('Error loading work orders')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkOrders()
  }, [])

  const filteredWorkOrders = (Array.isArray(workOrders) ? workOrders : []).filter((order) => {
    const matchesSearch =
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.workCenter.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.state.toLowerCase() === statusFilter.toLowerCase()
    // Note: The API doesn't have priority field, so we'll ignore priority filter for now
    // const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (id: string, newStatus: string) => {
    // Update work order status via API
    fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: newStatus.toUpperCase() }),
    })
    .then(() => {
      // Refresh the work orders list
      setWorkOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? { ...order, state: newStatus.toUpperCase() as WorkOrder["state"] }
            : order,
        ),
      )

      toast({
        title: "Status Updated",
        description: `Work order ${id} status changed to ${newStatus}`,
      })
    })
    .catch((error) => {
      console.error('Error updating work order:', error)
      toast({
        title: "Error",
        description: "Failed to update work order status",
        variant: "destructive",
      })
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
    const safeWorkOrders = Array.isArray(workOrders) ? workOrders : []
    return {
      pending: safeWorkOrders.filter((o) => o.state === "PENDING").length,
      inProgress: safeWorkOrders.filter((o) => o.state === "IN_PROGRESS").length,
      completed: safeWorkOrders.filter((o) => o.state === "COMPLETED").length,
      blocked: safeWorkOrders.filter((o) => o.state === "BLOCKED").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <ProtectedRoute allowedRoles={["OPERATOR", "MANAGER", "ADMIN"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Work Orders" userName={`${user?.name} (${user?.role})`} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-foreground">{statusCounts.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
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
                  <div className="text-2xl font-bold text-orange-400">{statusCounts.blocked}</div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
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

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading work orders...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : filteredWorkOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No work orders found matching your criteria.</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Work Order
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredWorkOrders.map((workOrder) => (
                    <div key={workOrder.id} className="bg-card border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{workOrder.name}</h3>
                          <Badge>{workOrder.state}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Order: {workOrder.orderNo}</p>
                        <p className="text-sm text-muted-foreground">Work Center: {workOrder.workCenter.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated: {workOrder.estimatedHours}h
                          {workOrder.actualHours && ` | Actual: ${workOrder.actualHours}h`}
                        </p>
                        {workOrder.assignedUser && (
                          <p className="text-sm text-muted-foreground">Assigned: {workOrder.assignedUser.name}</p>
                        )}
                        {workOrder.deadline && (
                          <p className="text-sm text-muted-foreground">
                            Deadline: {new Date(workOrder.deadline).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusChange(workOrder.id, "IN_PROGRESS")}
                            disabled={workOrder.state === "IN_PROGRESS"}
                          >
                            Start
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(workOrder.id, "COMPLETED")}
                            disabled={workOrder.state === "COMPLETED"}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Old implementation commented out until WorkOrderCard is updated
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
              */}
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
