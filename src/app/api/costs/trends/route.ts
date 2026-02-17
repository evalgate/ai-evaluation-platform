import { NextRequest, NextResponse } from 'next/server';
import { costService } from '@/lib/services/cost.service';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { withRateLimit } from '@/lib/api-rate-limit';
import { logger } from '@/lib/logger';

/**
 * GET /api/costs/trends - Get cost trends over time
 * Uses authenticated user's organization (organizationId query param ignored)
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, async (req: NextRequest) => {
    try {
      const authResult = await requireAuthWithOrg(req);
      if (!authResult.authenticated) {
        const data = await authResult.response.json();
        return NextResponse.json(data, { status: authResult.response.status });
      }

      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Default to last 30 days if not specified
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const start = startDate || defaultStartDate.toISOString().split('T')[0];
      const end = endDate || now.toISOString().split('T')[0];

      const trends = await costService.getCostTrends(authResult.organizationId, start, end);

      return NextResponse.json({
        organizationId: authResult.organizationId,
        startDate: start,
        endDate: end,
        trends,
        summary: {
          totalCost: trends.reduce((sum, t) => sum + t.totalCost, 0),
          totalTokens: trends.reduce((sum, t) => sum + t.tokenCount, 0),
          totalRequests: trends.reduce((sum, t) => sum + t.requestCount, 0),
          avgDailyCost: trends.length > 0 
            ? trends.reduce((sum, t) => sum + t.totalCost, 0) / trends.length 
            : 0,
        },
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        },
      });
    } catch (error: any) {
      logger.error('Error fetching cost trends', {
        error: error.message,
        route: '/api/costs/trends',
        method: 'GET',
      });
      return NextResponse.json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }, { status: 500 });
    }
  }, { customTier: 'free' });
}
