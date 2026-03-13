import { type NextRequest, NextResponse } from "next/server";
import {
	forbidden,
	internalError,
	notFound,
	validationError,
} from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { evalgateComputeService } from "@/lib/services/evalgate-compute.service";
import { clusterRunBodySchema } from "@/lib/validation";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		try {
			requirePermission(ctx.role, "cluster:run");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const evaluationId = Number.parseInt(params.id, 10);
		const runId = Number.parseInt(params.runId, 10);
		if (!Number.isFinite(evaluationId) || !Number.isFinite(runId)) {
			return validationError("Valid evaluation and run IDs are required");
		}

		const parsed = await parseBody(req, clusterRunBodySchema, {
			allowEmpty: true,
		});
		if (!parsed.ok) {
			return parsed.response;
		}

		try {
			const result = await evalgateComputeService.clusterRun(
				ctx.organizationId,
				evaluationId,
				runId,
				parsed.data,
			);
			if (!result) {
				return notFound("Evaluation run not found");
			}

			return NextResponse.json(result);
		} catch (error) {
			logger.error("Failed to cluster evaluation run", error, {
				route: "/api/evaluations/[id]/runs/[runId]/cluster",
				method: "POST",
				evaluationId,
				runId,
				organizationId: ctx.organizationId,
			});
			return internalError("Failed to cluster evaluation run");
		}
	},
	{ requiredScopes: [SCOPES.RUNS_READ] },
);
