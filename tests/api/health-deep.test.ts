import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub Sentry
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

// Mock request-id
vi.mock("@/lib/api/request-id", () => ({
  extractOrGenerateRequestId: () => "test-request-id",
  runWithRequestIdAsync: async (_id: string, fn: () => Promise<unknown>) => fn(),
  setRequestContext: vi.fn(),
  getRequestContext: () => undefined,
}));

// Mock rate limiting
vi.mock("@/lib/api-rate-limit", () => ({
  withRateLimit: vi.fn((_req: unknown, handler: (r: unknown) => Promise<Response>) =>
    handler(_req),
  ),
}));

// Mock auth
vi.mock("@/lib/autumn-server", () => ({
  requireAuthWithOrg: vi.fn().mockResolvedValue({
    authenticated: true,
    userId: "admin-user",
    organizationId: 1,
    role: "admin",
    scopes: ["admin"],
    authType: "session",
  }),
}));

// Shared DB mock helper — avoids reinventing the vi.hoisted pattern per test file
const { mockDbSelect, resetDbMock, mockDbError } = vi.hoisted(() => {
  // Inline createDbMock here (hoisted scope can't import modules)
  const makeChain = (rows: Record<string, unknown>[] = [{ "1": 1 }]) => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => Promise.resolve(rows));
    return chain;
  };
  const mockDbSelect = vi.fn(() => makeChain());
  const resetDbMock = (rows = [{ "1": 1 }]) => mockDbSelect.mockReturnValue(makeChain(rows));
  const mockDbError = (msg = "DB connection failed") => {
    const chain = makeChain();
    (chain as { limit: ReturnType<typeof vi.fn> }).limit = vi.fn(() =>
      Promise.reject(new Error(msg)),
    );
    mockDbSelect.mockReturnValueOnce(chain);
  };
  return { mockDbSelect, resetDbMock, mockDbError };
});

vi.mock("@/db", () => ({
  db: { select: mockDbSelect },
}));

// Mock fetch for Redis
global.fetch = vi.fn() as unknown as typeof fetch;

import { GET } from "@/app/api/health/deep/route";

const routeContext = { params: Promise.resolve({}) };

describe("/api/health/deep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbMock();

    // Mock successful Redis ping
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "PONG" }),
    } as Response);

    // Set Sentry DSN so sentry check is "ok"
    vi.stubEnv("SENTRY_DSN", "https://test@sentry.io/123");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  it("returns 200 with all checks healthy", async () => {
    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.requestId).toBe("test-request-id");
    expect(data.version).toHaveProperty("git");
    expect(data.version).toHaveProperty("spec", "v1");
    expect(data.version).toHaveProperty("node");
    expect(data.checks.database.status).toBe("healthy");
    expect(data.checks.redis.status).toBe("healthy");
    expect(data.checks.sentry.status).toBe("ok");
    expect(data.totalTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("returns 503 when database is down", async () => {
    mockDbError();

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("unhealthy");
  });

  it("skips Redis check when not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checks.redis.status).toBe("skipped");
    expect(data.checks.redis.responseTimeMs).toBe(0);
  });

  it("returns degraded status when Redis fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("degraded");
    expect(data.checks.database.status).toBe("healthy");
    expect(data.checks.redis.status).toBe("unhealthy");
  });

  it("skips Sentry check when not configured", async () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checks.sentry.status).toBe("skipped");
  });

  it("includes version info with git SHA", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123def456");

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(data.version.git).toBe("abc123def456");
  });

  it("uses dev git SHA when not in production", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");

    const req = new NextRequest("http://localhost:3000/api/health/deep");

    const response = await GET(req, routeContext as never);
    const data = await response.json();

    expect(data.version.git).toBe("dev");
  });
});
