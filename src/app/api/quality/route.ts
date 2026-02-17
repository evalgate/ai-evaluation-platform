/**
 * Quality Score API
 *
 * GET /api/quality?evaluationId=&action=latest  — latest score
 * GET /api/quality?evaluationId=&action=trend&model=&limit=20 — trend
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { qualityScores, evaluations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { validationError, notFound } from '@/lib/api/errors';
import { SCOPES } from '@/lib/auth/scopes';

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(req.url);
  const evaluationId = parseInt(searchParams.get('evaluationId') || '');
  const action = searchParams.get('action') || 'latest';

  if (isNaN(evaluationId)) {
    return validationError('evaluationId query parameter is required');
  }

  // Verify eval belongs to org
  const [evaluation] = await db
    .select()
    .from(evaluations)
    .where(and(eq(evaluations.id, evaluationId), eq(evaluations.organizationId, ctx.organizationId)))
    .limit(1);

  if (!evaluation) {
    return notFound('Evaluation not found');
  }

  if (action === 'latest') {
    const [latest] = await db
      .select()
      .from(qualityScores)
      .where(and(
        eq(qualityScores.evaluationId, evaluationId),
        eq(qualityScores.organizationId, ctx.organizationId),
      ))
      .orderBy(desc(qualityScores.createdAt))
      .limit(1);

    if (!latest) {
      return NextResponse.json({ score: null, message: 'No quality scores computed yet' });
    }

    // Check for regression against published baseline
    let regressionDelta: number | null = null;
    let baselineScore: number | null = null;

    if (evaluation.publishedRunId) {
      const [baseline] = await db
        .select()
        .from(qualityScores)
        .where(and(
          eq(qualityScores.evaluationRunId, evaluation.publishedRunId),
          eq(qualityScores.organizationId, ctx.organizationId),
        ))
        .limit(1);

      if (baseline) {
        baselineScore = baseline.score;
        regressionDelta = latest.score - baseline.score;
      }
    }

    return NextResponse.json({
      ...latest,
      baselineScore,
      regressionDelta,
      regressionDetected: regressionDelta !== null && regressionDelta <= -5,
    });
  }

  if (action === 'trend') {
    const model = searchParams.get('model') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const conditions = [
      eq(qualityScores.evaluationId, evaluationId),
      eq(qualityScores.organizationId, ctx.organizationId),
    ];

    if (model) {
      conditions.push(eq(qualityScores.model, model));
    }

    const trend = await db
      .select()
      .from(qualityScores)
      .where(and(...conditions))
      .orderBy(desc(qualityScores.createdAt))
      .limit(limit);

    return NextResponse.json({ data: trend.reverse(), count: trend.length });
  }

  return validationError('action must be "latest" or "trend"');
}, { requiredScopes: [SCOPES.RUNS_READ] });
