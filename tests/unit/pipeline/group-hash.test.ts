/**
 * Unit tests for failure grouping hash computation.
 */
import { describe, expect, it } from "vitest";
import { computeGroupHash, normalizePrompt } from "@/lib/pipeline/group-hash";

describe("normalizePrompt", () => {
	it("lowercases text", () => {
		expect(normalizePrompt("Hello WORLD")).toBe("hello world");
	});

	it("collapses whitespace", () => {
		expect(normalizePrompt("hello   world  foo")).toBe("hello world foo");
	});

	it("trims leading/trailing whitespace", () => {
		expect(normalizePrompt("  hello world  ")).toBe("hello world");
	});

	it("handles tabs and newlines", () => {
		expect(normalizePrompt("hello\tworld\nfoo")).toBe("hello world foo");
	});
});

describe("computeGroupHash", () => {
	it("produces a deterministic hash", () => {
		const h1 = computeGroupHash("hallucination", "Summarize the Q3 notes");
		const h2 = computeGroupHash("hallucination", "Summarize the Q3 notes");
		expect(h1).toBe(h2);
		expect(h1).toMatch(/^[a-f0-9]{64}$/);
	});

	it("different categories produce different hashes", () => {
		const h1 = computeGroupHash("hallucination", "Summarize the Q3 notes");
		const h2 = computeGroupHash("refusal", "Summarize the Q3 notes");
		expect(h1).not.toBe(h2);
	});

	it("different prompts produce different hashes", () => {
		const h1 = computeGroupHash("hallucination", "Summarize Q3");
		const h2 = computeGroupHash("hallucination", "Summarize Q4");
		expect(h1).not.toBe(h2);
	});

	it("normalizes before hashing — case/whitespace doesn't matter", () => {
		const h1 = computeGroupHash("hallucination", "Hello World");
		const h2 = computeGroupHash("hallucination", "  hello   world  ");
		expect(h1).toBe(h2);
	});

	it("returns null for empty prompt", () => {
		expect(computeGroupHash("hallucination", "")).toBeNull();
		expect(computeGroupHash("hallucination", "   ")).toBeNull();
	});

	it("returns null for null/undefined prompt", () => {
		expect(computeGroupHash("hallucination", null)).toBeNull();
		expect(computeGroupHash("hallucination", undefined)).toBeNull();
	});
});
