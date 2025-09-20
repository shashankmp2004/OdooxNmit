"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Users,
  Package,
  Factory,
  Wrench,
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react"

interface AdminStats {
  users: {
    total: number
    byRole: { role: string; count: number }[]
    recentSignups: number
  }
  products: {
    total: number
    lowStock: number
    categories: { category: string; count: number }[]
  }
  manufacturing: {
    activeOrders: number
    completedThisMonth: number
    pendingWork: number
    inProgressWork: number
  }
  stock: {
    totalValue: number
    movements: number
    alerts: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lowStock, setLowStock] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Also fetch low stock list for widget
    const fetchLow = async () => {
      try {
        const res = await fetch('/api/stock/low')
        if (res.ok) {
          const data = await res.json()
          setLowStock(data.items || [])
        }
      } catch (e) {}
    }
    fetchLow()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and management controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            System Health
          </Button>
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users.recentSignups || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.products.lowStock || 0} low stock alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.manufacturing.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.manufacturing.completedThisMonth || 0} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.manufacturing.pendingWork || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.manufacturing.inProgressWork || 0} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Low Stock Items</CardTitle>
            <Link href="/stock-ledger?low=1">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items below threshold</div>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 6).map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between border rounded-md p-2">
                    <div className="truncate" title={it.name}>{it.name}</div>
                    <div className="text-sm text-red-600">{it.currentStock}/{it.minStockLevel}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
  {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.users.byRole.map((role) => (
                <div key={role.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{role.role}</Badge>
                  </div>
                  <span className="font-medium">{role.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Products by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.products.categories.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm">{category.category || 'Uncategorized'}</span>
                  <span className="font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-medium">Manage Users</h3>
            <p className="text-sm text-muted-foreground text-center">
              Create, edit, and manage user accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-medium">Product Catalog</h3>
            <p className="text-sm text-muted-foreground text-center">
              Manage products, BOMs, and inventory
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Factory className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-medium">Production Control</h3>
            <p className="text-sm text-muted-foreground text-center">
              Oversee manufacturing and work orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}