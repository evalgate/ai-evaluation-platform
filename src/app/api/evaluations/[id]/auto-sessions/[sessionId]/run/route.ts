import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { autoSessions } from "@/db/schema";
import {
	conflict,
	forbidden,
	notFound,
	validationError,
} from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { PermissionError, requirePermission } from "@/lib/permissions";
import {
	AutoSessionServiceError,
	startAutoSession,
} from "@/lib/services/auto-session.service";
import { parseIdParam } from "@/lib/validation";

export const POST = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		try {
			requirePermission(ctx.role, "auto:run");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const evaluationId = parseIdParam(params.id);
		if (!evaluationId) {
			return validationError("Valid evaluation ID is required");
		}
		const [session] = await db
			.select({ id: autoSessions.id })
			.from(autoSessions)
			.where(
				and(
					eq(autoSessions.id, params.sessionId),
					eq(autoSessions.evaluationId, evaluationId),
					eq(autoSessions.organizationId, ctx.organizationId),
				),
			)
			.limit(1);
		if (!session) {
			return notFound("Auto session not found");
		}
		try {
			const result = await startAutoSession(
				params.sessionId,
				ctx.organizationId,
			);
			return NextResponse.json({
				sessionId: params.sessionId,
				jobId: result.jobId,
				status: result.status,
			});
		} catch (error) {
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "CONFLICT"
			) {
				return conflict(error.message);
			}
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "NOT_FOUND"
			) {
				return notFound("Auto session not found");
			}
			throw error;
		}
	},
	{ requiredScopes: [SCOPES.EVAL_WRITE] },
);
