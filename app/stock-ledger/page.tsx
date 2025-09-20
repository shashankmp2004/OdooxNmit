"use client"

import { useState } from "react"
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
import { Search, Plus, Download, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StockLedgerPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleAddProduct = (data: {
    name: string
    category: string
    unit: string
    minStockAlert: number
    bomLink?: string
    description?: string
    initialStock: number
  }) => {
    console.log("Adding product:", data)
    toast({
      title: "Product Added",
      description: `${data.name} has been added to inventory`,
    })
  }

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Stock report is being generated...",
    })
  }

  return (
    <ProtectedRoute allowedRoles={["Inventory Manager", "Manager", "Admin"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Stock Ledger" userName={`${user?.name} (${user?.role})`} />
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
                    <div className="text-2xl font-bold text-foreground">247</div>
                    <p className="text-xs text-green-400 mt-1">+12 this month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">8</div>
                    <p className="text-xs text-red-400 mt-1">Requires attention</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stock In (Today)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">1,245</div>
                    <p className="text-xs text-muted-foreground mt-1">Units received</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stock Out (Today)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">892</div>
                    <p className="text-xs text-muted-foreground mt-1">Units consumed</p>
                  </CardContent>
                </Card>
              </div>

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
                  showLowStockOnly={showLowStockOnly}
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
