import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { spans, traces, evaluationRuns } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { notFound, validationError, forbidden } from '@/lib/api/errors';
import { SCOPES } from '@/lib/auth/scopes';
import { sha256Input } from '@/lib/utils/input-hash';

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const traceId = parseInt(params.id);

  if (isNaN(traceId)) {
    return validationError('Valid trace ID is required');
  }

  // Verify trace exists and belongs to this org
  const traceData = await db.select()
    .from(traces)
    .where(eq(traces.id, traceId))
    .limit(1);

  if (traceData.length === 0 || traceData[0].organizationId !== ctx.organizationId) {
    return notFound('Trace not found');
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');

  const result = await db.select()
    .from(spans)
    .where(eq(spans.traceId, traceId))
    .orderBy(asc(spans.startTime))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(result);
}, { requiredScopes: [SCOPES.TRACES_READ] });

export const POST = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const traceId = parseInt(params.id);

  if (isNaN(traceId)) {
    return validationError('Valid trace ID is required');
  }

  // Trace ownership check (tenant boundary): reject if trace not in org
  const [trace] = await db
    .select({ id: traces.id })
    .from(traces)
    .where(and(eq(traces.id, traceId), eq(traces.organizationId, ctx.organizationId)))
    .limit(1);

  if (!trace) return forbidden('TRACE_NOT_IN_ORG');

  const body = await req.json();
  const { spanId, name, type, parentSpanId, input, output, durationMs, startTime, endTime, metadata, evaluationRunId } = body;

  if (!spanId || !name || !type) {
    return validationError('spanId, name, and type are required');
  }

  // Verify run belongs to org if evaluationRunId provided
  if (evaluationRunId != null) {
    const [run] = await db
      .select()
      .from(evaluationRuns)
      .where(and(
        eq(evaluationRuns.id, evaluationRunId),
        eq(evaluationRuns.organizationId, ctx.organizationId),
      ))
      .limit(1);
    if (!run) return forbidden('Run not in organization');
  }

  const now = new Date().toISOString();
  const inputStr = typeof input === 'string' ? input : input != null ? JSON.stringify(input) : null;
  const inputHash = inputStr ? sha256Input(inputStr) : null;

  const newSpan = await db.insert(spans)
    .values({
      traceId,
      spanId: spanId.trim(),
      parentSpanId: parentSpanId?.trim() || null,
      name: name.trim(),
      type: type.trim(),
      startTime: startTime || now,
      endTime: endTime || null,
      input: inputStr,
      inputHash,
      output: output || null,
      durationMs: durationMs || null,
      metadata: metadata || null,
      evaluationRunId: evaluationRunId ?? null,
      createdAt: now,
    })
    .returning();

  return NextResponse.json(newSpan[0], { status: 201 });
}, { requiredScopes: [SCOPES.TRACES_WRITE] });
