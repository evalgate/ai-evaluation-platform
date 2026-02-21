import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  return {
    mockLimit: vi.fn(),
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
  };
});

vi.mock("@/db", () => {
  h.mockLimit.mockImplementation(() => Promise.resolve([{ "1": 1 }]));
  h.mockFrom.mockImplementation(() => ({ limit: h.mockLimit }));
  h.mockSelect.mockImplementation(() => ({ from: h.mockFrom }));

  return {
    db: { select: h.mockSelect },
  };
});

const { GET } = await import("@/app/api/health/route");

describe("/api/health", () => {
  const healthyFetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ result: "PONG" }),
    } as Response);

  beforeEach(() => {
    vi.clearAllMocks();
    h.mockLimit.mockReset().mockImplementation(() => Promise.resolve([{ "1": 1 }]));
    h.mockFrom.mockReset().mockImplementation(() => ({ limit: h.mockLimit }));
    h.mockSelect.mockReset().mockImplementation(() => ({ from: h.mockFrom }));
    global.fetch = vi.fn(healthyFetch) as unknown as typeof fetch;

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("returns health status", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
  });

  it("marks unhealthy when database check fails", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");
    h.mockLimit.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("unhealthy");
  });

  it("marks redis as degraded when the ping fails", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");

    process.env.UPSTASH_REDIS_REST_URL = "https://fake";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false } as Response),
    ) as unknown as typeof fetch;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("degraded");
    expect(data.checks.redis.status).toBe("unhealthy");
  });
});
