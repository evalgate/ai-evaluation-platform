import { describe, expect, it } from "vitest";
import { importRunBodySchema } from "@/lib/validation";

const base = {
	results: [{ testCaseId: 1, status: "passed", output: "ok" }],
};

describe("importRunBodySchema", () => {
	it("rejects duplicate testCaseId", () => {
		const parsed = importRunBodySchema.safeParse({
			...base,
			results: [
				{ testCaseId: 1, status: "passed", output: "ok" },
				{ testCaseId: 1, status: "failed", output: "no" },
			],
		});

		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(
				parsed.error.issues.some((issue) =>
					issue.message.includes("Duplicate"),
				),
			).toBe(true);
		}
	});

	it("enforces minimum results length", () => {
		const parsed = importRunBodySchema.safeParse({ ...base, results: [] });
		expect(parsed.success).toBe(false);
	});

	it("accepts optional latency and cost fields", () => {
		const parsed = importRunBodySchema.safeParse({
			...base,
			results: [
				{
					testCaseId: 1,
					status: "passed",
					output: "ok",
					latencyMs: 42,
					costUsd: 0.01,
				},
			],
		});

		expect(parsed.success).toBe(true);
	});

	it("defaults environment to dev", () => {
		const parsed = importRunBodySchema.safeParse(base as unknown);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.environment).toBe("dev");
		}
	});
});
