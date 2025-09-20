import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { getCurrentStock } from '../../../lib/stock';
import { prisma } from '../../../lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Valid product ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Get current stock level
      const currentStock = await getCurrentStock(productId);

      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          minStockLevel: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get recent stock transactions (last 10)
      const recentTransactions = await prisma.stockEntry.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          change: true,
          sourceType: true,
          sourceId: true,
          balanceAfter: true,
          createdAt: true
        }
      });

      return res.json({
        product,
        currentStock,
        isLowStock: currentStock <= (product.minStockLevel || 0),
        recentTransactions
      });

    } catch (error) {
      console.error('Product stock API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);