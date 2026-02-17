import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testCases, evaluations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { notFound, validationError } from '@/lib/api/errors';
import { SCOPES } from '@/lib/auth/scopes';

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const evaluationId = parseInt(params.id);

  if (isNaN(evaluationId)) {
    return validationError('Valid evaluation ID is required');
  }

  // Verify evaluation exists and belongs to this org
  const evalData = await db.select()
    .from(evaluations)
    .where(eq(evaluations.id, evaluationId))
    .limit(1);

  if (evalData.length === 0 || evalData[0].organizationId !== ctx.organizationId) {
    return notFound('Evaluation not found');
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const cases = await db.select()
    .from(testCases)
    .where(eq(testCases.evaluationId, evaluationId))
    .orderBy(desc(testCases.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(cases);
}, { requiredScopes: [SCOPES.EVAL_READ] });

export const POST = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const evaluationId = parseInt(params.id);

  if (isNaN(evaluationId)) {
    return validationError('Valid evaluation ID is required');
  }

  // Verify evaluation exists and belongs to this org
  const evalData = await db.select()
    .from(evaluations)
    .where(eq(evaluations.id, evaluationId))
    .limit(1);

  if (evalData.length === 0 || evalData[0].organizationId !== ctx.organizationId) {
    return notFound('Evaluation not found');
  }

  const body = await req.json();
  const { name, input, expectedOutput, metadata } = body;

  if (!input) {
    return validationError('Input is required');
  }

  const now = new Date().toISOString();
  const newTestCase = await db.insert(testCases)
    .values({
      evaluationId,
      name: name || `Test Case ${Date.now()}`,
      input: input.trim(),
      expectedOutput: expectedOutput?.trim() || null,
      metadata: metadata || null,
      createdAt: now,
    })
    .returning();

  return NextResponse.json(newTestCase[0], { status: 201 });
}, { requiredScopes: [SCOPES.EVAL_WRITE] });

export const DELETE = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const evaluationId = parseInt(params.id);

  // Verify evaluation exists and belongs to this org
  const evalData = await db.select()
    .from(evaluations)
    .where(eq(evaluations.id, evaluationId))
    .limit(1);

  if (evalData.length === 0 || evalData[0].organizationId !== ctx.organizationId) {
    return notFound('Evaluation not found');
  }

  const { searchParams } = new URL(req.url);
  const testCaseId = searchParams.get('testCaseId');

  if (!testCaseId || isNaN(parseInt(testCaseId))) {
    return validationError('Valid test case ID is required');
  }

  const existing = await db.select()
    .from(testCases)
    .where(eq(testCases.id, parseInt(testCaseId)))
    .limit(1);

  if (existing.length === 0) {
    return notFound('Test case not found');
  }

  await db.delete(testCases)
    .where(eq(testCases.id, parseInt(testCaseId)));

  return NextResponse.json({ message: 'Test case deleted successfully' });
}, { requiredScopes: [SCOPES.EVAL_WRITE] });
