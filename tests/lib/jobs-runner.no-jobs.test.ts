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

describe("jobs runner - no jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TURSO_CONNECTION_URL = process.env.TURSO_CONNECTION_URL ?? "libsql://test";
    process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "test-token";
  });

  it("returns without error when no jobs are pending", async () => {
    // ✅ Import runner after env + mocks are set
    const mod = await import("@/lib/jobs/runner");

    // Try common export names; pick the one that exists.
    const run =
      (mod as Record<string, () => unknown>).runJobsOnce ??
      (mod as Record<string, () => unknown>).runOnce ??
      (mod as Record<string, () => unknown>).runRunnerOnce ??
      (mod as Record<string, () => unknown>).runJobs ??
      (mod as Record<string, () => unknown>).runDueJobs;

    if (!run) {
      throw new Error(
        `No runnable export found in "@/lib/jobs/runner". Found exports: ${Object.keys(mod).join(", ")}`,
      );
    }

    await expect(run({ max: 5 })).resolves.toBeDefined();
  });
});
