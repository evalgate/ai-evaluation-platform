import { type NextRequest, NextResponse } from "next/server";
import { forbidden, internalError, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateComputeService } from "@/lib/services/evalgate-compute.service";
import { analyzeDatasetBodySchema } from "@/lib/validation";

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

		const parsed = await parseBody(req, analyzeDatasetBodySchema);
		if (!parsed.ok) {
			return parsed.response;
		}

		try {
			const result = evalgateComputeService.analyzeDatasetContent(
				parsed.data.datasetContent,
				parsed.data.top,
			);
			return NextResponse.json({
				rowCount: result.rows.length,
				rows: result.rows,
				summary: result.summary,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : null;
			if (message) {
				return validationError(message);
			}
			logger.error("Failed to analyze dataset content", error, {
				route: "/api/evalgate/analyze",
				method: "POST",
				organizationId: ctx.organizationId,
			});
			return internalError("Failed to analyze dataset content");
		}
	},
	{ requiredScopes: [SCOPES.REPORTS_WRITE] },
);
