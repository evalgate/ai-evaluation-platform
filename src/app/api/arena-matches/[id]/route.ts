// src/app/api/arena-matches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { arenaMatchesService } from '@/lib/services/arena-matches.service';

/**
 * GET /api/arena-matches/[id]
 * Get a specific arena match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { organizationId } = authResult;
    const { id } = await params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid arena match ID' }, { status: 400 });
    }

    const match = await arenaMatchesService.getArenaMatch(organizationId, matchId);

    if (!match) {
      return NextResponse.json({ error: 'Arena match not found' }, { status: 404 });
    }

    return NextResponse.json(match);

  } catch (error: any) {
    console.error('Arena match fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
