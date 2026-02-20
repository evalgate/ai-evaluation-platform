/**
 * enqueue() idempotency + basic insertion tests (Phase 2)
 *
 * Updated for new enqueue() behavior:
 *  - payload validation runs first (tests now use a schema-valid payload)
 *  - idempotency is atomic via insert().onConflictDoNothing().returning()
 *    with a follow-up select() when conflict returns no rows
 *
 * Covers:
 *  - New job is inserted and returns an id
 *  - Duplicate idempotency key returns existing id without inserting twice
 *  - No idempotency key always inserts
 *  - organizationId and maxAttempts are forwarded
 *  - runAt defaults to ~now
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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("enqueue()", () => {
  beforeEach(() => {
    // Reset enqueue-specific state
    harness.state.existingByKey = {};
    harness.state.nextJobId = 1;
    harness.state.jobs = [];
    harness.state.lock = { lockedUntil: 0, lockedBy: null, updatedAt: 0 };
    harness.state.handlerImpl = async () => {};
    harness.state.validateImpl = null;
  });

  // Schema-valid payload per your job system expectations
  const validWebhookPayload = {
    webhookId: 42,
    organizationId: 1,
    event: "run.completed",
    data: {},
    timestamp: new Date().toISOString(),
  };

  it("inserts a new job and returns a numeric id", async () => {
    const { enqueue } = await import("../enqueue");
    const id = await enqueue("webhook_delivery", validWebhookPayload);
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);
    expect(harness.state.jobs).toHaveLength(1);
  });

  it("returns existing id when idempotency key already exists (no duplicate insert)", async () => {
    const { enqueue } = await import("../enqueue");
    const key = "org-1-webhook-42-event-run.completed";

    const id1 = await enqueue("webhook_delivery", validWebhookPayload, { idempotencyKey: key });
    const id2 = await enqueue("webhook_delivery", validWebhookPayload, { idempotencyKey: key });

    expect(id1).toBe(id2);
    // Only one insert should have occurred
    expect(harness.state.jobs.filter((j: any) => j.idempotencyKey === key)).toHaveLength(1);
  });

  it("inserts multiple jobs when no idempotency key is provided", async () => {
    const { enqueue } = await import("../enqueue");

    const id1 = await enqueue("webhook_delivery", { ...validWebhookPayload, webhookId: 1 });
    const id2 = await enqueue("webhook_delivery", { ...validWebhookPayload, webhookId: 2 });

    expect(id1).not.toBe(id2);
    expect(harness.state.jobs).toHaveLength(2);
  });

  it("different idempotency keys produce separate jobs", async () => {
    const { enqueue } = await import("../enqueue");

    const id1 = await enqueue(
      "webhook_delivery",
      { ...validWebhookPayload, webhookId: 1 },
      { idempotencyKey: "key-a" },
    );
    const id2 = await enqueue(
      "webhook_delivery",
      { ...validWebhookPayload, webhookId: 2 },
      { idempotencyKey: "key-b" },
    );

    expect(id1).not.toBe(id2);
    expect(harness.state.jobs).toHaveLength(2);
  });

  it("forwards organizationId to inserted row (top-level option)", async () => {
    const { enqueue } = await import("../enqueue");
    await enqueue("webhook_delivery", validWebhookPayload, { organizationId: 99 });
    expect(harness.state.jobs[0].organizationId).toBe(99);
  });

  it("forwards maxAttempts to inserted row", async () => {
    const { enqueue } = await import("../enqueue");
    await enqueue("webhook_delivery", validWebhookPayload, { maxAttempts: 3 });
    expect(harness.state.jobs[0].maxAttempts).toBe(3);
  });

  it("defaults maxAttempts to 5 when not specified", async () => {
    const { enqueue } = await import("../enqueue");
    await enqueue("webhook_delivery", validWebhookPayload);
    expect(harness.state.jobs[0].maxAttempts).toBe(5);
  });

  it("nextRunAt defaults to approximately now", async () => {
    const { enqueue } = await import("../enqueue");
    const before = new Date();
    await enqueue("webhook_delivery", validWebhookPayload);
    const after = new Date();
    const nextRunAt: Date = harness.state.jobs[0].nextRunAt;
    expect(nextRunAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 250);
    expect(nextRunAt.getTime()).toBeLessThanOrEqual(after.getTime() + 250);
  });

  it("respects custom runAt option", async () => {
    const { enqueue } = await import("../enqueue");
    const future = new Date(Date.now() + 60_000);
    await enqueue("webhook_delivery", validWebhookPayload, { runAt: future });
    expect(harness.state.jobs[0].nextRunAt.getTime()).toBeCloseTo(future.getTime(), -2);
  });

  it("inserted job has status=pending and attempt=0", async () => {
    const { enqueue } = await import("../enqueue");
    await enqueue("webhook_delivery", validWebhookPayload);
    expect(harness.state.jobs[0].status).toBe("pending");
    expect(harness.state.jobs[0].attempt).toBe(0);
  });
});
