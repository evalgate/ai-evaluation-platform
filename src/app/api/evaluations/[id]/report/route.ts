// src/app/api/evaluations/[id]/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { reportCardsService } from '@/lib/services/report-cards.service';
import { db } from '@/db';
import { reportCards } from '@/db/schema';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { id } = await params;
  const evaluationId = parseInt(id);
  const body = await request.json();

  try {
    // Generate report card data
    const reportData = await reportCardsService.generateReportCard(evaluationId, authResult.organizationId);

    // Persist as a shareable report card
    const slug = randomUUID().slice(0, 10);
    const now = new Date().toISOString();
    const [card] = await db.insert(reportCards).values({
      evaluationId,
      evaluationRunId: body.evaluationRunId ?? 0,
      organizationId: authResult.organizationId,
      title: body.title || reportData.evaluationName,
      description: body.description || `Report card for ${reportData.evaluationName}`,
      slug,
      reportData: JSON.stringify(reportData),
      isPublic: body.isPublic ?? false,
      createdBy: authResult.userId,
      createdAt: now,
    }).returning();

    return NextResponse.json(card, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { id } = await params;
  const evaluationId = parseInt(id);

  try {
    const reportData = await reportCardsService.generateReportCard(evaluationId, authResult.organizationId);
    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
