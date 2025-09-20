"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WorkCenter {
  id: string
  name: string
  description?: string
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE'
  capacity?: number
  costPerHour?: number
}

interface EditWorkCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workCenter: WorkCenter
  onWorkCenterUpdated: () => void
}

export function EditWorkCenterDialog({ 
  open, 
  onOpenChange, 
  workCenter,
  onWorkCenterUpdated 
}: EditWorkCenterDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    costPerHour: "",
    status: "AVAILABLE"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (workCenter) {
      setFormData({
        name: workCenter.name,
        description: workCenter.description || "",
        capacity: workCenter.capacity ? workCenter.capacity.toString() : "",
        costPerHour: workCenter.costPerHour ? workCenter.costPerHour.toString() : "",
        status: workCenter.status
      })
    }
  }, [workCenter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      setError("Work center name is required")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/work-centers/${workCenter.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          costPerHour: formData.costPerHour ? parseFloat(formData.costPerHour) : null,
          status: formData.status
        }),
      })

      if (response.ok) {
        onWorkCenterUpdated()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update work center")
      }
    } catch (err) {
      setError("Error updating work center")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Work Center</DialogTitle>
          <DialogDescription>
            Update work center settings and status.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Assembly Line 1"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the work center"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (units/hour)</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="10"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerHour">Cost per Hour ($)</Label>
              <Input
                id="costPerHour"
                type="number"
                step="0.01"
                placeholder="25.00"
                value={formData.costPerHour}
                onChange={(e) => handleInputChange("costPerHour", e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="BUSY">Busy</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Work Center"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}