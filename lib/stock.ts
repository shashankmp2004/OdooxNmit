import { prisma } from './prisma';
import { socketService } from './socket';

export interface StockOperation {
  productId: string;
  change: number; // positive for addition, negative for consumption
  sourceType: string;
  sourceId?: string;
  description?: string;
}

/**
 * Get current stock balance for a product
 */
export async function getCurrentStock(productId: string): Promise<number> {
  const lastEntry = await prisma.stockEntry.findFirst({
    where: { productId },
    orderBy: { createdAt: "desc" }
  });

  return lastEntry?.balanceAfter ?? 0;
}

/**
 * Get current stock for multiple products
 */
export async function getCurrentStockBatch(productIds: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  
  for (const productId of productIds) {
    result[productId] = await getCurrentStock(productId);
  }
  
  return result;
}

/**
 * Create a single stock entry with balance calculation
 */
export async function createStockEntry(operation: StockOperation, tx?: any): Promise<any> {
  const prismaClient = tx || prisma;
  
  const currentBalance = await getCurrentStock(operation.productId);
  const newBalance = currentBalance + operation.change;

  if (newBalance < 0) {
    throw new Error(`Insufficient stock for product ${operation.productId}. Available: ${currentBalance}, Required: ${Math.abs(operation.change)}`);
  }

  const stockEntry = prismaClient.stockEntry.create({
    data: {
      productId: operation.productId,
      change: operation.change,
      sourceType: operation.sourceType,
      sourceId: operation.sourceId,
      balanceAfter: newBalance
    }
  });

  // Check for low stock alert after creating entry
  const product = await prismaClient.product.findUnique({
    where: { id: operation.productId },
    select: { minStockLevel: true, name: true, sku: true }
  });

  if (product && product.minStockLevel && newBalance <= product.minStockLevel) {
    // Emit low stock alert if not in a transaction (to avoid double alerts)
    if (!tx) {
      socketService.emitLowStockAlert(operation.productId, {
        productName: product.name,
        sku: product.sku,
        currentStock: newBalance,
        minStockLevel: product.minStockLevel,
        operation: operation
      });
    }
  }

  return stockEntry;
}

/**
 * Process multiple stock operations atomically
 */
export async function processStockOperations(operations: StockOperation[]): Promise<any[]> {
  return prisma.$transaction(async (tx: any) => {
    const results: any[] = [];
    
    for (const operation of operations) {
      const result = await createStockEntry(operation, tx);
      results.push(result);
    }
    
    return results;
  });
}

/**
 * Consume materials for manufacturing order completion
 */
export async function consumeStockForMO(moId: string): Promise<{
  consumed: any[];
  produced: any;
  mo: any;
}> {
  return prisma.$transaction(async (tx: any) => {
    // Get MO with BOM snapshot
    const mo = await tx.manufacturingOrder.findUnique({
      where: { id: moId },
      include: { product: true }
    });

    if (!mo) {
      throw new Error("Manufacturing Order not found");
    }

    if (mo.state !== "IN_PROGRESS") {
      throw new Error("Manufacturing Order must be in progress to consume stock");
    }

    const bomSnapshot = mo.bomSnapshot as any[];
    if (!bomSnapshot || !Array.isArray(bomSnapshot)) {
      throw new Error("No BOM snapshot found for this Manufacturing Order");
    }

    const consumedEntries = [];

    // Process material consumption
    for (const component of bomSnapshot) {
      const requiredQty = component.qtyPerUnit * mo.quantity;
      const currentStock = await getCurrentStock(component.materialId);

      if (currentStock < requiredQty) {
        throw new Error(
          `Insufficient stock for ${component.materialName || component.materialId}. ` +
          `Required: ${requiredQty}, Available: ${currentStock}`
        );
      }

      const consumedEntry = await createStockEntry({
        productId: component.materialId,
        change: -requiredQty,
        sourceType: "MO_CONSUMPTION",
        sourceId: moId,
        description: `Consumed for MO ${mo.orderNo}`
      }, tx);

      consumedEntries.push(consumedEntry);
    }

    // Add finished goods to stock
    const producedEntry = await createStockEntry({
      productId: mo.productId,
      change: mo.quantity,
      sourceType: "MO_PRODUCTION",
      sourceId: moId,
      description: `Produced from MO ${mo.orderNo}`
    }, tx);

    // Mark MO as completed
    const updatedMO = await tx.manufacturingOrder.update({
      where: { id: moId },
      data: { state: "DONE" }
    });

    return {
      consumed: consumedEntries,
      produced: producedEntry,
      mo: updatedMO
    };
  });
}

/**
 * Manual stock adjustment (for inventory managers)
 */
export async function manualStockAdjustment(
  productId: string,
  adjustment: number,
  reason: string,
  userId: string
): Promise<any> {
  return createStockEntry({
    productId,
    change: adjustment,
    sourceType: "MANUAL_ADJUSTMENT",
    sourceId: userId,
    description: reason
  });
}

/**
 * Get stock history for a product
 */
export async function getStockHistory(
  productId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  return prisma.stockEntry.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      product: {
        select: { name: true, sku: true }
      }
    }
  });
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts(threshold: number = 10): Promise<any[]> {
  // Get all products with their latest stock entries
  const products = await prisma.product.findMany({
    where: { isFinished: false }, // Only check raw materials
    include: {
      stockEntries: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const lowStockItems = products
    .map((product: any) => ({
      ...product,
      currentStock: product.stockEntries[0]?.balanceAfter ?? 0
    }))
    .filter((product: any) => product.currentStock <= threshold)
    .sort((a: any, b: any) => a.currentStock - b.currentStock);

  return lowStockItems;
}

/**
 * Check material availability for MO
 */
export async function checkMaterialAvailability(moId: string): Promise<{
  canProduce: boolean;
  requirements: any[];
  shortages: any[];
}> {
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId }
  });

  if (!mo || !mo.bomSnapshot) {
    throw new Error("Manufacturing Order or BOM snapshot not found");
  }

  const bomSnapshot = mo.bomSnapshot as any[];
  const requirements = [];
  const shortages = [];

  for (const component of bomSnapshot) {
    const required = component.qtyPerUnit * mo.quantity;
    const available = await getCurrentStock(component.materialId);
    const shortage = Math.max(0, required - available);

    const requirement = {
      materialId: component.materialId,
      materialName: component.materialName || "Unknown",
      materialSku: component.materialSku,
      qtyPerUnit: component.qtyPerUnit,
      required,
      available,
      shortage
    };

    requirements.push(requirement);

    if (shortage > 0) {
      shortages.push(requirement);
    }
  }

  return {
    canProduce: shortages.length === 0,
    requirements,
    shortages
  };
}