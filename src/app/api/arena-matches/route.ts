// src/app/api/arena-matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { arenaMatchesService } from '@/lib/services/arena-matches.service';
import { z } from 'zod';

const createArenaMatchSchema = z.object({
  prompt: z.string().min(1),
  models: z.array(z.string()).min(2).max(10),
  judgeConfigId: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/arena-matches
 * Create a new arena match between multiple models
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      const data = await authResult.response.json();
      return NextResponse.json(data, { status: authResult.response.status });
    }

    const { userId, organizationId } = authResult;
    const body = await request.json();
    const parsed = createArenaMatchSchema.parse(body);

    const result = await arenaMatchesService.createArenaMatch(
      organizationId,
      parsed,
      userId
    );

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Arena match creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/arena-matches
 * Get arena matches for an organization
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
    
    if (searchParams.has('winnerId')) {
      options.winnerId = searchParams.get('winnerId');
    }
    
    if (searchParams.has('start') && searchParams.has('end')) {
      options.dateRange = {
        start: searchParams.get('start'),
        end: searchParams.get('end'),
      };
    }

    const matches = await arenaMatchesService.getArenaMatches(organizationId, options);

    return NextResponse.json(matches);

  } catch (error: any) {
    console.error('Arena matches fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
