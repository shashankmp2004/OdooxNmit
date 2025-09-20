"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Package, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface StockEntry {
  id: string
  product: {
    id: string
    name: string
    unit: string
    category: string
  }
  type: "IN" | "OUT"
  quantity: number
  reference: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface StockItem {
  productId: string
  productName: string
  category: string
  unit: string
  currentStock: number
  totalIn: number
  totalOut: number
  lastUpdated: string
}

interface StockLedgerTableProps {
  searchQuery?: string
  categoryFilter?: string
  userRole?: string
}

export function StockLedgerTable({ searchQuery, categoryFilter, userRole = "OPERATOR" }: StockLedgerTableProps) {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
  const [stockSummary, setStockSummary] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"entries" | "summary">("summary")

  // Role-based permissions
  const canEditStock = ["ADMIN", "MANAGER", "INVENTORY"].includes(userRole)
  const canViewAllStock = ["ADMIN", "MANAGER", "INVENTORY"].includes(userRole)

  // Fetch stock data from API
  useEffect(() => {
    async function fetchStockData() {
      try {
        setLoading(true)
        const [entriesResponse, summaryResponse] = await Promise.all([
          fetch('/api/stock'),
          fetch('/api/stock/summary')
        ])
        
        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json()
          // Ensure data is an array
          setStockEntries(Array.isArray(entriesData) ? entriesData : [])
        }

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          // Ensure data is an array
          setStockSummary(Array.isArray(summaryData) ? summaryData : [])
        } else {
          // If summary endpoint doesn't exist, calculate from entries
          const entriesData = await entriesResponse.json()
          const entriesArray = Array.isArray(entriesData) ? entriesData : []
          setStockEntries(entriesArray)
          // Calculate summary from entries
          const summary = calculateStockSummary(entriesArray)
          setStockSummary(summary)
        }
      } catch (err) {
        setError('Error loading stock data')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  // Calculate stock summary from entries
  const calculateStockSummary = (entries: StockEntry[]): StockItem[] => {
    const productMap = new Map<string, StockItem>()

    entries.forEach(entry => {
      const existing = productMap.get(entry.product.id)
      const quantity = entry.type === "IN" ? entry.quantity : -entry.quantity

      if (existing) {
        existing.currentStock += quantity
        existing.totalIn += entry.type === "IN" ? entry.quantity : 0
        existing.totalOut += entry.type === "OUT" ? entry.quantity : 0
        existing.lastUpdated = entry.createdAt > existing.lastUpdated ? entry.createdAt : existing.lastUpdated
      } else {
        productMap.set(entry.product.id, {
          productId: entry.product.id,
          productName: entry.product.name,
          category: entry.product.category,
          unit: entry.product.unit,
          currentStock: quantity,
          totalIn: entry.type === "IN" ? entry.quantity : 0,
          totalOut: entry.type === "OUT" ? entry.quantity : 0,
          lastUpdated: entry.createdAt
        })
      }
    })

    return Array.from(productMap.values())
  }

  const filteredStockSummary = (Array.isArray(stockSummary) ? stockSummary : []).filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const filteredStockEntries = (Array.isArray(stockEntries) ? stockEntries : []).filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || entry.product.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStockStatus = (currentStock: number) => {
    if (currentStock <= 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (currentStock < 10) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading stock data...</div>
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

  if ((Array.isArray(stockSummary) ? stockSummary.length : 0) === 0 && (Array.isArray(stockEntries) ? stockEntries.length : 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-muted-foreground">No stock data found</div>
        {canEditStock && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add First Stock Entry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant={view === "summary" ? "default" : "outline"}
            onClick={() => setView("summary")}
          >
            Stock Summary
          </Button>
          <Button 
            variant={view === "entries" ? "default" : "outline"}
            onClick={() => setView("entries")}
          >
            Stock Entries
          </Button>
        </div>
      </div>

      {view === "summary" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Total In</TableHead>
                <TableHead>Total Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockSummary.map((item) => {
                const stockStatus = getStockStatus(item.currentStock)
                return (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">{item.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="font-medium">{item.currentStock}</TableCell>
                    <TableCell className="text-green-600">{item.totalIn}</TableCell>
                    <TableCell className="text-red-600">{item.totalOut}</TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.lastUpdated)}</TableCell>
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
                            <Package className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canEditStock && (
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Adjust Stock
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{entry.product.name}</div>
                      <div className="text-sm text-muted-foreground">{entry.product.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={entry.type === "IN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {entry.type === "IN" ? "Stock In" : "Stock Out"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{entry.quantity} {entry.product.unit}</TableCell>
                  <TableCell>{entry.reference}</TableCell>
                  <TableCell>{entry.notes || "-"}</TableCell>
                  <TableCell>{formatDate(entry.createdAt)}</TableCell>
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
                          <Package className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canEditStock && (
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Entry
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
      )}
    </div>
  )
}