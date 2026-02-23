import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queues = vi.hoisted(() => ({
  selectQueue: [] as unknown[],
  insertQueue: [] as unknown[],
}));

const createChain = (result: unknown) => {
  const b: Record<string, unknown> = {
    select: vi.fn(() => b),
    from: vi.fn(() => b),
    where: vi.fn(() => b),
    limit: vi.fn(() => b),

    insert: vi.fn(() => b),
    values: vi.fn(() => b),
    returning: vi.fn(() => b),

    // biome-ignore lint/suspicious/noThenProperty: test mock
    then: (onFulfilled: unknown) =>
      Promise.resolve(result).then(onFulfilled as (value: unknown) => unknown),
    catch: (onRejected: unknown) =>
      Promise.resolve(result).catch(onRejected as (reason: unknown) => unknown),
  };
  return b;
};

vi.mock("@/db", () => ({
  db: {
    select: () => createChain(queues.selectQueue.shift() ?? []),
    insert: () => createChain(queues.insertQueue.shift() ?? []),
  },
}));

vi.mock("@/lib/api/secure-route", () => ({
  secureRoute: (handler: unknown) => {
    return async (req: NextRequest, _props: unknown) => {
      // emulate secureRoute ctx + params
      return handler(req, { authType: "session", userId: "u1", organizationId: 1 }, { id: "123" });
    };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/errors", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/errors")>();
  return { ...original };
});

// Keep parseBody simple and controlled
vi.mock("@/lib/api/parse", () => ({
  parseBody: vi.fn(async (req: NextRequest) => {
    const data = await req.json();
    return { ok: true, data };
  }),
}));

// Schema columns only need to exist for eq() usage; we can safely string them.
vi.mock("@/db/schema", () => ({
  evaluations: {
    id: "id",
    organizationId: "organizationId",
    status: "status",
  },
  evaluationRuns: { id: "id" },
  evaluationRunResults: { id: "id" },
  testCases: { id: "id" }, // Add missing testCases
}));

const { POST } = await import("@/app/api/evaluations/[id]/runs/import/route");

describe("POST /api/evaluations/[id]/runs/import (more)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queues.selectQueue.length = 0;
    queues.insertQueue.length = 0;
  });

  it("rejects import when evaluation belongs to different organization", async () => {
    // DB lookup returns no results because org doesn't match (the query filters by org)
    queues.selectQueue.push([]);

    const req = new NextRequest("http://localhost/api/evaluations/123/runs/import", {
      method: "POST",
      body: JSON.stringify({
        environment: "ci",
        results: [],
        importClientVersion: "test",
      }),
    });

    const res = await (POST as (req: unknown, opts: unknown) => Promise<Response>)(
      req as unknown,
      {} as unknown,
    );
    expect(res.status).toBe(404); // Should be 404, not 403
  });

  it("rejects import when evaluation is archived", async () => {
    queues.selectQueue.push([{ id: 123, organizationId: 1, status: "archived" }]);

    const req = new NextRequest("http://localhost/api/evaluations/123/runs/import", {
      method: "POST",
      body: JSON.stringify({
        environment: "ci",
        results: [{ testCaseId: "t1", output: "x" }],
        importClientVersion: "test",
      }),
    });

    const res = await (POST as (req: unknown, opts: unknown) => Promise<Response>)(
      req as unknown,
      {} as unknown,
    );

    // depending on your semantics it might be 400 or 409
    expect([400, 409]).toContain(res.status);
    expect(queues.insertQueue.length).toBe(0);
  });
});
