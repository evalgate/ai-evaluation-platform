import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/api-rate-limit';
import { llmJudgeService } from '@/lib/services/llm-judge.service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  return withRateLimit(request, async (req) => {
    try {
      const currentUser = await getCurrentUser(request);
      if (!currentUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const body = await request.json();
      const { configId, input, output, context, expectedOutput, metadata } = body;

      if (!configId || !input || !output) {
        return NextResponse.json({ 
          error: "configId, input, and output are required",
          code: "MISSING_REQUIRED_FIELDS" 
        }, { status: 400 });
      }

      // Use the service layer to actually evaluate with the LLM
      const organizationId = 1; // Default org — in production, derive from user
      const judgement = await llmJudgeService.evaluate(organizationId, {
        configId,
        input,
        output,
        context,
        expectedOutput,
        metadata: {
          ...metadata,
          evaluatedBy: currentUser.id,
        },
      });

      return NextResponse.json({ 
        result: {
          score: judgement.score,
          reasoning: judgement.reasoning,
          passed: judgement.passed,
          details: judgement.details,
        },
      }, { status: 201 });
    } catch (error) {
      logger.error({ error, route: '/api/llm-judge/evaluate', method: 'POST' }, 'Error evaluating with LLM judge');
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, { status: 500 });
    }
  }, { customTier: 'free' });
}
