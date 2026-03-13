import { type NextRequest, NextResponse } from "next/server";
import { forbidden, notFound, validationError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateArtifactService } from "@/lib/services/evalgate-artifact.service";
import { parseIdParam } from "@/lib/validation";

export const DELETE = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		const artifactId = parseIdParam(params.artifactId);
		if (!evaluationId || !artifactId) {
			return validationError(
				"Valid evaluation ID and artifact ID are required",
			);
		}

		try {
			requirePermission(ctx.role, "artifacts:delete");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const removed = await evalgateArtifactService.remove(
			ctx.organizationId,
			evaluationId,
			artifactId,
		);
		if (!removed) {
			return notFound("Artifact not found");
		}

		return NextResponse.json({ success: true });
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
