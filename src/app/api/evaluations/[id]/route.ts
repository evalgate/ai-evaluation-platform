import { NextResponse, NextRequest } from "next/server"
import { db } from '@/db'
import { evaluations, testCases, evaluationRuns, testResults, user } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthWithOrg } from '@/lib/autumn-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthWithOrg(request)
    if (!authResult.authenticated) {
      const data = await authResult.response.json()
      return NextResponse.json(data, { status: authResult.response.status })
    }

    const { userId, organizationId } = authResult
    const { id } = await params

    // Fetch evaluation with test cases and user info - ORG SCOPED
    const evaluationData = await db
      .select({
        evaluation: evaluations,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      })
      .from(evaluations)
      .leftJoin(user, eq(evaluations.createdBy, user.id))
      .where(and(eq(evaluations.id, parseInt(id)), eq(evaluations.organizationId, organizationId)))
      .limit(1)

    if (evaluationData.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    // Fetch test cases for this evaluation - ORG SCOPED
    // Fetch test cases for this evaluation
    const evalTestCases = await db
      .select()
      .from(testCases)
      .where(eq(testCases.evaluationId, parseInt(id)))

    // Format response to match Supabase structure
    const formattedEvaluation = {
      ...evaluationData[0].evaluation,
      test_cases: evalTestCases,
      users: evaluationData[0].creator,
    }

    return NextResponse.json({ evaluation: formattedEvaluation })
  } catch (error) {
    console.error('GET evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthWithOrg(request)
    if (!authResult.authenticated) {
      const data = await authResult.response.json()
      return NextResponse.json(data, { status: authResult.response.status })
    }

    const { userId, organizationId } = authResult
    const { id } = await params

    const body = await request.json()
    const { name, description, config } = body

    const now = new Date().toISOString()

    const updated = await db
      .update(evaluations)
      .set({
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        updatedAt: now,
      })
      .where(and(eq(evaluations.id, parseInt(id)), eq(evaluations.organizationId, organizationId)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    return NextResponse.json({ evaluation: updated[0] })
  } catch (error) {
    console.error('PATCH evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthWithOrg(request)
    if (!authResult.authenticated) {
      const data = await authResult.response.json()
      return NextResponse.json(data, { status: authResult.response.status })
    }

    const { userId, organizationId } = authResult
    const { id } = await params

    // First check the evaluation exists - ORG SCOPED
    const existing = await db
      .select({ id: evaluations.id })
      .from(evaluations)
      .where(and(eq(evaluations.id, parseInt(id)), eq(evaluations.organizationId, organizationId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    const evalId = parseInt(id);

    // Cascade delete: delete related records first
    // 1. Delete test results for runs belonging to this evaluation
    const runs = await db.select({ id: evaluationRuns.id }).from(evaluationRuns).where(eq(evaluationRuns.evaluationId, evalId));
    for (const run of runs) {
      await db.delete(testResults).where(eq(testResults.evaluationRunId, run.id));
    }
    // 2. Delete evaluation runs
    await db.delete(evaluationRuns).where(eq(evaluationRuns.evaluationId, evalId));
    // 3. Delete test cases
    await db.delete(testCases).where(eq(testCases.evaluationId, evalId));
    // 4. Delete the evaluation itself - ORG SCOPED
    await db.delete(evaluations).where(and(eq(evaluations.id, evalId), eq(evaluations.organizationId, organizationId)));

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}