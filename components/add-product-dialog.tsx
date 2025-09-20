"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    name: string
    category: string
    unit: string
    minStockAlert: number
    bomLink?: string
    description?: string
    initialStock: number
  }) => void
}

export function AddProductDialog({ open, onOpenChange, onSubmit }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "",
    minStockAlert: "",
    bomLink: "",
    description: "",
    initialStock: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.unit || !formData.minStockAlert || !formData.initialStock) {
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSubmit?.({
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      minStockAlert: Number.parseInt(formData.minStockAlert),
      bomLink: formData.bomLink || undefined,
      description: formData.description || undefined,
      initialStock: Number.parseInt(formData.initialStock),
    })

    // Reset form
    setFormData({
      name: "",
      category: "",
      unit: "",
      minStockAlert: "",
      bomLink: "",
      description: "",
      initialStock: "",
    })
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw-materials">Raw Materials</SelectItem>
                  <SelectItem value="components">Components</SelectItem>
                  <SelectItem value="assemblies">Assemblies</SelectItem>
                  <SelectItem value="finished-goods">Finished Goods</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="m">Meters (m)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                  <SelectItem value="l">Liters (l)</SelectItem>
                  <SelectItem value="gal">Gallons (gal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-stock">Initial Stock *</Label>
              <Input
                id="initial-stock"
                type="number"
                placeholder="0"
                value={formData.initialStock}
                onChange={(e) => handleInputChange("initialStock", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-stock">Min Stock Alert *</Label>
              <Input
                id="min-stock"
                type="number"
                placeholder="0"
                value={formData.minStockAlert}
                onChange={(e) => handleInputChange("minStockAlert", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bom-link">BOM Link</Label>
              <Input
                id="bom-link"
                placeholder="BOM-2024-001"
                value={formData.bomLink}
                onChange={(e) => handleInputChange("bomLink", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !formData.name ||
              !formData.category ||
              !formData.unit ||
              !formData.minStockAlert ||
              !formData.initialStock ||
              isSubmitting
            }
          >
            {isSubmitting ? "Adding..." : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
