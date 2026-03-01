import { type NextRequest, NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { logger } from "@/lib/logger";
import { regressionService } from "@/lib/services/regression.service";

export const POST = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const { id } = params;
		const evaluationId = parseInt(id, 10);
		if (Number.isNaN(evaluationId)) {
			return validationError("Valid evaluation ID is required");
		}

		try {
			const result = await regressionService.runQuick(
				evaluationId,
				ctx.organizationId,
			);
			return NextResponse.json(result);
		} catch (error) {
			logger.error("Failed to run regression", {
				error,
				route: "/api/evaluations/[id]/regression",
				method: "POST",
			});
			return validationError(
				error instanceof Error ? error.message : "Regression failed",
			);
		}
	},
);

export const PUT = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const { id } = params;
		const evaluationId = parseInt(id, 10);
		if (Number.isNaN(evaluationId)) {
			return validationError("Valid evaluation ID is required");
		}
		const body = await req.json();

		if (
			!body.testCaseIds ||
			!Array.isArray(body.testCaseIds) ||
			body.testCaseIds.length === 0 ||
			!body.testCaseIds.every(
				(id: unknown) =>
					typeof id === "number" && Number.isInteger(id) && id > 0,
			)
		) {
			return validationError(
				"testCaseIds must be a non-empty array of positive integers",
			);
		}

		try {
			const goldenSetId = await regressionService.setGoldenCases(
				evaluationId,
				ctx.organizationId,
				body.testCaseIds,
			);
			return NextResponse.json({ goldenSetId });
		} catch (error) {
			logger.error("Failed to set golden cases", {
				error,
				route: "/api/evaluations/[id]/regression",
				method: "PUT",
			});
			return internalError(error instanceof Error ? error.message : undefined);
		}
	},
);
