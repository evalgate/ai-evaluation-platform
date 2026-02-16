// src/app/api/report-cards/[evaluationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { reportCardsService } from '@/lib/services/report-cards.service';

/**
 * GET /api/report-cards/[evaluationId]
 * Generate a report card for a specific evaluation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { evaluationId } = await params;
    const evalId = parseInt(evaluationId);

    if (isNaN(evalId)) {
      return NextResponse.json(
        { error: 'Invalid evaluation ID' },
        { status: 400 }
      );
    }

    const reportCard = await reportCardsService.generateReportCard(
      evalId,
      authResult.organizationId
    );

    return NextResponse.json(reportCard);

  } catch (error: any) {
    console.error('Report card generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
