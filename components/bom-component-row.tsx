"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"

interface BOMComponent {
  id: string
  name: string
  quantity: number
  unit: string
  cost?: number
}

interface BOMComponentRowProps {
  component: BOMComponent
  onUpdate: (id: string, field: keyof BOMComponent, value: string | number) => void
  onRemove: (id: string) => void
  availableComponents: Array<{id: string, name: string, sku: string}>
}

export function BOMComponentRow({ component, onUpdate, onRemove, availableComponents }: BOMComponentRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 items-center p-4 bg-muted/30 rounded-lg border border-border">
      <div className="col-span-4">
        <Select value={component.name} onValueChange={(value) => onUpdate(component.id, "name", value)}>
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select component" />
          </SelectTrigger>
          <SelectContent>
            {availableComponents.map((comp) => (
              <SelectItem key={comp.id} value={comp.name}>
                {comp.name} ({comp.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Quantity"
          value={component.quantity || ""}
          onChange={(e) => onUpdate(component.id, "quantity", Number.parseFloat(e.target.value) || 0)}
          className="bg-background border-input"
        />
      </div>

      <div className="col-span-2">
        <Select value={component.unit} onValueChange={(value) => onUpdate(component.id, "unit", value)}>
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pcs">Pieces</SelectItem>
            <SelectItem value="kg">Kilograms</SelectItem>
            <SelectItem value="lbs">Pounds</SelectItem>
            <SelectItem value="m">Meters</SelectItem>
            <SelectItem value="ft">Feet</SelectItem>
            <SelectItem value="l">Liters</SelectItem>
            <SelectItem value="gal">Gallons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Cost ($)"
          value={component.cost || ""}
          onChange={(e) => onUpdate(component.id, "cost", Number.parseFloat(e.target.value) || 0)}
          className="bg-background border-input"
        />
      </div>

      <div className="col-span-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(component.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
