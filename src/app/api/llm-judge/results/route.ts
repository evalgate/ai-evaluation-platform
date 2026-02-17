import { NextRequest, NextResponse } from 'next/server';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { db } from '@/db';
import { llmJudgeResults, llmJudgeConfigs } from '@/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * GET /api/llm-judge/results - Fetch LLM judge results scoped to the user's organization
 */
export const GET = secureRoute(async (
  request: NextRequest,
  ctx: AuthContext,
) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const configId = searchParams.get('configId');
  const minScore = searchParams.get('minScore');
  const maxScore = searchParams.get('maxScore');

  // Build filter conditions — always scope to organization via llmJudgeConfigs
  const conditions = [
    eq(llmJudgeConfigs.organizationId, ctx.organizationId),
  ];

  if (configId) {
    conditions.push(eq(llmJudgeResults.configId, parseInt(configId)));
  }

  if (minScore) {
    conditions.push(gte(llmJudgeResults.score, parseInt(minScore)));
  }

  if (maxScore) {
    conditions.push(lte(llmJudgeResults.score, parseInt(maxScore)));
  }

  // Join through llmJudgeConfigs to enforce org-scoping
  const results = await db
    .select({
      id: llmJudgeResults.id,
      configId: llmJudgeResults.configId,
      evaluationRunId: llmJudgeResults.evaluationRunId,
      testCaseId: llmJudgeResults.testCaseId,
      input: llmJudgeResults.input,
      output: llmJudgeResults.output,
      score: llmJudgeResults.score,
      reasoning: llmJudgeResults.reasoning,
      metadata: llmJudgeResults.metadata,
      createdAt: llmJudgeResults.createdAt,
    })
    .from(llmJudgeResults)
    .innerJoin(llmJudgeConfigs, eq(llmJudgeResults.configId, llmJudgeConfigs.id))
    .where(and(...conditions))
    .orderBy(desc(llmJudgeResults.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(results);
}, { rateLimit: 'free' });
