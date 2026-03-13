import { type NextRequest, NextResponse } from "next/server";
import { forbidden, internalError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateComputeService } from "@/lib/services/evalgate-compute.service";
import { discoverDiversityBodySchema } from "@/lib/validation";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		try {
			requirePermission(ctx.role, "analysis:run");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const parsed = await parseBody(req, discoverDiversityBodySchema);
		if (!parsed.ok) {
			return parsed.response;
		}

		try {
			const diversity = evalgateComputeService.discoverDiversity(
				parsed.data.specs,
				parsed.data.threshold,
			);
			return NextResponse.json({
				specCount: parsed.data.specs.length,
				diversity,
			});
		} catch (error) {
			logger.error("Failed to discover diversity", error, {
				route: "/api/evalgate/discover-diversity",
				method: "POST",
				organizationId: ctx.organizationId,
			});
			return internalError("Failed to discover diversity");
		}
	},
	{ requiredScopes: [SCOPES.REPORTS_WRITE] },
);
