"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StockLedgerTable } from "@/components/stock-ledger-table"
import { AddProductDialog } from "@/components/add-product-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StockStats {
  totalProducts: number
  lowStockItems: number
  stockInToday: number
  stockOutToday: number
}

export default function StockLedgerPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false)
  const [stockStats, setStockStats] = useState<StockStats>({
    totalProducts: 0,
    lowStockItems: 0,
    stockInToday: 0,
    stockOutToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const { toast } = useToast()
  const { data: session } = useAuth()

  // Fetch stock statistics
  useEffect(() => {
    // Initialize low stock filter from query param
  const low = searchParams?.get('low')
    if (low === '1' || low === 'true') {
      setShowLowStockOnly(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchStockStats = async () => {
      try {
        const response = await fetch("/api/stock/stats")
        if (response.ok) {
          const stats = await response.json()
          setStockStats(stats)
        }
      } catch (error) {
        console.error("Error fetching stock stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStockStats()
  }, [])

  // Fetch low stock items for the widget
  useEffect(() => {
    async function fetchLow() {
      try {
        const res = await fetch('/api/stock/low')
        if (res.ok) {
          const data = await res.json()
          setLowStockItems(data.items || [])
        }
      } catch (e) {
        console.error('Error loading low stock items', e)
      }
    }
    fetchLow()
  }, [])

  const handleAddProduct = async (data: {
    name: string
    category: string
    unit: string
    minStockAlert: number
    bomLink?: string
    description?: string
    initialStock: number
  }) => {
    try {
      // Create the product
      const productResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          minStockAlert: data.minStockAlert,
          bomLink: data.bomLink,
          description: data.description,
          isFinished: false,
        }),
      })

      if (!productResponse.ok) {
        throw new Error("Failed to create product")
      }

      const newProduct = await productResponse.json()

      // Add initial stock entry if provided
      if (data.initialStock > 0) {
        await fetch("/api/stock/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: newProduct.id,
            type: "IN",
            quantity: data.initialStock,
            reference: "INITIAL-STOCK",
            notes: "Initial stock entry",
          }),
        })
      }

      toast({
        title: "Product Added",
        description: `${data.name} has been added to inventory with ${data.initialStock} units`,
      })

      // Refresh the data
      window.location.reload()
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      if (showLowStockOnly) params.set('low', '1')

      const res = await fetch(`/api/stock/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stock-ledger-${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Export Ready', description: 'Your stock report has been downloaded.' })
    } catch (e) {
      console.error('Stock export error', e)
      toast({ title: 'Export Failed', description: 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <ProtectedRoute allowedRoles={["INVENTORY", "MANAGER", "ADMIN"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={session?.user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Stock Ledger" userName={`${session?.user?.name} (${session?.user?.role})`} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stock Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">{stockStats.totalProducts}</div>
                        <p className="text-xs text-green-400 mt-1">Total products in inventory</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-red-400">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-red-400">{stockStats.lowStockItems}</div>
                        <p className="text-xs text-red-400 mt-1">Requires attention</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stock In (Today)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-green-400">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-400">{stockStats.stockInToday.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Units received</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stock Out (Today)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-red-400">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-red-400">{stockStats.stockOutToday.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Units consumed</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Widget */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" /> Low Stock Items
                  </CardTitle>
                  {lowStockItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLowStockOnly(true)}
                      className="bg-background border-input"
                    >
                      Show Only Low Stock
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {lowStockItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No items below threshold</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lowStockItems.slice(0, 9).map((it) => (
                        <div key={it.id} className="border rounded-md p-3 bg-background">
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate" title={it.name}>{it.name}</div>
                            <Badge variant="destructive">{it.currentStock}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Min: {it.minStockLevel} • {it.unit || 'units'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Filters and Actions */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-input"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-background border-input">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      <SelectItem value="Components">Components</SelectItem>
                      <SelectItem value="Assemblies">Assemblies</SelectItem>
                      <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Low Stock Filter */}
                  <div className="flex items-center space-x-2">
                    <Switch id="low-stock" checked={showLowStockOnly} onCheckedChange={setShowLowStockOnly} />
                    <Label htmlFor="low-stock" className="text-sm text-foreground">
                      Show low stock only
                    </Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportReport} className="bg-background border-input">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                  <Button
                    onClick={() => setAddProductDialogOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Stock Ledger Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Inventory Stock Ledger</h2>
                </div>
                <StockLedgerTable
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  lowStockOnlyProductIds={showLowStockOnly ? lowStockItems.map(i => i.id) : undefined}
                />
              </div>
            </div>
          </main>
        </div>

        <AddProductDialog
          open={addProductDialogOpen}
          onOpenChange={setAddProductDialogOpen}
          onSubmit={handleAddProduct}
        />
      </div>
    </ProtectedRoute>
  )
}
