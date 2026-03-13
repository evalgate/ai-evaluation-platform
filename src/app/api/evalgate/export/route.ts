import { type NextRequest, NextResponse } from "next/server";
import { forbidden, internalError, notFound } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateExportService } from "@/lib/services/evalgate-export.service";
import { evalgateExportBodySchema } from "@/lib/validation";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		try {
			requirePermission(ctx.role, "exports:download");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const parsed = await parseBody(req, evalgateExportBodySchema);
		if (!parsed.ok) {
			return parsed.response;
		}

		try {
			const payload = await evalgateExportService.build(
				ctx.organizationId,
				parsed.data.evaluationId,
				{
					runId: parsed.data.runId,
					artifactLimit: parsed.data.artifactLimit,
				},
			);

			if (!payload) {
				return notFound("Evaluation or run not found");
			}

			return NextResponse.json(payload);
		} catch (error) {
			logger.error("Failed to build EvalGate export", error, {
				route: "/api/evalgate/export",
				method: "POST",
				organizationId: ctx.organizationId,
				evaluationId: parsed.data.evaluationId,
				runId: parsed.data.runId ?? null,
			});
			return internalError("Failed to build EvalGate export");
		}
	},
	{ requiredScopes: [SCOPES.EXPORTS_DOWNLOAD] },
);
