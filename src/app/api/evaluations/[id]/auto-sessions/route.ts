import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, notFound, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { PermissionError, requirePermission } from "@/lib/permissions";
import {
	AutoSessionServiceError,
	createAutoSession,
	listAutoSessions,
} from "@/lib/services/auto-session.service";
import { parseIdParam } from "@/lib/validation";

const createAutoSessionSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	objective: z.string().trim().min(1, "Objective is required"),
	targetPath: z.string().trim().min(1, "Target path is required"),
	allowedFamilies: z
		.array(z.string().trim().min(1))
		.min(1, "At least one family is required"),
	maxIterations: z.number().int().min(1).max(20),
	maxCostUsd: z.number().positive().optional(),
});

export const GET = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		if (!evaluationId) {
			return validationError("Valid evaluation ID is required");
		}
		try {
			const sessions = await listAutoSessions(evaluationId, ctx.organizationId);
			return NextResponse.json({ sessions });
		} catch (error) {
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "NOT_FOUND"
			) {
				return notFound("Evaluation not found");
			}
			throw error;
		}
	},
	{ requiredScopes: [SCOPES.EVAL_READ] },
);

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext, params) => {
		const evaluationId = parseIdParam(params.id);
		if (!evaluationId) {
			return validationError("Valid evaluation ID is required");
		}
		try {
			requirePermission(ctx.role, "auto:create");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}
		const parsed = await parseBody(req, createAutoSessionSchema);
		if (!parsed.ok) {
			return parsed.response;
		}
		try {
			const result = await createAutoSession({
				organizationId: ctx.organizationId,
				evaluationId,
				createdBy: ctx.userId,
				name: parsed.data.name,
				objective: parsed.data.objective,
				targetPath: parsed.data.targetPath,
				allowedFamilies: parsed.data.allowedFamilies,
				maxIterations: parsed.data.maxIterations,
				maxCostUsd: parsed.data.maxCostUsd,
			});
			return NextResponse.json(
				{ sessionId: result.sessionId, status: "idle" },
				{ status: 201 },
			);
		} catch (error) {
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "NOT_FOUND"
			) {
				return notFound("Evaluation not found");
			}
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "VALIDATION"
			) {
				return validationError(error.message);
			}
			throw error;
		}
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
