import { describe, expect, it, vi } from "vitest";
import type { AIEvalClient } from "../client";
import type { ExportData } from "../export";
import { importData } from "../export";

const baseData: ExportData = {
	metadata: {
		exportedAt: "2024-01-01T00:00:00Z",
		version: "1.0.0",
		format: "json",
	},
};

const dataWithTraces: ExportData = {
	...baseData,
	traces: [
		{
			id: 1,
			name: "t1",
			traceId: "trace-1",
			organizationId: 1,
			status: "success",
			durationMs: null,
			metadata: null,
			createdAt: "2024-01-01T00:00:00Z",
		} as never,
	],
};

const dataWithEvaluations: ExportData = {
	...baseData,
	evaluations: [
		{
			id: 1,
			name: "eval-1",
			type: "llm",
			organizationId: 1,
			status: "active",
		} as never,
	],
};

function makeClient(overrides: Partial<AIEvalClient> = {}): AIEvalClient {
	return {
		traces: { create: vi.fn().mockResolvedValue({}) },
		evaluations: { create: vi.fn().mockResolvedValue({}) },
		...overrides,
	} as unknown as AIEvalClient;
}

describe("importData — options default and guard paths", () => {
	describe("no-options arg (defaults to {})", () => {
		it("should not throw when client has no traces property", async () => {
			const client = makeClient({ traces: undefined as never });
			await expect(importData(client, dataWithTraces)).resolves.toBeDefined();
		});

		it("should not throw when client has no evaluations property", async () => {
			const client = makeClient({ evaluations: undefined as never });
			await expect(
				importData(client, dataWithEvaluations),
			).resolves.toBeDefined();
		});

		it("should return zero counts when client properties are missing", async () => {
			const client = makeClient({
				traces: undefined as never,
				evaluations: undefined as never,
			});
			const result = await importData(client, dataWithTraces);
			expect(result.summary.imported).toBe(0);
			expect(result.summary.failed).toBe(0);
		});
	});

	describe("explicit empty options importData(client, data, {})", () => {
		it("should not throw when client has no traces property", async () => {
			const client = makeClient({ traces: undefined as never });
			await expect(
				importData(client, dataWithTraces, {}),
			).resolves.toBeDefined();
		});

		it("should not throw when client has no evaluations property", async () => {
			const client = makeClient({ evaluations: undefined as never });
			await expect(
				importData(client, dataWithEvaluations, {}),
			).resolves.toBeDefined();
		});
	});

	describe("undefined client (runtime guard)", () => {
		it("should not throw when client is undefined — traces path", async () => {
			await expect(
				importData(undefined as unknown as AIEvalClient, dataWithTraces, {}),
			).resolves.toBeDefined();
		});

		it("should not throw when client is undefined — evaluations path", async () => {
			await expect(
				importData(
					undefined as unknown as AIEvalClient,
					dataWithEvaluations,
					{},
				),
			).resolves.toBeDefined();
		});

		it("should not throw when client is undefined — empty data", async () => {
			await expect(
				importData(undefined as unknown as AIEvalClient, baseData, {}),
			).resolves.toBeDefined();
		});
	});

	describe("happy path — client properly populated", () => {
		it("should import traces and report counts", async () => {
			const client = makeClient();
			const result = await importData(client, dataWithTraces, {
				organizationId: 1,
			});
			expect(result.summary.imported).toBe(1);
			expect(result.summary.failed).toBe(0);
			expect(
				(client.traces as { create: ReturnType<typeof vi.fn> }).create,
			).toHaveBeenCalledOnce();
		});

		it("should skip traces block when data has no traces", async () => {
			const client = makeClient();
			const result = await importData(client, baseData, {});
			expect(result.summary.total).toBe(0);
			expect(
				(client.traces as { create: ReturnType<typeof vi.fn> }).create,
			).not.toHaveBeenCalled();
		});
	});

	describe("dryRun — never touches client", () => {
		it("should count without calling client when dryRun: true", async () => {
			const client = makeClient({
				traces: undefined as never,
				evaluations: undefined as never,
			});
			const result = await importData(client, dataWithTraces, { dryRun: true });
			expect(result.summary.total).toBe(1);
			expect(result.summary.imported).toBe(0);
		});
	});
});
