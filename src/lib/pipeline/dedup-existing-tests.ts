/**
 * Deduplicate against existing test cases.
 *
 * Before persisting a candidate eval case, check if a semantically similar
 * test case already exists in the target evaluation's test suite. Uses
 * input_hash comparison for exact-match dedup, and optionally title similarity.
 *
 * This prevents the golden regression dataset from accumulating near-duplicates.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { sha256Hex } from "@/lib/crypto/hash";
import { normalizePrompt } from "@/lib/pipeline/group-hash";

export interface DedupInput {
	/** The evaluation ID to check against */
	evaluationId: number;
	/** The user prompt from the minimized input */
	userPrompt: string | null | undefined;
	/** The candidate title */
	title: string;
}

export interface DedupResult {
	isDuplicate: boolean;
	matchedTestCaseId?: number;
	matchType?: "input_hash" | "title_exact";
}

/**
 * Check if a near-duplicate test case already exists in the evaluation.
 *
 * Dedup strategy:
 *   1. Hash the normalized user prompt → compare against testCases.inputHash
 *   2. Exact title match as fallback
 */
export async function deduplicateAgainstExistingTests(
	input: DedupInput,
): Promise<DedupResult> {
	// Strategy 1: input hash match
	if (input.userPrompt?.trim()) {
		const normalized = normalizePrompt(input.userPrompt);
		const inputHash = sha256Hex(normalized);

		const [hashMatch] = await db
			.select({ id: testCases.id })
			.from(testCases)
			.where(
				and(
					eq(testCases.evaluationId, input.evaluationId),
					eq(testCases.inputHash, inputHash),
				),
			)
			.limit(1);

		if (hashMatch) {
			return {
				isDuplicate: true,
				matchedTestCaseId: hashMatch.id,
				matchType: "input_hash",
			};
		}
	}

	// Strategy 2: exact title match
	const [titleMatch] = await db
		.select({ id: testCases.id })
		.from(testCases)
		.where(
			and(
				eq(testCases.evaluationId, input.evaluationId),
				eq(testCases.name, input.title),
			),
		)
		.limit(1);

	if (titleMatch) {
		return {
			isDuplicate: true,
			matchedTestCaseId: titleMatch.id,
			matchType: "title_exact",
		};
	}

	return { isDuplicate: false };
}
