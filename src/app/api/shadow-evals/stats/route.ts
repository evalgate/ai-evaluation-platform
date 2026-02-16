// src/app/api/shadow-evals/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { shadowEvalService } from '@/lib/services/shadow-eval.service';

/**
 * GET /api/shadow-evals/stats
 * Get shadow evaluation statistics for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { organizationId } = authResult;

    const stats = await shadowEvalService.getShadowEvalStats(organizationId);

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Shadow eval stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
