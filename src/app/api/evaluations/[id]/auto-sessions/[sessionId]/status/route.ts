import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { autoSessions } from "@/db/schema";
import { notFound, validationError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import {
	AutoSessionServiceError,
	getAutoSessionStatus,
} from "@/lib/services/auto-session.service";
import { parseIdParam } from "@/lib/validation";

export const GET = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
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
			const status = await getAutoSessionStatus(
				params.sessionId,
				ctx.organizationId,
			);
			return NextResponse.json(status);
		} catch (error) {
			if (
				error instanceof AutoSessionServiceError &&
				error.code === "NOT_FOUND"
			) {
				return notFound("Auto session not found");
			}
			throw error;
		}
	},
	{ requiredScopes: [SCOPES.EVAL_READ] },
);
