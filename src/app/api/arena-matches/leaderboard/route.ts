// src/app/api/arena-matches/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { arenaMatchesService } from '@/lib/services/arena-matches.service';

/**
 * GET /api/arena-matches/leaderboard
 * Get arena leaderboard for an organization
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
    
    if (searchParams.has('days')) {
      options.timeRange = { days: parseInt(searchParams.get('days') || '30') };
    }

    const leaderboard = await arenaMatchesService.getLeaderboard(organizationId, options);

    return NextResponse.json(leaderboard);

  } catch (error: any) {
    console.error('Arena leaderboard fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
