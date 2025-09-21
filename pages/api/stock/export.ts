import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import XLSX from "xlsx";

function statusFromStock(current: number, min?: number) {
  if (current <= 0) return "Out of Stock";
  if (typeof min === "number" && current < min) return "Low Stock";
  return "In Stock";
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const search = (req.query.search as string) || undefined;
  const category = (req.query.category as string) || undefined; // 'all' or specific
  const lowOnly = (req.query.low as string) === "1" || (req.query.low as string) === "true";
  const defaultLowThreshold = 10; // fallback when product.minStockAlert is null

  // Pull recent entries (you may remove take to export all)
  const entries = await prisma.stockEntry.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          unit: true,
          minStockAlert: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter entries by search/category first for the Entries sheet
  let filteredEntries = entries;
  if (search) {
    const s = search.toLowerCase();
    filteredEntries = filteredEntries.filter((e: any) =>
      e.product.name.toLowerCase().includes(s) || (e.reference?.toLowerCase().includes(s))
    );
  }
  if (category && category !== "all") {
    filteredEntries = filteredEntries.filter((e: any) => e.product.category === category);
  }

  // Build stock summary map using the (potentially) filtered set for consistency
  type Summary = {
    productId: string;
    productName: string;
    category: string | null;
    unit: string | null;
    currentStock: number;
    totalIn: number;
    totalOut: number;
    lastUpdated: Date;
    minStockAlert?: number | null;
  };

  const summaryMap = new Map<string, Summary>();
  for (const e of filteredEntries) {
    const id = e.product.id;
    let row = summaryMap.get(id);
    if (!row) {
      row = {
        productId: id,
        productName: e.product.name,
        category: e.product.category ?? null,
        unit: e.product.unit ?? null,
        currentStock: 0,
        totalIn: 0,
        totalOut: 0,
        lastUpdated: e.createdAt,
        minStockAlert: e.product.minStockAlert ?? null,
      };
      summaryMap.set(id, row);
    }

    // Update current stock using balanceAfter if available; otherwise use change
    row.currentStock =
      typeof e.balanceAfter === "number" ? e.balanceAfter : row.currentStock + (e.change ?? 0);
    if (e.type === "IN") row.totalIn += e.quantity as number;
    if (e.type === "OUT") row.totalOut += e.quantity as number;
    if (e.createdAt > row.lastUpdated) row.lastUpdated = e.createdAt;
  }

  let summary: Summary[] = Array.from(summaryMap.values());

  // Apply lowOnly on summary
  if (lowOnly) {
    summary = summary.filter((s) => {
      const min = typeof s.minStockAlert === "number" ? s.minStockAlert : defaultLowThreshold;
      return s.currentStock < min;
    });

    // Also constrain entries to only these productIds
  const allowed = new Set(summary.map((s) => s.productId));
  filteredEntries = filteredEntries.filter((e: typeof entries[number]) => allowed.has(e.product.id));
  }

  // Prepare workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet rows
  const summaryRows = summary.map((s) => ({
    Product: s.productName,
    Category: s.category ?? "",
    Unit: s.unit ?? "",
    "Current Stock": s.currentStock,
    "Total In": s.totalIn,
    "Total Out": s.totalOut,
    "Min Stock Alert": typeof s.minStockAlert === "number" ? s.minStockAlert : "",
    Status: statusFromStock(s.currentStock, s.minStockAlert ?? undefined),
    "Last Updated": s.lastUpdated ? new Date(s.lastUpdated).toISOString() : "",
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Entries sheet rows
  const entriesRows = filteredEntries.map((e: typeof entries[number]) => ({
    Product: e.product.name,
    Category: e.product.category ?? "",
    Type: e.type,
    Quantity: e.quantity,
    Unit: e.product.unit ?? "",
    Reference: e.reference ?? "",
    Notes: e.notes ?? "",
    Date: e.createdAt ? new Date(e.createdAt).toISOString() : "",
  }));
  const wsEntries = XLSX.utils.json_to_sheet(entriesRows);
  XLSX.utils.book_append_sheet(wb, wsEntries, "Entries");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="stock-ledger-${Date.now()}.xlsx"`
  );
  return res.status(200).send(buf);
}

export default requireRole(["ADMIN", "MANAGER", "INVENTORY"], handler);
