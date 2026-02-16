// src/app/api/shadow-evals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { shadowEvalService } from '@/lib/services/shadow-eval.service';

/**
 * GET /api/shadow-evals/[id]
 * Get shadow evaluation results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { organizationId } = authResult;
    const { id } = await params;
    const shadowRunId = parseInt(id);

    if (isNaN(shadowRunId)) {
      return NextResponse.json({ error: 'Invalid shadow evaluation ID' }, { status: 400 });
    }

    const result = await shadowEvalService.getShadowEvalResults(organizationId, shadowRunId);

    if (!result) {
      return NextResponse.json({ error: 'Shadow evaluation not found' }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Shadow eval results error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
