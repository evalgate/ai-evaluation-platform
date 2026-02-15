import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { evaluationRuns } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { evaluationService } from '@/lib/services/evaluation.service';
import { logger } from '@/lib/logger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const evaluationId = parseInt(id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ 
        error: "Valid evaluation ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build the where conditions
    const conditions = [eq(evaluationRuns.evaluationId, evaluationId)];
    if (status) {
      conditions.push(eq(evaluationRuns.status, status));
    }
    
    // Apply all conditions at once
    const query = db.select()
      .from(evaluationRuns)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    const runs = await query
      .orderBy(desc(evaluationRuns.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(runs);
  } catch (error) {
    logger.error({ error, route: '/api/evaluations/[id]/runs', method: 'GET' }, 'Error fetching runs');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request as NextRequest);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const evaluationId = parseInt(id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ 
        error: "Valid evaluation ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Use the evaluation service to run the evaluation (fetches test cases, executes, writes results)
    const organizationId = 1; // Default org — in production, derive from user
    const run = await evaluationService.run(evaluationId, organizationId);

    if (!run) {
      return NextResponse.json({ 
        error: 'Evaluation not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    logger.error({ error, route: '/api/evaluations/[id]/runs', method: 'POST' }, 'Error creating run');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
