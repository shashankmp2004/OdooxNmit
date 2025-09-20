"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit, Plus, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface StockEntry {
  id: string
  type: string
  quantity: number
  reference?: string
  notes?: string
  product: {
    id: string
    name: string
  }
  createdAt: string
}

interface Product {
  id: string
  name: string
}

const entryTypes = ['IN', 'OUT']

export default function StockPage() {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    type: 'IN',
    quantity: '',
    reference: '',
    notes: ''
  })

  useEffect(() => {
    fetchStockEntries()
    fetchProducts()
  }, [])

  const fetchStockEntries = async () => {
    try {
      const response = await fetch('/api/admin/stock')
      if (response.ok) {
        const data = await response.json()
        setStockEntries(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch stock entries",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching stock entries:', error)
      toast({
        title: "Error",
        description: "Failed to fetch stock entries",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleCreateEntry = async () => {
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stock entry created successfully"
        })
        setIsCreateDialogOpen(false)
        setFormData({
          productId: '',
          type: 'IN',
          quantity: '',
          reference: '',
          notes: ''
        })
        fetchStockEntries()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create stock entry",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating stock entry:', error)
      toast({
        title: "Error",
        description: "Failed to create stock entry",
        variant: "destructive"
      })
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry) return

    try {
      const response = await fetch(`/api/admin/stock/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stock entry updated successfully"
        })
        setIsEditDialogOpen(false)
        setEditingEntry(null)
        setFormData({
          productId: '',
          type: 'IN',
          quantity: '',
          reference: '',
          notes: ''
        })
        fetchStockEntries()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update stock entry",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating stock entry:', error)
      toast({
        title: "Error",
        description: "Failed to update stock entry",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock entry?')) return

    try {
      const response = await fetch(`/api/admin/stock/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stock entry deleted successfully"
        })
        fetchStockEntries()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete stock entry",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting stock entry:', error)
      toast({
        title: "Error",
        description: "Failed to delete stock entry",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (entry: StockEntry) => {
    setEditingEntry(entry)
    setFormData({
      productId: entry.product.id,
      type: entry.type,
      quantity: entry.quantity.toString(),
      reference: entry.reference || '',
      notes: entry.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const getTypeBadgeColor = (type: string) => {
    return type === 'IN' ? 'bg-green-500' : 'bg-red-500'
  }

  const getTypeIcon = (type: string) => {
    return type === 'IN' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  const filteredEntries = stockEntries.filter(entry => {
    const matchesSearch = entry.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || entry.type === selectedType
    const matchesProduct = selectedProduct === 'all' || entry.product.id === selectedProduct
    return matchesSearch && matchesType && matchesProduct
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-gray-600">Manage inventory movements and stock entries</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Stock Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Stock Entry</DialogTitle>
              <DialogDescription>
                Add a new stock movement entry
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {entryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Enter reference (e.g., PO number, invoice)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEntry}>Create Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IN">Stock In</SelectItem>
                <SelectItem value="OUT">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Track all inventory movements and stock transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.product.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-white ${getTypeBadgeColor(entry.type)} flex items-center gap-1 w-fit`}>
                      {getTypeIcon(entry.type)}
                      {entry.type === 'IN' ? 'Stock In' : 'Stock Out'}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell>
                    {entry.notes ? (
                      <div className="max-w-xs truncate" title={entry.notes}>
                        {entry.notes}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(entry)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Stock Entry</DialogTitle>
            <DialogDescription>
              Update stock movement details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-productId">Product *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entryTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === 'IN' ? 'Stock In' : 'Stock Out'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-quantity">Quantity *</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-reference">Reference</Label>
              <Input
                id="edit-reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Enter reference (e.g., PO number, invoice)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry}>Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}