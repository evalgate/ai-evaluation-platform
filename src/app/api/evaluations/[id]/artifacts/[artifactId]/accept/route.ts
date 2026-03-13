import { type NextRequest, NextResponse } from "next/server";
import { forbidden, notFound, validationError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateArtifactService } from "@/lib/services/evalgate-artifact.service";
import { parseIdParam } from "@/lib/validation";

export const POST = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		const artifactId = parseIdParam(params.artifactId);
		if (!evaluationId || !artifactId) {
			return validationError(
				"Valid evaluation ID and artifact ID are required",
			);
		}

		try {
			requirePermission(ctx.role, "synthesis:accept");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const accepted = await evalgateArtifactService.acceptSynthesis(
			ctx.organizationId,
			evaluationId,
			artifactId,
		);
		if (!accepted) {
			return notFound("Synthesis artifact not found");
		}

		return NextResponse.json({ success: true, ...accepted });
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
