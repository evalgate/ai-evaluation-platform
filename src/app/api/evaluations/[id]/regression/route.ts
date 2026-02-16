// src/app/api/evaluations/[id]/regression/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { regressionService } from '@/lib/services/regression.service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { id } = await params;
  const evaluationId = parseInt(id);

  try {
    const result = await regressionService.runQuick(evaluationId, authResult.organizationId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { id } = await params;
  const evaluationId = parseInt(id);
  const body = await request.json();

  if (!body.testCaseIds || !Array.isArray(body.testCaseIds)) {
    return NextResponse.json({ error: 'testCaseIds array is required' }, { status: 400 });
  }

  try {
    const goldenSetId = await regressionService.setGoldenCases(
      evaluationId,
      authResult.organizationId,
      body.testCaseIds
    );
    return NextResponse.json({ goldenSetId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
