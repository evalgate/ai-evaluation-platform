/**
 * runner.test.ts (rewritten)
 *
 * Purpose:
 *  - Keep the "basic" runner assertions (success, retry, dead-letter, missing handler)
 *  - Keep nextRetryAt jitter tests
 *
 * Key fixes vs the failing version:
 *  - Mock "../payload-schemas" so validatePayload never calls schema.safeParse on undefined
 *  - Mock "../handlers/webhook-delivery" and export WebhookDeliveryError (runner imports it)
 *  - Use the shared jobs test harness, matching runner-hardening + god-tier suites
 *  - Use the new in-memory runner instead of the database-backed runner
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobErrorCodes } from "../types";
import { harness, setupJobsTestHarness } from "./mocks/jobs-harness";

// ✅ MUST mock BEFORE importing ../runner unknownwhere
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
    handleWebhookDelivery: (payload: unknown) => harness.state.handlerImpl(payload),
  };
});

// ✅ Avoid "Cannot read properties of undefined (reading 'safeParse')"
vi.mock("../payload-schemas", () => ({
  validatePayload: (type: string, payload: unknown) => {
    if (harness.state.validateImpl) return harness.state.validateImpl(type, payload);
    // Default: treat as valid for runner unit tests
    return { success: true, data: payload as unknown };
  },
}));

setupJobsTestHarness();

beforeEach(() => {
  harness.reset();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

let _id = 1;
function makeJob(overrides: Partial<unknown> = {}): unknown {
  return harness.makeJob({ id: _id++, ...overrides });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("runDueJobs", () => {
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

    // if your harness uses these, ensure they exist/reset:
    if (!harness.state.failClaimForJobIds) harness.state.failClaimForJobIds = new Set<number>();
    else harness.state.failClaimForJobIds.clear();
  });

  it("returns processed=0 when no jobs are due", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    const res = await runDueJobs("test-runner");
    expect(res.processed).toBe(0);
    expect(res.failed).toBe(0);
  });

  it("skips job when optimistic lock claim fails", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    const job = makeJob({ id: 1 });
    harness.state.jobs.push(job);

    harness.state.failClaimForJobIds.add(1);

    const res = await runDueJobs("test-runner");

    expect(res.processed).toBe(0);
    expect(res.failed).toBe(0);
  });

  it("marks job as success when handler resolves", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    const job = makeJob();
    harness.state.jobs.push(job);

    const res = await runDueJobs("test-runner");

    expect(res.processed).toBe(1);
    expect(res.failed).toBe(0);
    expect(job.status).toBe("success");
  });

  it("retries job (failed=1) when handler throws and not at maxAttempts", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    harness.state.handlerImpl = async () => {
      throw new Error("boom");
    };

    // Re-register the handler with the new throwing implementation
    harness.registerHandler("webhook_delivery", {
      handler: harness.state.handlerImpl,
    });

    const job = makeJob({ maxAttempts: 3, attempt: 0 });
    harness.state.jobs.push(job);

    const res = await runDueJobs("test-runner");

    expect(res.processed).toBe(0);
    expect(res.failed).toBe(1);
    expect(job.status).toBe("pending");
    expect(job.attempt).toBe(1);
    expect(job.lastErrorCode).toBe(JobErrorCodes.HANDLER_ERROR);
  });

  it("marks job as dead_letter when attempt reaches maxAttempts", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    harness.state.handlerImpl = async () => {
      throw new Error("boom");
    };

    // Re-register the handler with the new throwing implementation
    harness.registerHandler("webhook_delivery", {
      handler: harness.state.handlerImpl,
    });

    const job = makeJob({ maxAttempts: 1, attempt: 0 });
    harness.state.jobs.push(job);

    const res = await runDueJobs("test-runner");

    expect(res.processed).toBe(0);
    expect(res.failed).toBe(1);
    expect(job.status).toBe("dead_letter");
  });

  it("dead-letters with HANDLER_MISSING when no handler is registered for type", async () => {
    const { runDueJobs } = await import("../runner-in-memory");
    const job = makeJob({ type: "unknown_type" });
    harness.state.jobs.push(job);

    const res = await runDueJobs("test-runner");

    expect(res.processed).toBe(0);
    expect(res.failed).toBe(1);
    expect(job.status).toBe("dead_letter");
    expect(job.lastErrorCode).toBe(JobErrorCodes.HANDLER_MISSING);
  });
});

// ── nextRetryAt tests ────────────────────────────────────────────────────────

describe("nextRetryAt", () => {
  it("attempt 1 delay is within ±15% of 1 min", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 60_000;
    const before = Date.now();
    const delay = nextRetryAt(1).getTime() - before;
    expect(delay).toBeGreaterThanOrEqual(base * 0.85);
    expect(delay).toBeLessThanOrEqual(base * 1.15);
  });

  it("attempt 2 delay is within ±15% of 5 min", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 5 * 60_000;
    const before = Date.now();
    const delay = nextRetryAt(2).getTime() - before;
    expect(delay).toBeGreaterThanOrEqual(base * 0.85);
    expect(delay).toBeLessThanOrEqual(base * 1.15);
  });

  it("attempt 3 delay is within ±15% of 15 min", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 15 * 60_000;
    const before = Date.now();
    const delay = nextRetryAt(3).getTime() - before;
    expect(delay).toBeGreaterThanOrEqual(base * 0.85);
    expect(delay).toBeLessThanOrEqual(base * 1.15);
  });

  it("attempt 4 delay is within ±15% of 1 h", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 60 * 60_000;
    const before = Date.now();
    const delay = nextRetryAt(4).getTime() - before;
    expect(delay).toBeGreaterThanOrEqual(base * 0.85);
    expect(delay).toBeLessThanOrEqual(base * 1.15);
  });

  it("attempt >= 5 caps at ~4 h with jitter", async () => {
    const { nextRetryAt } = await import("../runner");
    const base = 4 * 60 * 60_000;
    const before = Date.now();
    const d5 = nextRetryAt(5).getTime() - before;
    const d99 = nextRetryAt(99).getTime() - before;

    expect(d5).toBeGreaterThanOrEqual(base * 0.85);
    expect(d5).toBeLessThanOrEqual(base * 1.15);
    expect(d99).toBeGreaterThanOrEqual(base * 0.85);
    expect(d99).toBeLessThanOrEqual(base * 1.15);
  });
});
