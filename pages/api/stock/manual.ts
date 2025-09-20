import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { manualStockAdjustment } from '../../../lib/stock';
import { socketService } from '../../../lib/socket';
import { z } from 'zod';

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  change: z.number().int('Change must be an integer'),
  reason: z.string().min(1, 'Reason is required')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = adjustmentSchema.parse(req.body);
      
      // Get user ID from session (would be set by requireAuth middleware)
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const stockEntry = await manualStockAdjustment(
        data.productId,
        data.change,
        data.reason,
        userId
      );

      // Emit real-time stock update
      socketService.emitStockUpdate(data.productId, {
        type: 'manual_adjustment',
        change: data.change,
        reason: data.reason,
        newBalance: stockEntry.balanceAfter,
        adjustedBy: (req as any).user?.name,
        stockEntry
      });

      return res.status(201).json({
        message: 'Stock adjustment completed successfully',
        stockEntry
      });

    } catch (error) {
      console.error('Manual stock adjustment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);