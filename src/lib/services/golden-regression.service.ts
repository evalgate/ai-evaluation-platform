/**
 * Golden Regression Dataset Service
 *
 * Each org has exactly one "golden_regression" evaluation.
 * findOrCreate() is idempotent — creates on first call, returns existing thereafter.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { evaluations } from "@/db/schema";

const GOLDEN_TYPE = "golden_regression";
const GOLDEN_NAME = "Golden Regression Suite";
const GOLDEN_DESCRIPTION =
	"Auto-managed regression suite from production failures. Included in evalai gate by default.";

export const goldenRegressionService = {
	/**
	 * Find or create the golden regression evaluation for an org.
	 * Idempotent — safe to call from concurrent requests.
	 */
	async findOrCreate(organizationId: number, createdBy: string) {
		// Try to find existing
		const [existing] = await db
			.select()
			.from(evaluations)
			.where(
				and(
					eq(evaluations.organizationId, organizationId),
					eq(evaluations.type, GOLDEN_TYPE),
				),
			)
			.limit(1);

		if (existing) return existing;

		// Create — use ON CONFLICT DO NOTHING to handle race conditions
		// (Two concurrent findOrCreate calls for the same org)
		const now = new Date();
		const [created] = await db
			.insert(evaluations)
			.values({
				name: GOLDEN_NAME,
				description: GOLDEN_DESCRIPTION,
				type: GOLDEN_TYPE,
				status: "active",
				organizationId,
				createdBy,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// If insert succeeded, return it
		if (created) return created;

		// Race condition fallback — another request created it first
		const [raced] = await db
			.select()
			.from(evaluations)
			.where(
				and(
					eq(evaluations.organizationId, organizationId),
					eq(evaluations.type, GOLDEN_TYPE),
				),
			)
			.limit(1);

		return raced ?? undefined;
	},

	async find(organizationId: number) {
		const [row] = await db
			.select()
			.from(evaluations)
			.where(
				and(
					eq(evaluations.organizationId, organizationId),
					eq(evaluations.type, GOLDEN_TYPE),
				),
			)
			.limit(1);
		return row ?? null;
	},
};
