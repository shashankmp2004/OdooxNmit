import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { getCurrentStock, getLowStockAlerts } from '../../../lib/stock';
import { prisma } from "@/lib/prisma";
import { z } from 'zod';

const stockQuerySchema = z.object({
  productId: z.string().optional(),
  lowStockThreshold: z.string().optional().transform(val => val ? parseInt(val) : 10),
  category: z.string().optional(),
  search: z.string().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const query = stockQuerySchema.parse(req.query);

      // Get current stock for specific product
      if (query.productId) {
        const stock = await getCurrentStock(query.productId);
        return res.json({ productId: query.productId, currentStock: stock });
      }

      // Get all stock entries for frontend compatibility
      const stockEntries = await prisma.stockEntry.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              unit: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100 // Limit to recent entries
      });

      // Filter by search term if provided
      let filteredEntries = stockEntries;
      if (query.search) {
        filteredEntries = stockEntries.filter((entry: any) => 
          entry.product.name.toLowerCase().includes(query.search!.toLowerCase()) ||
          (entry.reference && entry.reference.toLowerCase().includes(query.search!.toLowerCase()))
        );
      }

      // Filter by category if provided
      if (query.category && query.category !== "all") {
        filteredEntries = filteredEntries.filter((entry: any) => 
          entry.product.category === query.category
        );
      }

      return res.json(filteredEntries);

    } catch (error) {
      console.error('Stock API error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request parameters', details: error.errors });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);