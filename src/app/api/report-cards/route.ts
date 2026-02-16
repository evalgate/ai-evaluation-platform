// src/app/api/report-cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { reportCardsService } from '@/lib/services/report-cards.service';

/**
 * GET /api/report-cards
 * Get report cards for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { organizationId } = authResult;
    const { searchParams } = new URL(request.url);
    
    const options: any = {};
    
    // Parse query parameters
    if (searchParams.has('limit')) {
      options.limit = parseInt(searchParams.get('limit') || '10');
    }
    
    if (searchParams.has('offset')) {
      options.offset = parseInt(searchParams.get('offset') || '0');
    }
    
    if (searchParams.has('evaluationType')) {
      options.evaluationType = searchParams.get('evaluationType');
    }

    const reportCards = await reportCardsService.getReportCards(organizationId, options);

    return NextResponse.json(reportCards);

  } catch (error: any) {
    console.error('Report cards fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
