import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { llmJudgeResults, llmJudgeConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, input, output, score, reasoning, metadata } = body;

    if (!configId || !input || !output) {
      return NextResponse.json({ 
        error: "configId, input, and output are required",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Verify config exists
    const config = await db.select()
      .from(llmJudgeConfigs)
      .where(eq(llmJudgeConfigs.id, configId))
      .limit(1);

    if (config.length === 0) {
      return NextResponse.json({ 
        error: 'LLM judge config not found',
        code: 'CONFIG_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newResult = await db.insert(llmJudgeResults)
      .values({
        configId,
        input: input.trim(),
        output: output.trim(),
        score: score || null,
        reasoning: reasoning?.trim() || null,
        metadata: metadata || null,
        createdAt: now,
      })
      .returning();

    return NextResponse.json({ 
      result: newResult[0],
      config: config[0]
    }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}