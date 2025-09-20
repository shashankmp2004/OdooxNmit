import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { minStockAlert: { not: null } },
      include: {
        stockEntries: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const low = products
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        currentStock: p.stockEntries[0]?.balanceAfter ?? 0,
        minStockLevel: p.minStockAlert,
      }))
      .filter((p) => p.minStockLevel != null && p.currentStock <= p.minStockLevel)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 50);

    return NextResponse.json({ items: low });
  } catch (error) {
    console.error("Low stock list error:", error);
    return NextResponse.json({ error: "Failed to fetch low stock items" }, { status: 500 });
  }
}
