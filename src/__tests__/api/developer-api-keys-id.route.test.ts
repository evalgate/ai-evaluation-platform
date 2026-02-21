import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  ctx: {
    authenticated: true,
    userId: "u1",
    organizationId: 1,
    role: "admin",
    scopes: ["api_keys:write"],
    authType: "session",
  },
  updateQueue: [] as unknown[],
  setCalls: [] as unknown[],
}));

type Chain = {
  update: () => Chain;
  set: (payload: unknown) => Chain;
  where: () => Chain;
  returning: () => Promise<unknown[]>;
  select: () => Chain;
  from: () => Chain;
  limit: () => Chain;
  orderBy: () => Chain;
  offset: () => Chain;
  then?: (onFulfilled: (value: unknown) => unknown) => Promise<unknown>;
};

const createChain = (result: unknown) => {
  const b: Chain = {
    update: vi.fn(() => b),
    set: vi.fn((payload: unknown) => {
      state.setCalls.push(payload);
      return b;
    }),
    where: vi.fn(() => b),
    returning: vi.fn(() => Promise.resolve(result as unknown[])),
    select: vi.fn(() => b),
    from: vi.fn(() => b),
    limit: vi.fn(() => b),
    orderBy: vi.fn(() => b),
    offset: vi.fn(() => b),
    // biome-ignore lint/suspicious/noThenProperty: Drizzle-style thenable mock for await in tests
    then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),
  } as Chain;
  return b;
};

vi.mock("@/db", () => ({
  db: {
    select: () => createChain(state.updateQueue.shift() ?? []),
    update: () => createChain(state.updateQueue.shift() ?? []),
    selectOne: () => createChain(state.updateQueue.shift() ?? null),
  },
}));

vi.mock("@/lib/services/audit.service", () => ({
  auditService: {
    log: vi.fn(async () => {}),
  },
}));

vi.mock("@/db/schema", () => ({
  apiKeys: {
    id: "id",
    organizationId: "organizationId",
    revokedAt: "revokedAt",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/errors", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/errors")>();
  return { ...original };
});

vi.mock("@/lib/api/secure-route", () => ({
  secureRoute: (handler: unknown) => {
    return async (req: NextRequest, props: { params: Promise<Record<string, string>> }) => {
      const params = await props.params;
      if (!state.ctx.authenticated) {
        return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return (handler as any)(req, state.ctx, params);
    };
  },
}));

let DELETE: any;
beforeAll(async () => {
  const module = await import("@/app/api/developer/api-keys/[id]/route");
  DELETE = module.DELETE;
});

describe("DELETE /api/developer/api-keys/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.updateQueue.length = 0;
    state.setCalls.length = 0;
    state.ctx.authenticated = true;
    state.ctx.role = "admin";
  });

  it("sets revokedAt timestamp (soft revoke) and returns success", async () => {
    // Set up mock data: first select (existing key), then update result
    state.updateQueue.push([{ id: 123, revokedAt: null }]); // select existing key
    state.updateQueue.push([{ id: 123, revokedAt: new Date().toISOString() }]); // update result

    const req = new NextRequest("http://localhost/api/developer/api-keys/123", {
      method: "DELETE",
    });
    const res = await DELETE(req as unknown, { params: Promise.resolve({ id: "123" }) } as unknown);

    expect([200, 204]).toContain(res.status);
    expect(state.setCalls.length).toBeGreaterThan(0);
    expect(state.setCalls[0]).toHaveProperty("revokedAt");
  });

  it("returns 404 when key not found", async () => {
    // Set up mock data: select returns empty array (key not found)
    state.updateQueue.push([]); // select returns no results

    const req = new NextRequest("http://localhost/api/developer/api-keys/999", {
      method: "DELETE",
    });
    const res = await DELETE(req as unknown, { params: Promise.resolve({ id: "999" }) } as unknown);

    expect(res.status).toBe(404);
  });
});
