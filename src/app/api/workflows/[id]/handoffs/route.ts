import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { workflows } from "@/db/schema";
import { notFound, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { workflowService } from "@/lib/services/workflow.service";

const createHandoffSchema = z.object({
	workflowRunId: z.number().int().positive(),
	fromSpanId: z.string().optional(),
	toSpanId: z.string(),
	fromAgent: z.string().optional(),
	toAgent: z.string(),
	handoffType: z.enum(["delegation", "escalation", "parallel", "fallback"]),
	context: z.record(z.unknown()).optional(),
});

/**
 * GET /api/workflows/[id]/handoffs - Get handoff statistics for a workflow
 */
export const GET = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const workflowId = parseInt(params.id, 10);

		if (Number.isNaN(workflowId)) {
			return validationError("Valid workflow ID is required");
		}

		// Verify workflow belongs to the caller's organization
		const [workflow] = await db
			.select({ id: workflows.id })
			.from(workflows)
			.where(
				and(
					eq(workflows.id, workflowId),
					eq(workflows.organizationId, ctx.organizationId),
				),
			);

		if (!workflow) {
			return notFound("Workflow not found");
		}

		const { searchParams } = new URL(req.url);
		const runId = searchParams.get("runId");

		// If runId is provided, get handoffs for that specific run
		if (runId) {
			const runIdNum = parseInt(runId, 10);
			if (Number.isNaN(runIdNum)) {
				return validationError("Valid run ID is required");
			}

			const handoffs = await workflowService.listHandoffs(runIdNum);
			return NextResponse.json(handoffs);
		}

		// Otherwise, get handoff statistics for the workflow
		const stats = await workflowService.getHandoffStats(workflowId);

		return NextResponse.json(
			{
				workflowId,
				handoffStats: stats,
			},
			{
				headers: {
					"Cache-Control": "private, max-age=60, stale-while-revalidate=120",
				},
			},
		);
	},
	{ rateLimit: "free", requiredScopes: [SCOPES.RUNS_READ] },
);

/**
 * POST /api/workflows/[id]/handoffs - Create a new handoff
 */
export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const workflowId = parseInt(params.id, 10);

		if (Number.isNaN(workflowId)) {
			return validationError("Valid workflow ID is required");
		}

		// Verify workflow belongs to the caller's organization
		const [workflow] = await db
			.select({ id: workflows.id })
			.from(workflows)
			.where(
				and(
					eq(workflows.id, workflowId),
					eq(workflows.organizationId, ctx.organizationId),
				),
			);

		if (!workflow) {
			return notFound("Workflow not found");
		}

		const parsed = await parseBody(req, createHandoffSchema);
		if (!parsed.ok) return parsed.response;

		const handoff = await workflowService.createHandoff({
			...parsed.data,
			organizationId: ctx.organizationId,
		});

		logger.info("Handoff created", {
			handoffId: handoff.id,
			workflowId,
			runId: parsed.data.workflowRunId,
			type: parsed.data.handoffType,
			organizationId: ctx.organizationId,
		});

		return NextResponse.json(handoff, { status: 201 });
	},
	{ rateLimit: "free", requiredScopes: [SCOPES.RUNS_WRITE] },
);
