import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(async () => []), // no candidate jobs
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(async () => []),
			})),
		})),
	},
}));

vi.mock("@/db/schema", () => ({
	jobs: { id: "id", status: "status", nextRunAt: "nextRunAt" },
	jobRunnerLocks: { id: "id" },
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/jobs/handlers/webhook-delivery", () => ({
	handleWebhookDelivery: vi.fn(),
}));

vi.mock("@/lib/jobs/handlers/trace-failure-analysis", () => ({
	handleTraceFailureAnalysis: vi.fn(),
}));

describe("jobs runner - no jobs", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		process.env.DATABASE_URL =
			process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
	});

	it("returns without error when no jobs are pending", async () => {
		// ✅ Import runner after env + mocks are set
		const { runDueJobs } = await import("@/lib/jobs/runner");

		await expect(runDueJobs("test-runner")).resolves.toBeDefined();
	});
});
