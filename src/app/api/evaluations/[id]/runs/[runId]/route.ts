import { NextResponse, NextRequest } from "next/server"
import { db } from '@/db'
import { evaluationRuns, testResults, testCases, user } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; runId: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    const { runId } = await params

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch run with creator info
    const runData = await db
      .select({
        run: evaluationRuns,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      })
      .from(evaluationRuns)
      .leftJoin(user, eq(evaluationRuns.id, user.id))
      .where(eq(evaluationRuns.id, parseInt(runId)))
      .limit(1)

    if (runData.length === 0) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }

    // Fetch test results for this run with test case details
    const results = await db
      .select({
        result: testResults,
        testCase: {
          name: testCases.name,
          input: testCases.input,
          expectedOutput: testCases.expectedOutput,
        }
      })
      .from(testResults)
      .leftJoin(testCases, eq(testResults.testCaseId, testCases.id))
      .where(eq(testResults.evaluationRunId, parseInt(runId)))
      .orderBy(asc(testResults.createdAt))

    // Format response to match Supabase structure
    const formattedRun = {
      ...runData[0].run,
      users: runData[0].creator,
    }

    const formattedResults = results.map(r => ({
      ...r.result,
      test_cases: r.testCase,
    }))

    return NextResponse.json({ run: formattedRun, results: formattedResults })
  } catch (error) {
    console.error('GET evaluation run error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 })
  }
}