import { beforeEach, describe, expect, it, vi } from "vitest";

const insertCalls: unknown[] = [];
const updateCalls: unknown[] = [];
const selectQueue: unknown[] = [];

type Chain = {
  select: () => Chain;
  from: () => Chain;
  where: () => Chain;
  limit: () => Chain;
  insert: () => Chain;
  values: (payload: Record<string, unknown>) => Chain;
  update: () => Chain;
  set: (payload: Record<string, unknown>) => Chain;
  returning: () => Promise<unknown[]>;
  // then/catch only exist to allow `await chain` patterns used by Drizzle
  then?: (onFulfilled: (value: unknown) => unknown) => Promise<unknown>;
  catch?: (onRejected: (err: unknown) => unknown) => Promise<unknown>;
};

const createChain = (result: unknown) => {
  const builder: Chain = {
    select: () => builder,
    from: () => builder,
    where: () => builder,
    limit: () => builder,

    insert: () => builder,
    values: (payload: Record<string, unknown>) => {
      insertCalls.push(payload);
      return builder;
    },

    update: () => builder,
    set: (payload: Record<string, unknown>) => {
      updateCalls.push(payload);
      return builder;
    },

    returning: async () => (Array.isArray(result) ? result : [result]),

    // biome-ignore lint/suspicious/noThenProperty: Drizzle-style thenable mock for await in tests
    then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),

    catch: (onRejected: (err: unknown) => unknown) => Promise.resolve(result).catch(onRejected),
  };

  return builder;
};

vi.mock("@/db", () => {
  const db: Record<string, unknown> = {
    select: vi.fn(() => createChain(selectQueue.shift() ?? [])),
    insert: vi.fn(() => createChain([])),
    update: vi.fn(() => createChain([])),
  };
  return { db };
});

vi.mock("@/db/schema", () => ({
  jobs: { id: "id", status: "status", lastError: "lastError" },
  webhookDeliveries: { id: "id" },
  webhooks: { id: "id", organizationId: "organizationId" },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/security/webhook-secrets", () => ({
  decryptWebhookSecret: vi.fn(() => "decrypted-secret"),
}));

const { handleWebhookDelivery } = await import("@/lib/jobs/handlers/webhook-delivery");

describe("webhook delivery handler", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    updateCalls.length = 0;
    selectQueue.length = 0;

    // reset global fetch
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("creates a delivery record when delivery succeeds", async () => {
    // 1) Ensure webhook lookup returns an active webhook with URL
    selectQueue.push([
      {
        id: 1,
        organizationId: 1,
        status: "active",
        url: "https://example.com/webhook",
        // include both possible secret shapes
        secret: "test-secret",
        secretEncrypted: "enc",
        secretIv: "iv",
      },
    ]);

    const okResponse = new Response("Success", { status: 200 });

    // 2) Mock global fetch
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okResponse);

    await handleWebhookDelivery({
      webhookId: 1,
      organizationId: 1,
      event: "test.event",
      data: { test: "data" },
      timestamp: new Date().toISOString(),
    } as Record<string, unknown>);

    // Check fetch was called
    expect(vi.mocked(globalThis.fetch).mock.calls.length).toBe(1);

    // Should write a delivery record
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it("still creates a delivery record when delivery fails", async () => {
    selectQueue.push([
      {
        id: 1,
        organizationId: 1,
        status: "active",
        url: "https://example.com/webhook",
        secretEncrypted: "enc",
        secretIv: "iv",
      },
    ]);

    const failResponse = new Response("Internal Error", { status: 500 });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(failResponse);

    // Handler should throw on 500 errors
    await expect(
      handleWebhookDelivery({
        webhookId: 1,
        organizationId: 1,
        event: "test.event",
        data: { test: "data" },
        timestamp: new Date().toISOString(),
      } as Record<string, unknown>),
    ).rejects.toThrow("HTTP 500: Internal Error");

    // But it should still create a delivery record before throwing
    expect(insertCalls.length).toBeGreaterThan(0);
  });
});
