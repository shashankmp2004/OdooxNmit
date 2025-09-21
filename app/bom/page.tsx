"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BOMComponentRow } from "@/components/bom-component-row"
import { BOMPreview } from "@/components/bom-preview"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Save, RotateCcw, FileText } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  
  const { toast } = useToast()
  const { data: session } = useAuth()

  // Fetch data from APIs
  useEffect(() => {
    async function fetchBOMData() {
      try {
        setLoading(true)
        const productsResponse = await fetch('/api/products')

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          const products = productsData.products || productsData || []
          
          // Separate finished products from raw materials/components
          const finishedProducts = products.filter((p: Product) => p.isFinished)
          const rawMaterials = products.filter((p: Product) => !p.isFinished)
          
          setAvailableProducts(finishedProducts)
          setAvailableComponents(rawMaterials)
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

  const resetForm = () => {
    setFinishedProduct("")
    setComponents([])
    setSelectedWorkOrders([])
    setEstimatedTime(0)
    setEstimatedCost(0)
    setDescription("")
  }

  const generateUUID = () => {
    try {
      // Prefer browser crypto if available
      // @ts-ignore - randomUUID exists on modern browsers
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        // @ts-ignore
        return (crypto as any).randomUUID()
      }
    } catch {}
    // Fallback
    return `bom-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
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
  // Simulate processing delay slightly for UX, but proceed with API calls
  await new Promise((resolve) => setTimeout(resolve, 400))

    const bomId = generateUUID()
    const bomData = {
      id: bomId,
      finishedProduct,
      components: validComponents,
      workOrders: selectedWorkOrders, // kept for compatibility; UI to attach WOs removed
      estimatedTime, // no longer set via UI
      estimatedCost, // no longer set via UI
      description,
      createdAt: new Date().toISOString(),
    }

    console.log("BOM Created:", bomData)

    try {
      // 1) Create a Manufacturing Order for the selected finished product
      const product = availableProducts.find(p => p.id === finishedProduct)
      const moPayload: any = {
        name: product ? `MO for ${product.name}` : `MO for ${finishedProduct}`,
        productId: finishedProduct,
        quantity: 1,
      }

      const moRes = await fetch('/api/mos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moPayload)
      })

      if (!moRes.ok) {
        const err = await moRes.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to create Manufacturing Order (${moRes.status})`)
      }

      const mo = await moRes.json()

      // 2) Create a Work Order linked to the MO. Use BOM's estimatedTime if provided (>0)
      const woPayload: any = {
        moId: mo.id,
        title: product ? `Work Order for ${product.name}` : 'Work Order',
        description: description || undefined,
        priority: 'MEDIUM',
      }
      // If UI has an estimate use it; otherwise fallback to 1 hour default
      if (estimatedTime && estimatedTime > 0) {
        woPayload.estimatedTime = estimatedTime
      } else {
        woPayload.estimatedTime = 1
      }

      const woRes = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(woPayload)
      })

      if (!woRes.ok) {
        const err = await woRes.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to create Work Order (${woRes.status})`)
      }

      const wo = await woRes.json()

      toast({
        title: "BOM + Work Order Created",
        description: `BOM ID: ${bomId}. Work Order ID: ${wo.id}.`,
      })
    } catch (e: any) {
      console.error('Error creating MO/WO from BOM:', e)
      toast({
        title: 'Error',
        description: e?.message || 'Failed to create work order from BOM',
        variant: 'destructive'
      })
    }

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
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="space-y-2">
                          <Label htmlFor="finished-product" className="text-sm font-medium">Finished Product</Label>
                          <Select value={finishedProduct} onValueChange={setFinishedProduct}>
                            <SelectTrigger className="bg-background border-input h-10 rounded-md text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
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
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description to help identify this BOM"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-background border-input rounded-md text-base placeholder:text-muted-foreground/70 resize-none h-24 shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

                  {/* Step 3 and Step 4 removed as per requirements */}

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
