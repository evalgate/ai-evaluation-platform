import { type NextRequest, NextResponse } from "next/server";
import { forbidden, internalError, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateComputeService } from "@/lib/services/evalgate-compute.service";
import { synthesizeDatasetBodySchema } from "@/lib/validation";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		try {
			requirePermission(ctx.role, "synthesis:generate");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const parsed = await parseBody(req, synthesizeDatasetBodySchema);
		if (!parsed.ok) {
			return parsed.response;
		}

		try {
			const summary = evalgateComputeService.synthesizeDatasetContent(
				parsed.data.datasetContent,
				{
					dimensions: parsed.data.dimensions,
					count: parsed.data.count,
					failureModes: parsed.data.failureModes,
				},
			);
			return NextResponse.json(summary);
		} catch (error) {
			const message = error instanceof Error ? error.message : null;
			if (message) {
				return validationError(message);
			}
			logger.error("Failed to synthesize dataset content", error, {
				route: "/api/evalgate/synthesize",
				method: "POST",
				organizationId: ctx.organizationId,
			});
			return internalError("Failed to synthesize dataset content");
		}
	},
	{ requiredScopes: [SCOPES.REPORTS_WRITE] },
);
