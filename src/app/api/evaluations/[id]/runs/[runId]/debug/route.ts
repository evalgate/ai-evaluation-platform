// src/app/api/evaluations/[id]/runs/[runId]/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { debugAgentService } from '@/lib/services/debug-agent.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { id, runId } = await params;
  const evaluationId = parseInt(id);
  const runIdNum = parseInt(runId);

  try {
    const analysis = await debugAgentService.analyze(
      evaluationId,
      runIdNum,
      authResult.organizationId
    );
    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
