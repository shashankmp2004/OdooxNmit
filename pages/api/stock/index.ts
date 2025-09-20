import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { getCurrentStock, getLowStockAlerts } from '../../../lib/stock';
import { z } from 'zod';

const stockQuerySchema = z.object({
  productId: z.string().optional(),
  lowStockThreshold: z.string().optional().transform(val => val ? parseInt(val) : 10)
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

      // Get low stock alerts
      const lowStockItems = await getLowStockAlerts(query.lowStockThreshold);
      return res.json({ lowStockItems, threshold: query.lowStockThreshold });

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