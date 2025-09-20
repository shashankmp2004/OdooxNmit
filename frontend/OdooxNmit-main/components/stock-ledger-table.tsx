"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Package } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface StockItem {
  id: string
  productName: string
  category: string
  unit: string
  openingStock: number
  stockIn: number
  stockOut: number
  closingStock: number
  minStockAlert: number
  lastUpdated: string
  bomLink?: string
}

const mockStockData: StockItem[] = [
  {
    id: "PRD-001",
    productName: "Steel Rod 10mm",
    category: "Raw Materials",
    unit: "kg",
    openingStock: 500,
    stockIn: 200,
    stockOut: 150,
    closingStock: 550,
    minStockAlert: 100,
    lastUpdated: "2024-01-20T10:30:00Z",
    bomLink: "BOM-2024-001",
  },
  {
    id: "PRD-002",
    productName: "Hydraulic Seal Kit",
    category: "Components",
    unit: "pcs",
    openingStock: 25,
    stockIn: 10,
    stockOut: 30,
    closingStock: 5,
    minStockAlert: 20,
    lastUpdated: "2024-01-20T09:15:00Z",
  },
  {
    id: "PRD-003",
    productName: "Motor Assembly",
    category: "Assemblies",
    unit: "pcs",
    openingStock: 15,
    stockIn: 5,
    stockOut: 8,
    closingStock: 12,
    minStockAlert: 10,
    lastUpdated: "2024-01-20T14:45:00Z",
    bomLink: "BOM-2024-003",
  },
  {
    id: "PRD-004",
    productName: "Welding Electrodes",
    category: "Consumables",
    unit: "kg",
    openingStock: 50,
    stockIn: 25,
    stockOut: 60,
    closingStock: 15,
    minStockAlert: 30,
    lastUpdated: "2024-01-19T16:20:00Z",
  },
  {
    id: "PRD-005",
    productName: "Control Panel",
    category: "Finished Goods",
    unit: "pcs",
    openingStock: 8,
    stockIn: 3,
    stockOut: 2,
    closingStock: 9,
    minStockAlert: 5,
    lastUpdated: "2024-01-20T11:00:00Z",
  },
]

interface StockLedgerTableProps {
  searchQuery?: string
  categoryFilter?: string
  showLowStockOnly?: boolean
}

export function StockLedgerTable({ searchQuery, categoryFilter, showLowStockOnly }: StockLedgerTableProps) {
  const [stockData, setStockData] = useState<StockItem[]>(mockStockData)
  const [editingStock, setEditingStock] = useState<{ id: string; field: string; value: string } | null>(null)

  const filteredData = stockData.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !categoryFilter || categoryFilter === "all" || item.category === categoryFilter

    const matchesLowStock = !showLowStockOnly || item.closingStock <= item.minStockAlert

    return matchesSearch && matchesCategory && matchesLowStock
  })

  const getCategoryColor = (category: string) => {
    const colors = {
      "Raw Materials": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Components: "bg-green-500/20 text-green-400 border-green-500/30",
      Assemblies: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Finished Goods": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Consumables: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Tools: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const isLowStock = (item: StockItem) => item.closingStock <= item.minStockAlert

  const getStockMovement = (stockIn: number, stockOut: number) => {
    const net = stockIn - stockOut
    if (net > 0) return { icon: TrendingUp, color: "text-green-400", value: `+${net}` }
    if (net < 0) return { icon: TrendingDown, color: "text-red-400", value: net.toString() }
    return { icon: Package, color: "text-muted-foreground", value: "0" }
  }

  const handleStockEdit = (id: string, field: string, newValue: string) => {
    const numValue = Number.parseInt(newValue)
    if (isNaN(numValue) || numValue < 0) return

    setStockData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: numValue, lastUpdated: new Date().toISOString() }
          // Recalculate closing stock if opening, stockIn, or stockOut changed
          if (field === "openingStock" || field === "stockIn" || field === "stockOut") {
            updated.closingStock = updated.openingStock + updated.stockIn - updated.stockOut
          }
          return updated
        }
        return item
      }),
    )
    setEditingStock(null)
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground">Product Name</TableHead>
            <TableHead className="text-muted-foreground">Category</TableHead>
            <TableHead className="text-muted-foreground">Opening Stock</TableHead>
            <TableHead className="text-muted-foreground">Stock In</TableHead>
            <TableHead className="text-muted-foreground">Stock Out</TableHead>
            <TableHead className="text-muted-foreground">Closing Stock</TableHead>
            <TableHead className="text-muted-foreground">Movement</TableHead>
            <TableHead className="text-muted-foreground">Last Updated</TableHead>
            <TableHead className="text-muted-foreground w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => {
            const movement = getStockMovement(item.stockIn, item.stockOut)
            const MovementIcon = movement.icon

            return (
              <TableRow
                key={item.id}
                className={cn("border-border hover:bg-muted/50", isLowStock(item) && "bg-red-500/5")}
              >
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {item.productName}
                      {isLowStock(item) && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">{item.id}</div>
                    {item.bomLink && (
                      <div className="text-xs text-blue-400 hover:underline cursor-pointer">BOM: {item.bomLink}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingStock?.id === item.id && editingStock?.field === "openingStock" ? (
                    <Input
                      type="number"
                      defaultValue={item.openingStock}
                      className="w-20 h-8"
                      onBlur={(e) => handleStockEdit(item.id, "openingStock", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleStockEdit(item.id, "openingStock", e.currentTarget.value)
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                      onClick={() =>
                        setEditingStock({ id: item.id, field: "openingStock", value: item.openingStock.toString() })
                      }
                    >
                      {item.openingStock.toLocaleString()} {item.unit}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-green-400">
                    +{item.stockIn.toLocaleString()} {item.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-red-400">
                    -{item.stockOut.toLocaleString()} {item.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium", isLowStock(item) ? "text-red-400" : "text-foreground")}>
                      {item.closingStock.toLocaleString()} {item.unit}
                    </span>
                    {isLowStock(item) && (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MovementIcon className={cn("h-4 w-4", movement.color)} />
                    <span className={cn("text-sm", movement.color)}>{movement.value}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.lastUpdated).toLocaleDateString()}
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
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Product
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Product
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
