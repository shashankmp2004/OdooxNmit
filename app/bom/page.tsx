"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BOMComponentRow } from "@/components/bom-component-row"
import { BOMPreview } from "@/components/bom-preview"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, RotateCcw, FileText, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BOMComponent {
  id: string
  name: string
  quantity: number
  unit: string
  cost?: number
}

interface Product {
  id: string
  name: string
  sku: string
  isFinished: boolean
}

interface WorkOrder {
  id: string
  orderNo: string
  name: string
}

export default function BOMPage() {
  const [finishedProduct, setFinishedProduct] = useState("")
  const [components, setComponents] = useState<BOMComponent[]>([])
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([])
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // API data
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [availableComponents, setAvailableComponents] = useState<Product[]>([])
  const [availableWorkOrders, setAvailableWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  const { toast } = useToast()
  const { data: session } = useAuth()

  // Fetch data from APIs
  useEffect(() => {
    async function fetchBOMData() {
      try {
        setLoading(true)
        const [productsResponse, workOrdersResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/work-orders')
        ])

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          const products = productsData.products || productsData || []
          
          // Separate finished products from raw materials/components
          const finishedProducts = products.filter((p: Product) => p.isFinished)
          const rawMaterials = products.filter((p: Product) => !p.isFinished)
          
          setAvailableProducts(finishedProducts)
          setAvailableComponents(rawMaterials)
        }

        if (workOrdersResponse.ok) {
          const workOrdersData = await workOrdersResponse.json()
          const workOrders = workOrdersData.workOrders || workOrdersData || []
          setAvailableWorkOrders(workOrders)
        }
      } catch (err) {
        console.error('Error loading BOM data:', err)
        toast({
          title: "Error",
          description: "Failed to load BOM data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBOMData()
  }, [])

  const addComponent = () => {
    const newComponent: BOMComponent = {
      id: `comp-${Date.now()}`,
      name: "",
      quantity: 0,
      unit: "pcs",
      cost: 0,
    }
    setComponents([...components, newComponent])
  }

  const updateComponent = (id: string, field: keyof BOMComponent, value: string | number) => {
    setComponents((prev) => prev.map((comp) => (comp.id === id ? { ...comp, [field]: value } : comp)))
  }

  const removeComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id))
  }

  const addWorkOrder = (workOrderId: string) => {
    if (!selectedWorkOrders.includes(workOrderId)) {
      setSelectedWorkOrders([...selectedWorkOrders, workOrderId])
    }
  }

  const removeWorkOrder = (workOrderId: string) => {
    setSelectedWorkOrders((prev) => prev.filter((id) => id !== workOrderId))
  }

  const resetForm = () => {
    setFinishedProduct("")
    setComponents([])
    setSelectedWorkOrders([])
    setEstimatedTime(0)
    setEstimatedCost(0)
    setDescription("")
  }

  const handleSubmit = async () => {
    if (!finishedProduct || components.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a finished product and add at least one component.",
        variant: "destructive",
      })
      return
    }

    const validComponents = components.filter((comp) => comp.name && comp.quantity > 0)
    if (validComponents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please ensure all components have valid names and quantities.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const bomData = {
      finishedProduct,
      components: validComponents,
      workOrders: selectedWorkOrders,
      estimatedTime,
      estimatedCost,
      description,
      createdAt: new Date().toISOString(),
    }

    console.log("BOM Created:", bomData)

    toast({
      title: "BOM Created Successfully",
      description: `BOM for ${finishedProduct} has been saved.`,
    })

    resetForm()
    setIsSubmitting(false)
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={session?.user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="BOM Management" userName={`${session?.user?.name} (${session?.user?.role})`} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <FileText className="h-5 w-5" />
                        Step 1: Select Finished Product
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="finished-product">Finished Product</Label>
                          <Select value={finishedProduct} onValueChange={setFinishedProduct}>
                            <SelectTrigger className="bg-background border-input">
                              <SelectValue placeholder="Select finished product" />
                            </SelectTrigger>
                            <SelectContent>
                              {loading ? (
                                <SelectItem value="loading" disabled>Loading products...</SelectItem>
                              ) : availableProducts.length > 0 ? (
                                availableProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No finished products available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            placeholder="BOM description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2: Components */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Step 2: Add Components
                        </span>
                        <Button onClick={addComponent} size="sm" className="bg-primary text-primary-foreground">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Component
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-4">
                          <div className="col-span-4">Component Name</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Unit</div>
                          <div className="col-span-2">Unit Cost ($)</div>
                          <div className="col-span-2">Actions</div>
                        </div>

                        {/* Component Rows */}
                        {components.map((component) => (
                          <BOMComponentRow
                            key={component.id}
                            component={component}
                            onUpdate={updateComponent}
                            onRemove={removeComponent}
                            availableComponents={availableComponents}
                          />
                        ))}

                        {components.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No components added yet. Click "Add Component" to get started.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 3: Work Orders */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Step 3: Attach Work Orders (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Select onValueChange={addWorkOrder}>
                          <SelectTrigger className="bg-background border-input">
                            <SelectValue placeholder="Select work order to attach" />
                          </SelectTrigger>
                          <SelectContent>
                            {loading ? (
                              <SelectItem value="loading" disabled>Loading work orders...</SelectItem>
                            ) : availableWorkOrders.length > 0 ? (
                              availableWorkOrders
                                .filter((wo) => !selectedWorkOrders.includes(wo.id))
                                .map((workOrder) => (
                                  <SelectItem key={workOrder.id} value={workOrder.id}>
                                    {workOrder.orderNo} - {workOrder.name}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="none" disabled>No work orders available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        {selectedWorkOrders.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedWorkOrders.map((workOrderId) => {
                              const workOrder = availableWorkOrders.find(wo => wo.id === workOrderId)
                              return (
                                <Badge key={workOrderId} variant="secondary" className="flex items-center gap-1">
                                  {workOrder ? `${workOrder.orderNo} - ${workOrder.name}` : workOrderId}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => removeWorkOrder(workOrderId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 4: Estimates */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Step 4: Set Estimates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimated-time">Estimated Production Time (hours)</Label>
                          <Input
                            id="estimated-time"
                            type="number"
                            step="0.5"
                            placeholder="0"
                            value={estimatedTime || ""}
                            onChange={(e) => setEstimatedTime(Number.parseFloat(e.target.value) || 0)}
                            className="bg-background border-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimated-cost">Total Estimated Cost ($)</Label>
                          <Input
                            id="estimated-cost"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={estimatedCost || ""}
                            onChange={(e) => setEstimatedCost(Number.parseFloat(e.target.value) || 0)}
                            className="bg-background border-input"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Saving BOM..." : "Save BOM"}
                    </Button>
                    <Button onClick={resetForm} variant="outline" className="bg-background border-input">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Form
                    </Button>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <BOMPreview
                      finishedProduct={finishedProduct}
                      components={components}
                      workOrders={selectedWorkOrders}
                      estimatedTime={estimatedTime}
                      estimatedCost={estimatedCost}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
