"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit, Trash2, Package, Search, Download, Upload, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  sku: string
  category: string | null
  price: number
  stock: number
}

interface BOMItem {
  id: string
  productId: string
  componentId: string
  quantity: number
  unit: string
  notes?: string
  product: Product
  component: Product
}

interface BOM {
  id: string
  productId: string
  version: string
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
  product: Product
  items: BOMItem[]
}

export default function AdminBOMPage() {
  const [boms, setBOMs] = useState<BOM[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    productId: '',
    version: '',
    description: '',
    isActive: true,
    items: [] as Array<{
      componentId: string
      quantity: number
      unit: string
      notes: string
    }>
  })

  useEffect(() => {
    fetchBOMs()
    fetchProducts()
  }, [])

  const fetchBOMs = async () => {
    try {
      const response = await fetch('/api/admin/bom')
      if (response.ok) {
        const data = await response.json()
        setBOMs(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch BOMs",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching BOMs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch BOMs",
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

  const handleCreateBOM = async () => {
    try {
      const response = await fetch('/api/admin/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "BOM created successfully"
        })
        fetchBOMs()
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create BOM",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating BOM:', error)
      toast({
        title: "Error",
        description: "Failed to create BOM",
        variant: "destructive"
      })
    }
  }

  const handleUpdateBOM = async () => {
    if (!selectedBOM) return

    try {
      const response = await fetch(`/api/admin/bom/${selectedBOM.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "BOM updated successfully"
        })
        fetchBOMs()
        setIsEditDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update BOM",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating BOM:', error)
      toast({
        title: "Error",
        description: "Failed to update BOM",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBOM = async (bomId: string) => {
    if (!confirm('Are you sure you want to delete this BOM?')) return

    try {
      const response = await fetch(`/api/admin/bom/${bomId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "BOM deleted successfully"
        })
        fetchBOMs()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete BOM",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting BOM:', error)
      toast({
        title: "Error",
        description: "Failed to delete BOM",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      productId: '',
      version: '',
      description: '',
      isActive: true,
      items: []
    })
    setSelectedBOM(null)
  }

  const openEditDialog = (bom: BOM) => {
    setSelectedBOM(bom)
    setFormData({
      productId: bom.productId,
      version: bom.version,
      description: bom.description || '',
      isActive: bom.isActive,
      items: bom.items.map(item => ({
        componentId: item.componentId,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || ''
      }))
    })
    setIsEditDialogOpen(true)
  }

  const addBOMItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { componentId: '', quantity: 1, unit: 'pcs', notes: '' }]
    }))
  }

  const removeBOMItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateBOMItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const filteredBOMs = boms.filter(bom =>
    bom.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.version.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportBOM = async (bomId: string) => {
    try {
      const response = await fetch(`/api/admin/bom/${bomId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `bom_${bomId}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Success",
          description: "BOM exported successfully"
        })
      }
    } catch (error) {
      console.error('Error exporting BOM:', error)
      toast({
        title: "Error",
        description: "Failed to export BOM",
        variant: "destructive"
      })
    }
  }

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
          <h1 className="text-3xl font-bold">BOM Management</h1>
          <p className="text-gray-600">Manage Bill of Materials for products</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create BOM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New BOM</DialogTitle>
              <DialogDescription>
                Create a new Bill of Materials for a product
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productId">Product</Label>
                  <Select 
                    value={formData.productId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., v1.0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="BOM description..."
                />
              </div>
              
              {/* BOM Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>BOM Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBOMItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end p-2 border rounded">
                      <div>
                        <Label className="text-xs">Component</Label>
                        <Select 
                          value={item.componentId} 
                          onValueChange={(value) => updateBOMItem(index, 'componentId', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Component" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value))}
                          className="h-8"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateBOMItem(index, 'unit', e.target.value)}
                          className="h-8"
                          placeholder="pcs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Input
                          value={item.notes}
                          onChange={(e) => updateBOMItem(index, 'notes', e.target.value)}
                          className="h-8"
                          placeholder="Optional notes"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBOMItem(index)}
                        className="h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateBOM}>
                Create BOM
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search BOMs by product name, SKU, or version..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* BOMs Table */}
      <Card>
        <CardHeader>
          <CardTitle>BOMs ({filteredBOMs.length})</CardTitle>
          <CardDescription>
            Manage Bill of Materials for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBOMs.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bom.product.name}</div>
                      <div className="text-sm text-gray-500">{bom.product.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bom.version}</Badge>
                  </TableCell>
                  <TableCell>{bom.items.length} items</TableCell>
                  <TableCell>
                    <Badge variant={bom.isActive ? "default" : "secondary"}>
                      {bom.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(bom.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBOM(bom)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(bom)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportBOM(bom.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBOM(bom.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredBOMs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No BOMs found. Create your first BOM to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View BOM Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View BOM - {selectedBOM?.product.name}</DialogTitle>
            <DialogDescription>
              Version {selectedBOM?.version} - {selectedBOM?.isActive ? 'Active' : 'Inactive'}
            </DialogDescription>
          </DialogHeader>
          {selectedBOM && (
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600">{selectedBOM.description || 'No description'}</p>
              </div>
              <div>
                <Label>BOM Items ({selectedBOM.items.length})</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBOM.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.component.name}</div>
                            <div className="text-sm text-gray-500">{item.component.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit BOM Dialog - Similar to Create but with update functionality */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit BOM</DialogTitle>
            <DialogDescription>
              Update the Bill of Materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-productId">Product</Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-version">Version</Label>
                <Input
                  id="edit-version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., v1.0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="BOM description..."
              />
            </div>
            
            {/* BOM Items - Same as create dialog */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>BOM Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBOMItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end p-2 border rounded">
                    <div>
                      <Label className="text-xs">Component</Label>
                      <Select 
                        value={item.componentId} 
                        onValueChange={(value) => updateBOMItem(index, 'componentId', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Component" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value))}
                        className="h-8"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateBOMItem(index, 'unit', e.target.value)}
                        className="h-8"
                        placeholder="pcs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateBOMItem(index, 'notes', e.target.value)}
                        className="h-8"
                        placeholder="Optional notes"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBOMItem(index)}
                      className="h-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateBOM}>
              Update BOM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}