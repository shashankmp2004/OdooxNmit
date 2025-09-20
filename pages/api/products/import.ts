import { requireRole } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // we'll handle multipart ourselves via multer
  },
};

const upload = multer({ storage: multer.memoryStorage() });

const rowSchema = z.object({
  SKU: z.string().optional(),
  Name: z.string().min(1),
  Description: z.string().optional(),
  Category: z.string().optional(),
  Unit: z.string().optional(),
  Price: z.union([z.number(), z.string()]).optional(),
  Stock: z.union([z.number(), z.string()]).optional(),
  MinStockAlert: z.union([z.number(), z.string()]).optional(),
  BOM: z.string().optional(),
  IsFinished: z.union([z.boolean(), z.string()]).optional(),
});

function parseBoolean(val: any): boolean | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "boolean") return val;
  const s = String(val).trim().toLowerCase();
  if (["yes", "true", "1"].includes(s)) return true;
  if (["no", "false", "0"].includes(s)) return false;
  return undefined;
}

function parseNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(val);
  return isNaN(n) ? undefined : n;
}

function runMulter(req: NextApiRequest, res: NextApiResponse): Promise<Express.Multer.File[]> {
  return new Promise((resolve, reject) => {
    upload.array("file")(req as any, res as any, (err: any) => {
      if (err) return reject(err);
      const files = (req as any).files as Express.Multer.File[];
      resolve(files);
    });
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const files = await runMulter(req, res);
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No file uploaded. Use 'file' field." });
  }

  const file = files[0];
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (!allowed.includes(file.mimetype)) {
    return res.status(400).json({ error: `Unsupported file type: ${file.mimetype}` });
  }
  try {
    const wb = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rowsRaw = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const results: any[] = [];
  let created = 0;
  let updated = 0;
    let skipped = 0;

    for (const [idx, raw] of (rowsRaw as any[]).entries()) {
      const parsed = rowSchema.safeParse(raw);
      if (!parsed.success) {
        results.push({ row: idx + 2, status: "error", error: parsed.error.flatten() });
        skipped++;
        continue;
      }
      const r = parsed.data;

      const data: any = {
        name: r.Name,
        description: r.Description || undefined,
        category: r.Category || undefined,
        unit: r.Unit || undefined,
        price: parseNumber(r.Price),
        minStockAlert: parseNumber(r.MinStockAlert),
        bomLink: r.BOM || undefined,
        isFinished: parseBoolean(r.IsFinished) ?? false,
        sku: r.SKU || undefined,
      };

      // Upsert by SKU if provided; else create new
      try {
        let product;
        const initialStock = parseNumber(r.Stock);
        if (data.sku) {
          const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
          if (existing) {
            product = await prisma.product.update({ where: { sku: data.sku }, data });
            updated++;
            // Do not overwrite stock for existing products; ledger owns the truth
          } else {
            product = await prisma.product.create({ data });
            created++;
            // If initial stock provided, create a stock entry once for new product
            if (initialStock && initialStock > 0) {
              await prisma.stockEntry.create({
                data: {
                  productId: product.id,
                  type: 'IN' as any,
                  quantity: initialStock,
                  change: initialStock,
                  sourceType: 'IMPORT',
                  reference: 'INITIAL_STOCK',
                  balanceAfter: initialStock,
                }
              });
            }
          }
        } else {
          product = await prisma.product.create({ data });
          created++;
          const initialStock = parseNumber(r.Stock);
          if (initialStock && initialStock > 0) {
            await prisma.stockEntry.create({
              data: {
                productId: product.id,
                type: 'IN' as any,
                quantity: initialStock,
                change: initialStock,
                sourceType: 'IMPORT',
                reference: 'INITIAL_STOCK',
                balanceAfter: initialStock,
              }
            });
          }
        }
        results.push({ row: idx + 2, status: "ok", id: product.id });
      } catch (e: any) {
        results.push({ row: idx + 2, status: "error", error: e?.message || String(e) });
        skipped++;
      }
    }

    return res.status(200).json({ summary: { created, updated, skipped, total: rowsRaw.length }, results });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to parse Excel" });
  }
}

export default requireRole(["ADMIN", "MANAGER", "INVENTORY"], handler);
