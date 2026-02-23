import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockLimit: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;
let mockSelect: ReturnType<typeof vi.fn>;

vi.mock("@/db", () => {
  mockLimit = vi.fn(() => Promise.resolve([{ "1": 1 }]));
  mockFrom = vi.fn(() => ({ limit: mockLimit }));
  mockSelect = vi.fn(() => ({ from: mockFrom }));
  return { db: { select: mockSelect } };
});

describe("/api/health redis skip", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // ✅ Ensure no db module complains at import time
    process.env.TURSO_CONNECTION_URL = process.env.TURSO_CONNECTION_URL ?? "libsql://test";
    process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "test-token";

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("marks redis healthy when not configured", async () => {
    // ✅ Import route only AFTER env is set and mocks are registered
    const { GET } = await import("@/app/api/health/route");

    const req = new NextRequest("http://localhost:3000/api/health");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.redis.status).toBe("healthy");
  });
});
