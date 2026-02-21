import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectQueue: unknown[] = [];
const updateSetCalls: unknown[] = [];

const createChain = (result: unknown) => {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    update: vi.fn(() => builder),
    set: vi.fn((payload: unknown) => {
      updateSetCalls.push(payload);
      return builder;
    }),
    returning: vi.fn(() => builder),
    // biome-ignore lint/suspicious/noThenProperty: test mock
    then: (onFulfilled: (value: unknown) => unknown) => {
      return Promise.resolve(result).then(onFulfilled);
    },
    catch(onRejected: (err: unknown) => unknown) {
      return Promise.resolve(result).catch(onRejected);
    },
  };
  return builder;
};

vi.mock("@/db", () => ({
  db: {
    select: () => createChain(selectQueue.shift() ?? []),
    update: () => createChain(null),
  },
}));

vi.mock("@/lib/api/secure-route", () => ({
  secureRoute: (handler: unknown) => {
    return async (req: NextRequest, props: { params: Promise<Record<string, string>> }) => {
      const params = await props.params;
      return handler(req, { authType: "anonymous" }, params);
    };
  },
}));

vi.mock("@/lib/api/request-id", () => ({ getRequestId: () => "request-id" }));

vi.mock("@/lib/api/errors", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/errors")>();
  return { ...original };
});

vi.mock("@/db/schema", () => ({
  sharedExports: {
    viewCount: "viewCount",
    shareId: "shareId",
    id: "id",
  },
}));

const { GET } = await import("@/app/api/exports/[shareId]/route");

const baseRow = {
  id: 1,
  shareId: "share-link",
  shareScope: "evaluation",
  organizationId: 1,
  exportData: { summary: {} },
  exportHash: "hash-123",
  isPublic: true,
  revokedAt: null as string | null,
  createdAt: new Date().toISOString(),
  updatedAt: null as string | null,
  expiresAt: null as string | null,
  viewCount: 0,
};

describe("GET /api/exports/[shareId] (more)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue.length = 0;
    updateSetCalls.length = 0;
  });

  it("returns 404 when shareId not found", async () => {
    selectQueue.push([]); // no row

    const req = new NextRequest("http://localhost/api/exports/missing");
    const res = await GET(req, { params: Promise.resolve({ shareId: "missing" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("NOT_FOUND");
  });

  it("increments viewCount on successful fetch", async () => {
    selectQueue.push([{ ...baseRow, viewCount: 7 }]);

    const req = new NextRequest("http://localhost/api/exports/share-link");
    const res = await GET(req, { params: Promise.resolve({ shareId: "share-link" }) });

    expect(res.status).toBe(200);

    // don't overfit exact drizzle expression, just ensure set(viewCount) happens
    expect(updateSetCalls.length).toBeGreaterThan(0);
    expect(updateSetCalls[0]).toHaveProperty("viewCount");
  });
});
