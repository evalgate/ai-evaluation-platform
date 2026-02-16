// src/app/api/arena/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { arenaMatchesService } from '@/lib/services/arena-matches.service';

export async function GET(request: NextRequest) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const leaderboard = await arenaMatchesService.getLeaderboard(
      authResult.organizationId,
      { limit, timeRange: { days } }
    );

    const stats = await arenaMatchesService.getArenaStats(authResult.organizationId);

    return NextResponse.json({ leaderboard, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
