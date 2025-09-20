"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Activity, Users, Clock } from "lucide-react"
import { AddWorkCenterDialog } from "@/components/add-work-center-dialog"
import { EditWorkCenterDialog } from "@/components/edit-work-center-dialog"

interface WorkCenter {
  id: string
  name: string
  description?: string
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE'
  capacity?: number
  costPerHour?: number
  activeWorkOrders: number
  pendingWorkOrders: number
  utilization: number
  isOverloaded: boolean
  createdAt: string
  updatedAt: string
}

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<WorkCenter | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const { data: session } = useAuth()
  const userRole = session?.user?.role || "OPERATOR"
  const canManageWorkCenters = ["ADMIN", "MANAGER"].includes(userRole)

  useEffect(() => {
    fetchWorkCenters()
  }, [])

  const fetchWorkCenters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/work-centers')
      if (response.ok) {
        const data = await response.json()
        setWorkCenters(data)
      } else {
        setError('Failed to fetch work centers')
      }
    } catch (err) {
      setError('Error loading work centers')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkCenterAdded = () => {
    fetchWorkCenters()
    setIsAddDialogOpen(false)
  }

  const handleWorkCenterUpdated = () => {
    fetchWorkCenters()
    setIsEditDialogOpen(false)
    setSelectedWorkCenter(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'BUSY':
        return 'bg-yellow-100 text-yellow-800'
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800'
      case 'OFFLINE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUtilizationColor = (utilization: number, isOverloaded: boolean) => {
    if (isOverloaded) return 'text-red-600'
    if (utilization > 80) return 'text-yellow-600'
    if (utilization > 50) return 'text-blue-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header title="Work Centers" />
            <main className="flex-1 overflow-auto p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Work Centers" />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Work Centers</h1>
                <p className="text-muted-foreground">
                  Manage production stations and their capacity
                </p>
              </div>
              {canManageWorkCenters && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Work Center
                </Button>
              )}
            </div>

            {error && (
              <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workCenters.map((workCenter) => (
                <Card key={workCenter.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{workCenter.name}</CardTitle>
                        {workCenter.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {workCenter.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(workCenter.status)}>
                          {workCenter.status}
                        </Badge>
                        {canManageWorkCenters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkCenter(workCenter)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capacity and Utilization */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Users className="h-3 w-3" />
                          Capacity
                        </div>
                        <div className="font-medium">
                          {workCenter.capacity ? `${workCenter.capacity} units/hr` : 'Unlimited'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Activity className="h-3 w-3" />
                          Utilization
                        </div>
                        <div className={`font-medium ${getUtilizationColor(workCenter.utilization, workCenter.isOverloaded)}`}>
                          {workCenter.utilization}%
                          {workCenter.isOverloaded && ' (Overloaded)'}
                        </div>
                      </div>
                    </div>

                    {/* Work Orders */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          Active
                        </div>
                        <div className="font-medium text-blue-600">
                          {workCenter.activeWorkOrders} orders
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </div>
                        <div className="font-medium text-yellow-600">
                          {workCenter.pendingWorkOrders} orders
                        </div>
                      </div>
                    </div>

                    {/* Cost */}
                    {workCenter.costPerHour && (
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">Operating Cost</div>
                        <div className="font-medium">${workCenter.costPerHour}/hour</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {workCenters.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Work Centers</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first work center.
                </p>
                {canManageWorkCenters && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Work Center
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <AddWorkCenterDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onWorkCenterAdded={handleWorkCenterAdded}
      />

      {selectedWorkCenter && (
        <EditWorkCenterDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          workCenter={selectedWorkCenter}
          onWorkCenterUpdated={handleWorkCenterUpdated}
        />
      )}
    </ProtectedRoute>
  )
}