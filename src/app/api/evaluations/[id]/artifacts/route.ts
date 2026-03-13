import { type NextRequest, NextResponse } from "next/server";
import { forbidden, notFound, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateArtifactService } from "@/lib/services/evalgate-artifact.service";
import {
	createEvalgateArtifactBodySchema,
	evalgateArtifactKindSchema,
	parseIdParam,
	parsePaginationParams,
} from "@/lib/validation";

function getCreateArtifactPermission(
	artifactType:
		| "labeled_dataset"
		| "analysis"
		| "cluster"
		| "synthesis"
		| "diversity",
) {
	switch (artifactType) {
		case "analysis":
			return "analysis:run" as const;
		case "cluster":
			return "cluster:run" as const;
		case "synthesis":
			return "synthesis:generate" as const;
		case "diversity":
			return "analysis:run" as const;
		default:
			return "analysis:run" as const;
	}
}

export const GET = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		if (!evaluationId) {
			return validationError("Valid evaluation ID is required");
		}

		try {
			requirePermission(ctx.role, "artifacts:read");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const { searchParams } = new URL(req.url);
		const { limit, offset } = parsePaginationParams(searchParams);
		const runId = parseIdParam(searchParams.get("runId"));
		const artifactTypeParam = searchParams.get("artifactType");
		const artifactType = artifactTypeParam
			? evalgateArtifactKindSchema.safeParse(artifactTypeParam)
			: null;
		if (artifactTypeParam && !artifactType?.success) {
			return validationError("Invalid artifactType filter");
		}

		const result = await evalgateArtifactService.list(
			ctx.organizationId,
			evaluationId,
			{
				limit,
				offset,
				artifactType: artifactType?.success ? artifactType.data : undefined,
				runId: runId ?? undefined,
			},
		);

		if (result === null) {
			return notFound("Evaluation not found");
		}

		return NextResponse.json(result);
	},
	{ requiredScopes: [SCOPES.EVAL_READ] },
);

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		if (!evaluationId) {
			return validationError("Valid evaluation ID is required");
		}

		const parsed = await parseBody(req, createEvalgateArtifactBodySchema);
		if (!parsed.ok) return parsed.response;

		try {
			requirePermission(
				ctx.role,
				getCreateArtifactPermission(parsed.data.artifactType),
			);
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const artifact = await evalgateArtifactService.create(
			ctx.organizationId,
			evaluationId,
			ctx.userId,
			parsed.data,
		);

		if (artifact === null) {
			return notFound("Evaluation or source data not found");
		}

		return NextResponse.json(artifact, { status: 201 });
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
