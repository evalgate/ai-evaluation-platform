import { NextResponse, NextRequest } from "next/server"
import { db } from '@/db'
import { evaluations, testCases, user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    const { id } = await params

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch evaluation with test cases and user info
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
      .where(eq(evaluations.id, parseInt(id)))
      .limit(1)

    if (evaluationData.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

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
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    const { id } = await params

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      .where(eq(evaluations.id, parseInt(id)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    return NextResponse.json({ evaluation: updated[0] })
  } catch (error) {
    console.error('PATCH evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    const { id } = await params

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deleted = await db
      .delete(evaluations)
      .where(eq(evaluations.id, parseInt(id)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 })
  }
}