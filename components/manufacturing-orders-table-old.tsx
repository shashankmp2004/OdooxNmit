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
}

export function ManufacturingOrdersTable({ statusFilter, searchQuery, userRole = "OPERATOR" }: ManufacturingOrdersTableProps) {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Role-based permissions
  const canEditOrders = ["ADMIN", "MANAGER"].includes(userRole)
  const canViewAllOrders = ["ADMIN", "MANAGER"].includes(userRole)
  const canCancelOrders = ["ADMIN", "MANAGER"].includes(userRole)

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = !statusFilter || statusFilter === "all" || order.status === statusFilter
    const matchesSearch =
      !searchQuery ||
      order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

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

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground">Order ID</TableHead>
            <TableHead className="text-muted-foreground">Product</TableHead>
            <TableHead className="text-muted-foreground">Quantity</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Priority</TableHead>
            <TableHead className="text-muted-foreground">Start Date</TableHead>
            <TableHead className="text-muted-foreground">End Date</TableHead>
            <TableHead className="text-muted-foreground">Progress</TableHead>
            <TableHead className="text-muted-foreground w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id} className="border-border hover:bg-muted/50">
              <TableCell className="font-mono text-sm text-foreground">{order.id}</TableCell>
              <TableCell className="font-medium text-foreground">{order.product}</TableCell>
              <TableCell className="text-foreground">{order.quantity.toLocaleString()}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getPriorityColor(order.priority)}>
                  {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(order.startDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(order.endDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={order.progress} className="w-16 h-2" />
                  <span className="text-sm text-muted-foreground w-10">{order.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
