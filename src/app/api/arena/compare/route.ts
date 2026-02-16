// src/app/api/arena/compare/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { comparisonEngine } from '@/lib/arena/comparison-engine';
import { arenaMatchesService } from '@/lib/services/arena-matches.service';

export async function POST(request: NextRequest) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    const data = await authResult.response.json();
    return NextResponse.json(data, { status: authResult.response.status });
  }

  const body = await request.json();
  const { prompt, models, judgeConfigId } = body;

  if (!prompt || !models || !Array.isArray(models) || models.length < 2) {
    return NextResponse.json(
      { error: 'prompt (string) and models (array of ≥2 model IDs) are required' },
      { status: 400 }
    );
  }

  try {
    // Run side-by-side comparison via real LLM APIs
    const comparison = await comparisonEngine.compare({
      prompt,
      models,
      organizationId: authResult.organizationId,
    });

    // Persist as an arena match (judge scoring + leaderboard update)
    const match = await arenaMatchesService.createArenaMatch(
      authResult.organizationId,
      { prompt, models, judgeConfigId },
      authResult.userId
    );

    return NextResponse.json({
      matchId: match.id,
      winner: { modelId: match.winnerId, label: match.winnerLabel },
      responses: comparison.responses,
      scores: match.scores,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
