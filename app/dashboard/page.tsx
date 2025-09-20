"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { KPICard } from "@/components/kpi-card"
import { DashboardFilters } from "@/components/dashboard-filters"
import { ManufacturingOrdersTable } from "@/components/manufacturing-orders-table"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Package, Clock, AlertTriangle, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedRoles={["Operator", "Inventory Manager", "Manager", "Admin"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Manufacturing Dashboard" />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Orders Completed"
                  value="24"
                  change="+12% from last month"
                  changeType="positive"
                  icon={Package}
                />
                <KPICard
                  title="Orders In-Progress"
                  value="8"
                  change="+2 from yesterday"
                  changeType="positive"
                  icon={Clock}
                />
                <KPICard
                  title="Orders Delayed"
                  value="3"
                  change="-1 from last week"
                  changeType="positive"
                  icon={AlertTriangle}
                />
                <KPICard
                  title="Resource Utilization"
                  value="87%"
                  change="+5% from last month"
                  changeType="positive"
                  icon={TrendingUp}
                />
              </div>

              {/* Filters */}
              <DashboardFilters onStatusChange={setStatusFilter} onSearchChange={setSearchQuery} />

              {/* Manufacturing Orders Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Manufacturing Orders</h2>
                </div>
                <ManufacturingOrdersTable statusFilter={statusFilter} searchQuery={searchQuery} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
