/**
 * Failure grouping — computes a deterministic hash to collapse duplicate
 * failures across traces.
 *
 * group_hash = SHA-256(category + "|" + normalizedUserPrompt)
 */

import { sha256Hex } from "@/lib/crypto/hash";

/**
 * Normalize a user prompt for grouping: lowercase, collapse whitespace, trim.
 */
export function normalizePrompt(prompt: string): string {
	return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Compute a deterministic group hash from a failure category and user prompt.
 * Returns null if userPrompt is empty/nullish.
 */
export function computeGroupHash(
	category: string,
	userPrompt: string | null | undefined,
): string | null {
	if (!userPrompt?.trim()) return null;
	const normalized = normalizePrompt(userPrompt);
	const input = `${category}|${normalized}`;
	return sha256Hex(input);
}
