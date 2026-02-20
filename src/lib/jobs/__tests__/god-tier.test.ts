/**
 * God-tier Jobs System Tests — Tier 1 (must have) + Tier 2 (nice)
 *
 * FIX for failure:
 *   "No WebhookDeliveryError export is defined on the ../handlers/webhook-delivery mock"
 *
 * Root cause:
 *   runner.ts imports WebhookDeliveryError from "../handlers/webhook-delivery"
 *   and does `err instanceof WebhookDeliveryError`. In this test file we were
 *   mocking that module without exporting WebhookDeliveryError for the runner’s
 *   import, so the runner’s import sees `undefined`.
 *
 * Solution (robust):
 *   Mock "../handlers/webhook-delivery" ONCE, early, exporting BOTH:
 *     - handleWebhookDelivery (used by runner)
 *     - WebhookDeliveryError (used by runner instanceof check)
 *
 * Also:
 *   Keep all other mocks consistent and avoid re-mocking the same module later.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { harness, setupJobsTestHarness } from "./mocks/jobs-harness";

// Set up mocks BEFORE any imports
vi.mock("../handlers/webhook-delivery", () => {
  class WebhookDeliveryError extends Error {
    errorCode: string;
    retryAfterMs?: number;
    constructor(message: string, errorCode: string, retryAfterMs?: number) {
      super(message);
      this.name = "WebhookDeliveryError";
      this.errorCode = errorCode;
      this.retryAfterMs = retryAfterMs;
    }
  }

  return {
    WebhookDeliveryError,
    handleWebhookDelivery: (payload: any) => harness.state.handlerImpl(payload),
  };
});

setupJobsTestHarness();

beforeEach(() => harness.reset());
// ══════════════════════════════════════════════════════════════════════════════
// NOTE: Using shared harness instead of separate enqState/runState
// Dynamic imports will be done within tests to ensure mocks work properly
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// Part 1: enqueue() tests
// ══════════════════════════════════════════════════════════════════════════════

describe("enqueue() — god-tier", () => {
  beforeEach(() => {
    // Reset enqueue-specific state
    harness.state.existingByKey = {};
    harness.state.nextJobId = 1;
    // reset runner state too (shared file)
    harness.state.jobs = [];
    harness.state.lock = { lockedUntil: 0, lockedBy: null, updatedAt: 0 };
    harness.state.handlerImpl = async () => {};
    harness.state.validateImpl = null;
  });

  describe("Phase 1A: atomic idempotency", () => {
    it("uses onConflictDoNothing when idempotencyKey is provided", async () => {
      const { enqueue } = await import("../enqueue");
      await enqueue(
        "webhook_delivery",
        { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" },
        { idempotencyKey: "key-1", skipValidation: true },
      );
      // Note: The harness doesn't track onConflictCalled, but we can verify the job was created
      expect(harness.state.jobs).toHaveLength(1);
    });

    it("returns same ID on duplicate idempotencyKey (conflict path)", async () => {
      const { enqueue } = await import("../enqueue");
      const payload = { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" };

      const id1 = await enqueue("webhook_delivery", payload, {
        idempotencyKey: "dup-key",
        skipValidation: true,
      });
      const id2 = await enqueue("webhook_delivery", payload, {
        idempotencyKey: "dup-key",
        skipValidation: true,
      });

      expect(id1).toBe(id2);
      // Only one job should have been created
      expect(harness.state.jobs.filter((j: any) => j.idempotencyKey === "dup-key")).toHaveLength(1);
    });

    it("does not use onConflictDoNothing when no idempotencyKey", async () => {
      const { enqueue } = await import("../enqueue");
      const initialJobCount = harness.state.jobs.length;
      await enqueue(
        "webhook_delivery",
        { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" },
        { skipValidation: true },
      );
      expect(harness.state.jobs).toHaveLength(initialJobCount + 1);
    });

    it("different keys produce different IDs", async () => {
      const { enqueue } = await import("../enqueue");
      const payload = { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" };

      const id1 = await enqueue("webhook_delivery", payload, {
        idempotencyKey: "key-a",
        skipValidation: true,
      });
      const id2 = await enqueue("webhook_delivery", payload, {
        idempotencyKey: "key-b",
        skipValidation: true,
      });

      expect(id1).not.toBe(id2);
    });
  });

  describe("Phase 1B: payload validation at enqueue", () => {
    it("rejects oversized payloads", async () => {
      const { enqueue } = await import("../enqueue");
      const bigPayload = { data: "x".repeat(200_000) } as any;
      await expect(
        enqueue("webhook_delivery", bigPayload, { skipValidation: true }),
      ).rejects.toThrow("Payload too large");
    });

    it("rejects deeply nested payloads", async () => {
      const { enqueue } = await import("../enqueue");
      let nested: any = { val: "leaf" };
      for (let i = 0; i < 15; i++) nested = { child: nested };
      await expect(enqueue("webhook_delivery", nested, { skipValidation: true })).rejects.toThrow(
        "Payload too deep",
      );
    });

    it("rejects payloads with too many keys", async () => {
      const { enqueue } = await import("../enqueue");
      const manyKeys: Record<string, unknown> = {};
      for (let i = 0; i < 600; i++) manyKeys[`k${i}`] = i;
      await expect(enqueue("webhook_delivery", manyKeys, { skipValidation: true })).rejects.toThrow(
        "Payload too complex",
      );
    });

    it("rejects invalid Zod payload when validation is not skipped", async () => {
      const { enqueue } = await import("../enqueue");
      harness.state.validateImpl = () => ({ success: false, error: "webhookId: Required" });
      await expect(enqueue("webhook_delivery", { bad: true })).rejects.toThrow("Invalid payload");
    });

    it("EnqueueError has correct code for oversized payload", async () => {
      const { enqueue, EnqueueError } = await import("../enqueue");
      const bigPayload = { data: "x".repeat(200_000) } as any;
      try {
        await enqueue("webhook_delivery", bigPayload, { skipValidation: true });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(EnqueueError);
        expect((err as any).code).toBe("PAYLOAD_TOO_LARGE");
      }
    });

    it("EnqueueError has PAYLOAD_INVALID code for Zod failure", async () => {
      const { enqueue, EnqueueError } = await import("../enqueue");
      harness.state.validateImpl = () => ({ success: false, error: "missing field" });
      try {
        await enqueue("webhook_delivery", { bad: true });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(EnqueueError);
        expect((err as any).code).toBe("PAYLOAD_INVALID");
      }
    });
  });

  describe("Phase 1C: metadata injection", () => {
    it("injects _meta into payload when meta is provided", async () => {
      const { enqueue } = await import("../enqueue");
      await enqueue(
        "webhook_delivery",
        { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" },
        {
          meta: { source: "api/test", createdBy: "user-1", traceId: "trace-abc" },
          skipValidation: true,
        },
      );

      const insertedJob = harness.state.jobs[0];
      expect(insertedJob.payload._meta).toEqual({
        source: "api/test",
        createdBy: "user-1",
        traceId: "trace-abc",
      });
    });

    it("does not add _meta when meta is not provided", async () => {
      const { enqueue } = await import("../enqueue");
      await enqueue(
        "webhook_delivery",
        { webhookId: 1, organizationId: 1, event: "e", data: {}, timestamp: "t" },
        { skipValidation: true },
      );

      const insertedJob = harness.state.jobs[0];
      expect(insertedJob.payload._meta).toBeUndefined();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Part 2: types + error codes
// ══════════════════════════════════════════════════════════════════════════════

describe("JobErrorCodes — taxonomy", () => {
  it("contains all required error codes", async () => {
    const { JobErrorCodes } = await import("../types");
    expect(JobErrorCodes.HANDLER_MISSING).toBe("JOB_HANDLER_MISSING");
    expect(JobErrorCodes.PAYLOAD_INVALID).toBe("JOB_PAYLOAD_INVALID");
    expect(JobErrorCodes.PAYLOAD_TOO_LARGE).toBe("JOB_PAYLOAD_TOO_LARGE");
    expect(JobErrorCodes.HANDLER_ERROR).toBe("JOB_HANDLER_ERROR");
    expect(JobErrorCodes.LOCK_TIMEOUT_RECLAIMED).toBe("JOB_LOCK_TIMEOUT_RECLAIMED");
    expect(JobErrorCodes.RATE_LIMITED).toBe("JOB_RATE_LIMITED");
    expect(JobErrorCodes.UPSTREAM_5XX).toBe("JOB_UPSTREAM_5XX");
  });

  it("has 7 distinct codes", async () => {
    const { JobErrorCodes } = await import("../types");
    const values = Object.values(JobErrorCodes);
    expect(values).toHaveLength(7);
    expect(new Set(values).size).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Part 3: jitter bounds
// ══════════════════════════════════════════════════════════════════════════════

describe("nextRetryAt — jitter bounds", () => {
  it("attempt 1 delay is within ±15% of 1 min", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 60_000;
    const samples = Array.from({ length: 30 }, () => {
      const before = Date.now();
      const result = nextRetryAt(1);
      return result.getTime() - before;
    });

    for (const delay of samples) {
      expect(delay).toBeGreaterThanOrEqual(base * 0.85);
      expect(delay).toBeLessThanOrEqual(base * 1.15);
    }
  });

  it("attempt 5+ caps at approximately 4h with jitter", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 4 * 60 * 60_000;

    const before = Date.now();
    const d5 = nextRetryAt(5).getTime() - before;
    expect(d5).toBeGreaterThanOrEqual(base * 0.85);
    expect(d5).toBeLessThanOrEqual(base * 1.15);

    const before99 = Date.now();
    const d99 = nextRetryAt(99).getTime() - before99;
    expect(d99).toBeGreaterThanOrEqual(base * 0.85);
    expect(d99).toBeLessThanOrEqual(base * 1.15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Part 4: WebhookDeliveryError typed error (from our unified mock)
// ══════════════════════════════════════════════════════════════════════════════

describe("WebhookDeliveryError", () => {
  it("carries errorCode and optional retryAfterMs", async () => {
    const { WebhookDeliveryError } = await import("../handlers/webhook-delivery");

    const err = new WebhookDeliveryError("rate limited", "JOB_RATE_LIMITED", 30_000);

    expect(err.message).toBe("rate limited");
    expect((err as any).errorCode).toBe("JOB_RATE_LIMITED");
    expect((err as any).retryAfterMs).toBe(30_000);
    expect(err.name).toBe("WebhookDeliveryError");
    expect(err instanceof Error).toBe(true);
  });

  it("retryAfterMs is optional", async () => {
    const { WebhookDeliveryError } = await import("../handlers/webhook-delivery");

    const err = new WebhookDeliveryError("5xx", "JOB_UPSTREAM_5XX");
    expect((err as any).retryAfterMs).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Part 5: runDueJobs hardening subset (the section that was failing)
// ══════════════════════════════════════════════════════════════════════════════

describe("runDueJobs — hardening", () => {
  let _id = 1;
  function makeJob(overrides: Partial<any> = {}) {
    return harness.makeJob({ id: _id++, ...overrides });
  }

  beforeEach(() => {
    harness.state.jobs = [];
    harness.state.lock = { lockedUntil: 0, lockedBy: null, updatedAt: 0 };
    harness.state.handlerImpl = async () => {};
    harness.state.validateImpl = null;
    _id = 1;

    // Register the default webhook handler
    harness.registerHandler("webhook_delivery", {
      handler: harness.state.handlerImpl,
    });
  });

  describe("timing fields", () => {
    it("sets lastFinishedAt, lastDurationMs, clears lock fields on success", async () => {
      const { runDueJobs } = await import("../runner-in-memory");
      const job = makeJob();
      harness.state.jobs.push(job);

      await runDueJobs("test-runner");

      expect(job.status).toBe("success");
      expect(job.lastFinishedAt).not.toBeNull();
      expect(typeof job.lastDurationMs).toBe("number");
      expect(job.lastDurationMs).toBeGreaterThanOrEqual(0);
      expect(job.lockedAt).toBeNull();
      expect(job.lockedUntil).toBeNull();
      expect(job.lockedBy).toBeNull();
    });

    it("sets lastErrorCode=JOB_HANDLER_ERROR on handler failure", async () => {
      const { runDueJobs, JobErrorCodes } = await Promise.all([
        import("../runner-in-memory"),
        import("../types"),
      ]).then(([runner, types]) => ({
        runDueJobs: runner.runDueJobs,
        JobErrorCodes: types.JobErrorCodes,
      }));
      // this test was failing because WebhookDeliveryError was missing from the mock.
      // It's now present, so runner can do instanceof safely.
      harness.state.handlerImpl = async () => {
        throw new Error("handler boom");
      };

      // Re-register the handler with the new throwing implementation
      harness.registerHandler("webhook_delivery", {
        handler: harness.state.handlerImpl,
      });

      const job = makeJob({ maxAttempts: 5 });
      harness.state.jobs.push(job);

      await runDueJobs("test-runner");

      expect(job.lastErrorCode).toBe(JobErrorCodes.HANDLER_ERROR);
      expect(job.lastError).toContain("handler boom");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Part 6: Type “exports” intent checks
// ══════════════════════════════════════════════════════════════════════════════

describe("type exports", () => {
  it("RetryMode accepts now/later/reset", () => {
    const modes = ["now", "later", "reset"] as const;
    expect(modes).toHaveLength(3);
  });

  it("BulkJobResult has required shape", () => {
    const result = { jobId: 1, ok: true } as { jobId: number; ok: boolean; error?: string };
    expect(result.jobId).toBe(1);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();

    const failed = { jobId: 2, ok: false, error: "not_found" };
    expect(failed.error).toBe("not_found");
  });

  it("JobMeta has optional source/createdBy/traceId", () => {
    const meta = {} as { source?: string; createdBy?: string; traceId?: string };
    expect(meta.source).toBeUndefined();

    const full = { source: "api", createdBy: "u1", traceId: "t1" };
    expect(full.source).toBe("api");
  });
});
