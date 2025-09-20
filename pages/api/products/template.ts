import { requireRole } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import XLSX from "xlsx";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const headers = [
    'SKU',
    'Name',
    'Description',
    'Category',
    'Unit',
    'Price',
    'Stock',
    'MinStockAlert',
    'BOM',
    'IsFinished'
  ];

  const sampleRow = [
    'PROD-001',
    'Sample Product',
    'Optional description',
    'Raw Material',
    'pcs',
    12.5,
    100,
    10,
    'optional-ref',
    'Yes'
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  ws['!cols'] = [
    { wch: 12 },{ wch: 24 },{ wch: 30 },{ wch: 16 },{ wch: 8 },{ wch: 10 },{ wch: 10 },{ wch: 14 },{ wch: 16 },{ wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const instructions = [
    ['Products Import Template'],
    [''],
    ['Instructions:'],
    ['1. Keep header row as-is. Fill data starting row 2.'],
    ['2. Name is required. Other fields are optional unless your process requires them.'],
    ['3. Category allowed values: Raw Material, Component, Finished Good, Consumable'],
    ['4. Unit suggestions: pcs, kg, ltr, m, sqm, cum'],
    ['5. IsFinished accepts Yes/No, True/False, 1/0'],
    ['6. Price/Stock/MinStockAlert must be numbers.'],
    ['7. Stock behavior: If SKU exists, Stock is ignored; stock is managed by ledger.'],
    ['   For new products, Stock > 0 will create a single INITIAL_STOCK entry.'],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(instructions);
  wsInfo['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions');
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
  `attachment; filename="products-import-template.xlsx"`
  );
  return res.status(200).send(buf);
}

export default requireRole(["ADMIN", "MANAGER", "INVENTORY"], handler);
