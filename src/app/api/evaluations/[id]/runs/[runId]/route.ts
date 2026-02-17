import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { evaluationRuns, evaluations, testResults, testCases } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { notFound } from '@/lib/api/errors';
import { SCOPES } from '@/lib/auth/scopes';

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const evaluationId = parseInt(params.id);
  const runId = parseInt(params.runId);

  // Verify the evaluation exists and belongs to this org
  const evalData = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, evaluationId))
    .limit(1);

  if (evalData.length === 0 || evalData[0].organizationId !== ctx.organizationId) {
    return notFound('Evaluation not found');
  }

  // Fetch run
  const runData = await db
    .select()
    .from(evaluationRuns)
    .where(eq(evaluationRuns.id, runId))
    .limit(1);

  if (runData.length === 0) {
    return notFound('Run not found');
  }

  // Fetch test results for this run with test case details
  const results = await db
    .select({
      result: testResults,
      testCase: {
        name: testCases.name,
        input: testCases.input,
        expectedOutput: testCases.expectedOutput,
      }
    })
    .from(testResults)
    .leftJoin(testCases, eq(testResults.testCaseId, testCases.id))
    .where(eq(testResults.evaluationRunId, runId))
    .orderBy(asc(testResults.createdAt));

  const formattedResults = results.map(r => ({
    ...r.result,
    test_cases: r.testCase,
  }));

  return NextResponse.json({ run: runData[0], results: formattedResults });
}, { requiredScopes: [SCOPES.RUNS_READ] });
