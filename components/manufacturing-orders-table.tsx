"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ManufacturingOrder {
  id: string
  orderNo: string
  name: string
  product: {
    id: string
    name: string
  }
  quantity: number
  state: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED"
  deadline: string | null
  createdAt: string
  updatedAt: string
  workOrders?: any[]
}

interface ManufacturingOrdersTableProps {
  statusFilter?: string
  searchQuery?: string
  userRole?: string
  startDate?: Date
  endDate?: Date
}

export function ManufacturingOrdersTable({ statusFilter, searchQuery, userRole = "OPERATOR", startDate, endDate }: ManufacturingOrdersTableProps) {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Role-based permissions
  const canEditOrders = ["ADMIN", "MANAGER"].includes(userRole)
  const canViewAllOrders = ["ADMIN", "MANAGER"].includes(userRole)
  const canCancelOrders = ["ADMIN", "MANAGER"].includes(userRole)

  // Fetch manufacturing orders from API
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const response = await fetch('/api/mos')
        
        if (response.ok) {
          const data = await response.json()
          // Handle paginated response structure
          const ordersArray = data.manufacturingOrders || data || []
          setOrders(Array.isArray(ordersArray) ? ordersArray : [])
        } else {
          setError('Failed to fetch manufacturing orders')
        }
      } catch (err) {
        setError('Error loading manufacturing orders')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    const matchesStatus = !statusFilter || statusFilter === "all" || order.state.toLowerCase() === statusFilter.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      order.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Date filtering based on createdAt
    let matchesDateRange = true
    if (startDate || endDate) {
      const orderDate = new Date(order.createdAt)
      if (startDate && orderDate < startDate) {
        matchesDateRange = false
      }
      if (endDate && orderDate > endDate) {
        matchesDateRange = false
      }
    }

    return matchesStatus && matchesSearch && matchesDateRange
  })

  const getStatusColor = (state: string) => {
    switch (state) {
      case "PLANNED":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      case "CANCELED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading manufacturing orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-muted-foreground">No manufacturing orders found</div>
        {canEditOrders && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Manufacturing Order
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order No</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNo}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.product.name}</div>
                  <div className="text-sm text-muted-foreground">{order.name}</div>
                </div>
              </TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.state)}>
                  {order.state.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {order.deadline ? formatDate(order.deadline) : 'No deadline'}
              </TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {canEditOrders && (
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                      </DropdownMenuItem>
                    )}
                    {canCancelOrders && (
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}