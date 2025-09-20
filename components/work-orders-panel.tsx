"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, RefreshCw, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export default function WorkOrdersPanel() {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true)
        const response = await fetch('/api/work-orders')
        if (response.ok) {
          const data = await response.json()
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

  const filtered = (Array.isArray(workOrders) ? workOrders : []).filter((order: any) => {
    const matchesSearch =
      (order.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (order.mo?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (order.mo?.orderNo?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (order.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (order.assignedTo?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || (order.status?.toLowerCase() || "") === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  async function handleProgressUpdate(id: string, progress: number) {
    try {
      const response = await fetch(`/api/work-orders/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      })
      if (!response.ok) throw new Error('Failed to update progress')
      const updated = await response.json()
      setWorkOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)))
      toast({ title: 'Progress Updated', description: `Set to ${progress}%` })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update progress', variant: 'destructive' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No work orders found matching your criteria.</p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create First Work Order
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((workOrder: any) => (
            <div key={workOrder.id} className="bg-card border rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{workOrder.title || workOrder.mo?.name || 'Unnamed Work Order'}</h3>
                  <Badge>{workOrder.status || 'PENDING'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Order: {workOrder.mo?.orderNo || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Machine/Work Center: {workOrder.machineWorkCenter || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Estimated: {workOrder.estimatedTime || 0}h
                  {workOrder.actualTime && ` | Actual: ${workOrder.actualTime}h`}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progress:</span>
                    <span className="text-sm font-medium">{workOrder.progress || 0}%</span>
                  </div>
                  {(workOrder.status === "STARTED" || workOrder.status === "PAUSED") && (
                    <div className="space-y-2">
                      <Slider
                        value={[workOrder.progress || 0]}
                        onValueChange={(value) => handleProgressUpdate(workOrder.id, value[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Drag to update progress</p>
                    </div>
                  )}
                </div>
                {workOrder.assignedTo && (
                  <p className="text-sm text-muted-foreground">Assigned: {workOrder.assignedTo.name}</p>
                )}
                {workOrder.mo?.deadline && (
                  <p className="text-sm text-muted-foreground">
                    Deadline: {new Date(workOrder.mo.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
