import { NextRequest, NextResponse } from 'next/server';
import { costService } from '@/lib/services/cost.service';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { withRateLimit } from '@/lib/api-rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createCostRecordSchema = z.object({
  spanId: z.number().int().positive(),
  workflowRunId: z.number().int().positive().optional(),
  provider: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  category: z.enum(['llm', 'tool', 'embedding', 'other']).optional(),
  isRetry: z.boolean().optional(),
  retryNumber: z.number().int().nonnegative().optional(),
});

/**
 * GET /api/costs - List cost records or get breakdown
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
      const workflowRunId = searchParams.get('workflowRunId');
      const traceId = searchParams.get('traceId');
      const breakdown = searchParams.get('breakdown') === 'true';

      // Get breakdown for a workflow run
      if (workflowRunId) {
        const id = parseInt(workflowRunId);
        if (isNaN(id)) {
          return NextResponse.json({
            error: 'Valid workflow run ID is required',
            code: 'INVALID_ID',
          }, { status: 400 });
        }

        if (breakdown) {
          const result = await costService.aggregateWorkflowCost(id);
          return NextResponse.json(result);
        }

        const records = await costService.listByWorkflowRun(id);
        return NextResponse.json(records);
      }

      // Get breakdown for a trace
      if (traceId) {
        const id = parseInt(traceId);
        if (isNaN(id)) {
          return NextResponse.json({
            error: 'Valid trace ID is required',
            code: 'INVALID_ID',
          }, { status: 400 });
        }

        const result = await costService.getCostBreakdownByTrace(id);
        return NextResponse.json(result);
      }

      // Get organization cost summary (always use auth org)
      const summary = await costService.getOrganizationCostSummary(authResult.organizationId);
      return NextResponse.json(summary);
    } catch (error: any) {
      logger.error('Error fetching costs', {
        error: error.message,
        route: '/api/costs',
        method: 'GET',
      });
      return NextResponse.json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }, { status: 500 });
    }
  }, { customTier: 'free' });
}

/**
 * POST /api/costs - Create a new cost record
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, async (req: NextRequest) => {
    try {
      const body = await req.json();

      // Validate request body
      const validation = createCostRecordSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        }, { status: 400 });
      }

      const authResult = await requireAuthWithOrg(req);
      if (!authResult.authenticated) {
        const data = await authResult.response.json();
        return NextResponse.json(data, { status: authResult.response.status });
      }

      const record = await costService.createRecord({
        ...validation.data,
        organizationId: authResult.organizationId,
      });

      logger.info('Cost record created', {
        recordId: record.id,
        provider: validation.data.provider,
        model: validation.data.model,
        totalCost: record.totalCost,
      });

      return NextResponse.json(record, { status: 201 });
    } catch (error: any) {
      logger.error('Error creating cost record', {
        error: error.message,
        route: '/api/costs',
        method: 'POST',
      });
      return NextResponse.json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }, { status: 500 });
    }
  }, { customTier: 'free' });
}
