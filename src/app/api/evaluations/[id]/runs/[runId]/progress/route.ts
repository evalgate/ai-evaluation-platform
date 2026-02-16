// src/app/api/evaluations/[id]/runs/[runId]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { evaluationRuns, evaluations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthWithOrg } from '@/lib/autumn-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { id, runId } = await params;
    const evaluationId = parseInt(id);
    const evalRunId = parseInt(runId);

    // Verify ownership of evaluation and run
    const [run] = await db
      .select()
      .from(evaluationRuns)
      .innerJoin(evaluations, eq(evaluationRuns.evaluationId, evaluations.id))
      .where(and(
        eq(evaluationRuns.id, evalRunId),
        eq(evaluations.id, evaluationId),
        eq(evaluations.organizationId, authResult.organizationId)
      ))
      .limit(1);

    if (!run) {
      return NextResponse.json({ error: 'Evaluation run not found' }, { status: 404 });
    }

    // Extract heartbeat data from traceLog if available
    let heartbeatData = [];
    let lastMessage = '';
    
    if (run.evaluation_runs.traceLog) {
      try {
        const traceLog = JSON.parse(run.evaluation_runs.traceLog as string);
        heartbeatData = traceLog.heartbeat || [];
        lastMessage = heartbeatData[heartbeatData.length - 1]?.message || '';
      } catch (error) {
        console.warn('Failed to parse traceLog for heartbeat data:', error);
      }
    }

    // Return progress information
    const totalCases = run.evaluation_runs.totalCases ?? 0;
    const processedCount = run.evaluation_runs.processedCount ?? 0;
    const startedAt = run.evaluation_runs.startedAt ?? '';

    const progress = {
      runId: evalRunId,
      status: run.evaluation_runs.status,
      totalCases,
      processedCount,
      passedCases: run.evaluation_runs.passedCases,
      failedCases: run.evaluation_runs.failedCases,
      startedAt,
      completedAt: run.evaluation_runs.completedAt,
      percentage: totalCases > 0
        ? Math.round((processedCount / totalCases) * 100)
        : 0,
      heartbeat: {
        lastMessage,
        count: heartbeatData.length,
        entries: heartbeatData.slice(-5),
      },
      estimatedTimeRemaining: processedCount > 0 && totalCases > processedCount && startedAt
        ? Math.round(
            ((totalCases - processedCount) / processedCount) *
            (Date.now() - new Date(startedAt).getTime()) / 1000
          )
        : null,
    };

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Progress endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
