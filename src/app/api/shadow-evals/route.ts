// src/app/api/shadow-evals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { shadowEvalService } from '@/lib/services/shadow-eval.service';
import { z } from 'zod';

const createShadowEvalSchema = z.object({
  evaluationId: z.number(),
  traceIds: z.array(z.string()),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  filters: z.object({
    status: z.array(z.string()).optional(),
    duration: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
});

/**
 * POST /api/shadow-evals
 * Create a new shadow evaluation against production traces
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { userId, organizationId } = authResult;
    const body = await request.json();
    const parsed = createShadowEvalSchema.parse(body);

    const result = await shadowEvalService.createShadowEval(
      organizationId,
      parsed,
      userId
    );

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Shadow eval creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
