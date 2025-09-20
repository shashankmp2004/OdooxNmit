import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Clock, DollarSign, Users } from "lucide-react"

interface BOMComponent {
  id: string
  name: string
  quantity: number
  unit: string
  cost?: number
}

interface BOMPreviewProps {
  finishedProduct: string
  components: BOMComponent[]
  workOrders: string[]
  estimatedTime: number
  estimatedCost: number
}

export function BOMPreview({ finishedProduct, components, workOrders, estimatedTime, estimatedCost }: BOMPreviewProps) {
  const totalCost = components.reduce((sum, comp) => sum + (comp.cost || 0) * comp.quantity, 0)
  const validComponents = components.filter((comp) => comp.name && comp.quantity > 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5" />
          BOM Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Finished Product */}
        <div>
          <h4 className="font-medium text-foreground mb-2">Finished Product</h4>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
            {finishedProduct || "Not selected"}
          </Badge>
        </div>

        <Separator />

        {/* Components */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Components ({validComponents.length})</h4>
          <div className="space-y-2">
            {validComponents.length > 0 ? (
              validComponents.map((component) => (
                <div key={component.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium text-foreground">{component.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {component.quantity} {component.unit}
                    </span>
                  </div>
                  {component.cost && (
                    <span className="text-sm text-muted-foreground">
                      ${(component.cost * component.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No components added yet</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Work Orders */}
        <div>
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Attached Work Orders ({workOrders.length})
          </h4>
          <div className="space-y-1">
            {workOrders.length > 0 ? (
              workOrders.map((workOrder) => (
                <Badge key={workOrder} variant="outline" className="mr-2 mb-1">
                  {workOrder}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No work orders attached</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="font-medium text-foreground">{estimatedTime || 0} hours</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Material Cost</p>
              <p className="font-medium text-foreground">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {estimatedCost > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total Estimated Cost</span>
              <span className="text-lg font-bold text-primary">${estimatedCost.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
