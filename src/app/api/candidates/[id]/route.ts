/**
 * GET  /api/candidates/:id — Get candidate detail with failure report.
 * PATCH /api/candidates/:id — Update candidate status.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notFound, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { candidateService } from "@/lib/services/candidate.service";

export const GET = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const id = parseInt(params.id, 10);
		if (Number.isNaN(id)) return validationError("Valid candidate ID required");

		const result = await candidateService.getWithFailureReport(
			ctx.organizationId,
			id,
		);
		if (!result) return notFound("Candidate not found");

		return NextResponse.json(result);
	},
	{ requiredScopes: [SCOPES.EVAL_READ] },
);

const patchSchema = z.object({
	status: z.enum(["quarantined", "approved", "rejected"]),
});

export const PATCH = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const id = parseInt(params.id, 10);
		if (Number.isNaN(id)) return validationError("Valid candidate ID required");

		const parsed = await parseBody(req, patchSchema);
		if (!parsed.ok) return parsed.response;

		const result = await candidateService.updateStatus(
			ctx.organizationId,
			id,
			parsed.data.status,
			ctx.userId,
		);

		if (!result.ok) return notFound("Candidate not found");

		return NextResponse.json({ ok: true, status: parsed.data.status });
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
