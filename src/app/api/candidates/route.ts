/**
 * GET /api/candidates — List candidate eval cases for the org.
 *
 * Query params: status, auto_promote_eligible, limit, offset
 */

import { type NextRequest, NextResponse } from "next/server";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { candidateService } from "@/lib/services/candidate.service";
import { parsePaginationParams } from "@/lib/validation";

export const GET = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		const { searchParams } = new URL(req.url);
		const { limit, offset } = parsePaginationParams(searchParams);

		const status = searchParams.get("status") ?? undefined;
		const autoPromoteParam = searchParams.get("auto_promote_eligible");
		const autoPromoteEligible =
			autoPromoteParam === "true"
				? true
				: autoPromoteParam === "false"
					? false
					: undefined;

		const candidates = await candidateService.list(ctx.organizationId, {
			limit,
			offset,
			status,
			autoPromoteEligible,
		});

		return NextResponse.json({ candidates, limit, offset });
	},
	{ requiredScopes: [SCOPES.EVAL_READ] },
);
