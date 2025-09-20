import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import XLSX from "xlsx";
// pdfkit types are not bundled; we'll require at runtime to avoid TS type issues

type Format = "excel" | "pdf";

function mapProductsForExport(products: any[]) {
  return products.map((p) => ({
    ID: p.id,
    SKU: p.sku ?? "",
    Name: p.name,
    Category: p.category ?? "",
    Unit: p.unit ?? "",
    Price: p.price ?? "",
    Stock: p.stockEntries?.[0]?.balanceAfter ?? 0,
    MinStockAlert: p.minStockAlert ?? "",
    BOM: p.bomLink ?? "",
    IsFinished: p.isFinished ? "Yes" : "No",
    CreatedAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
    UpdatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
  }));
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const format = ((req.query.format as string) || "excel").toLowerCase() as Format;
  const search = (req.query.search as string) || undefined;
  const category = (req.query.category as string) || undefined;
  const isFinishedParam = req.query.isFinished as string | undefined;
  const isFinished =
    typeof isFinishedParam === "string" ? isFinishedParam === "true" : undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (typeof isFinished === "boolean") {
    where.isFinished = isFinished;
  }
  if (category && category !== "all") {
    where.category = category;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      stockEntries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { balanceAfter: true },
      },
    },
  });

  const rows = mapProductsForExport(products);

  if (format === "excel") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="products-${Date.now()}.xlsx"`
    );
    return res.status(200).send(buf);
  }

  // PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="products-${Date.now()}.pdf"`
  );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument: any = require("pdfkit");
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(18).text("Products Export", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generated at: ${new Date().toLocaleString()}`);
  doc.moveDown();

  const headers = [
    "SKU",
    "Name",
    "Category",
    "Unit",
    "Price",
    "Stock",
    "MinAlert",
    "Finished",
  ];
  const colWidths = [60, 140, 80, 40, 50, 45, 55, 55];

  const startX = doc.x;
  let y = doc.y;

  // Header row
  headers.forEach((h, i) => {
    const w = colWidths[i];
    doc.font("Helvetica-Bold").text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
      width: w,
    });
  });
  y += 16;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
  y += 6;

  // Rows
  for (const r of rows) {
    const rowVals = [
      r.SKU,
      r.Name,
      r.Category,
      r.Unit,
      r.Price === "" ? "" : String(r.Price),
      String(r.Stock ?? 0),
      r.MinStockAlert === "" ? "" : String(r.MinStockAlert),
      r.IsFinished,
    ];
    rowVals.forEach((val, i) => {
      const w = colWidths[i];
      doc.font("Helvetica").text(String(val), startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: w,
      });
    });
    y += 16;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
    }
  }

  doc.end();
}

export default requireRole(["ADMIN", "MANAGER"], handler);