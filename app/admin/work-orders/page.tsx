"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit, Plus, Search, Play, Pause, CheckCircle, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WorkOrder {
  id: string
  title: string
  taskName?: string
  description?: string
  status: string
  priority: string
  progress: number
  estimatedTime?: number
  actualTime?: number
  startTime?: string
  endTime?: string
  assignedTo?: {
    name: string
  }
  mo: {
    orderNo: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface ManufacturingOrder {
  id: string
  orderNo: string
  name: string
}

interface User {
  id: string
  name: string
}

const statuses = ['PENDING', 'STARTED', 'PAUSED', 'COMPLETED', 'CANCELLED']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    taskName: '',
    description: '',
    moId: '',
    assignedToId: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    estimatedTime: ''
  })

  useEffect(() => {
    fetchWorkOrders()
    fetchManufacturingOrders()
    fetchUsers()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/admin/work-orders')
      if (response.ok) {
        const data = await response.json()
        setWorkOrders(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch work orders",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching work orders:', error)
      toast({
        title: "Error",
        description: "Failed to fetch work orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchManufacturingOrders = async () => {
    try {
      const response = await fetch('/api/admin/manufacturing-orders')
      if (response.ok) {
        const data = await response.json()
        setManufacturingOrders(data)
      }
    } catch (error) {
      console.error('Error fetching manufacturing orders:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: any) => user.role === 'OPERATOR' || user.role === 'MANAGER'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateWorkOrder = async () => {
    try {
      const response = await fetch('/api/admin/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseFloat(formData.estimatedTime) : null,
          assignedToId: formData.assignedToId || null
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order created successfully"
        })
        setIsCreateDialogOpen(false)
        setFormData({
          title: '',
          taskName: '',
          description: '',
          moId: '',
          assignedToId: '',
          status: 'PENDING',
          priority: 'MEDIUM',
          estimatedTime: ''
        })
        fetchWorkOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create work order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating work order:', error)
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive"
      })
    }
  }

  const handleUpdateWorkOrder = async () => {
    if (!editingWorkOrder) return

    try {
      const response = await fetch(`/api/admin/work-orders/${editingWorkOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseFloat(formData.estimatedTime) : null,
          assignedToId: formData.assignedToId || null
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order updated successfully"
        })
        setIsEditDialogOpen(false)
        setEditingWorkOrder(null)
        setFormData({
          title: '',
          taskName: '',
          description: '',
          moId: '',
          assignedToId: '',
          status: 'PENDING',
          priority: 'MEDIUM',
          estimatedTime: ''
        })
        fetchWorkOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update work order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating work order:', error)
      toast({
        title: "Error",
        description: "Failed to update work order",
        variant: "destructive"
      })
    }
  }

  const handleDeleteWorkOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work order?')) return

    try {
      const response = await fetch(`/api/admin/work-orders/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order deleted successfully"
        })
        fetchWorkOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete work order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting work order:', error)
      toast({
        title: "Error",
        description: "Failed to delete work order",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder)
    setFormData({
      title: workOrder.title,
      taskName: workOrder.taskName || '',
      description: workOrder.description || '',
      moId: workOrder.mo.orderNo, // Note: using orderNo as identifier
      assignedToId: workOrder.assignedTo?.name || '', // Note: this might need adjustment
      status: workOrder.status,
      priority: workOrder.priority,
      estimatedTime: workOrder.estimatedTime?.toString() || ''
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'STARTED': return 'bg-blue-500'
      case 'PAUSED': return 'bg-orange-500'
      case 'COMPLETED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-500'
      case 'MEDIUM': return 'bg-blue-500'
      case 'HIGH': return 'bg-orange-500'
      case 'URGENT': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'STARTED': return <Play className="w-4 h-4" />
      case 'PAUSED': return <Pause className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const filteredWorkOrders = workOrders.filter(workOrder => {
    const matchesSearch = workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workOrder.mo.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workOrder.mo.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || workOrder.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || workOrder.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Orders Management</h1>
          <p className="text-gray-600">Manage work orders and task assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Create a new work order for production tasks
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter work order title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  placeholder="Enter specific task name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter work order description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="moId">Manufacturing Order *</Label>
                  <Select value={formData.moId} onValueChange={(value) => setFormData({ ...formData, moId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturing order" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturingOrders.map((mo) => (
                        <SelectItem key={mo.id} value={mo.id}>
                          {mo.orderNo} - {mo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedToId">Assigned To</Label>
                  <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedTime">Est. Time (hrs)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    step="0.5"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkOrder}>Create Work Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders ({filteredWorkOrders.length})</CardTitle>
          <CardDescription>
            Manage work orders and track production progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>MO</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{workOrder.title}</div>
                      {workOrder.taskName && (
                        <div className="text-sm text-gray-500">{workOrder.taskName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{workOrder.mo.orderNo}</div>
                      <div className="text-sm text-gray-500">{workOrder.mo.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{workOrder.assignedTo?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Badge className={`text-white ${getStatusBadgeColor(workOrder.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(workOrder.status)}
                      {workOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-white ${getPriorityBadgeColor(workOrder.priority)}`}>
                      {workOrder.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${workOrder.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{workOrder.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {workOrder.estimatedTime ? `${workOrder.estimatedTime}h` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(workOrder)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkOrder(workOrder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Work Order</DialogTitle>
            <DialogDescription>
              Update work order details and assignments
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter work order title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-taskName">Task Name</Label>
              <Input
                id="edit-taskName"
                value={formData.taskName}
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                placeholder="Enter specific task name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter work order description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-moId">Manufacturing Order *</Label>
                <Select value={formData.moId} onValueChange={(value) => setFormData({ ...formData, moId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturing order" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturingOrders.map((mo) => (
                      <SelectItem key={mo.id} value={mo.id}>
                        {mo.orderNo} - {mo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-assignedToId">Assigned To</Label>
                <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-estimatedTime">Est. Time (hrs)</Label>
                <Input
                  id="edit-estimatedTime"
                  type="number"
                  step="0.5"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkOrder}>Update Work Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}