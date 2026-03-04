/**
 * POST /api/candidates/:id/promote — Promote candidate to a test suite.
 *
 * Body: { evaluation_id: number } — target evaluation to add test case to.
 * If evaluation_id is omitted, promotes to the org's golden regression eval.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { candidateService } from "@/lib/services/candidate.service";
import { goldenRegressionService } from "@/lib/services/golden-regression.service";

const promoteSchema = z.object({
	evaluation_id: z.number().int().positive().optional(),
});

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const id = parseInt(params.id, 10);
		if (Number.isNaN(id)) return validationError("Valid candidate ID required");

		const parsed = await parseBody(req, promoteSchema);
		if (!parsed.ok) return parsed.response;

		// Use provided evaluation_id or fall back to golden regression
		let targetEvalId = parsed.data.evaluation_id;
		if (!targetEvalId) {
			const golden = await goldenRegressionService.findOrCreate(
				ctx.organizationId,
				ctx.userId,
			);
			targetEvalId = golden.id;
		}

		const result = await candidateService.promote(
			ctx.organizationId,
			id,
			targetEvalId,
			ctx.userId,
		);

		if (!result.ok) {
			if (result.reason === "not_found") return notFound("Candidate not found");
			if (result.reason === "already_promoted") {
				return apiError("CONFLICT", "Candidate already promoted");
			}
			if (result.reason === "evaluation_not_found") {
				return notFound("Target evaluation not found");
			}
			if (result.reason === "duplicate_test_exists") {
				return apiError(
					"CONFLICT",
					"A similar test case already exists in the target evaluation",
				);
			}
		}

		return NextResponse.json(
			{
				ok: true,
				test_case_id: result.ok ? result.testCaseId : undefined,
				evaluation_id: result.ok ? result.evaluationId : undefined,
			},
			{ status: 201 },
		);
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
