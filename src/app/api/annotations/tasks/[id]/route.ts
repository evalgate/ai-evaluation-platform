import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { annotationTasks } from "@/db/schema";
import { notFound } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";

export const GET = secureRoute(
	async (_req: NextRequest, ctx: AuthContext, params) => {
		const taskId = parseInt(params.id, 10);

		const [task] = await db
			.select()
			.from(annotationTasks)
			.where(
				and(
					eq(annotationTasks.id, taskId),
					eq(annotationTasks.organizationId, ctx.organizationId),
				),
			)
			.limit(1);

		if (!task) {
			return notFound("Task not found");
		}

		return NextResponse.json({ task });
	},
);
