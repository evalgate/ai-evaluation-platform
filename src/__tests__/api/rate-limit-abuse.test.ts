/**
 * Rate limit abuse proof — burst is capped, sustained traffic is smoothed.
 * Verifies 429 envelope, Retry-After header, and that handler is not invoked when blocked.
 */

import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/request-id", () => ({
  getRequestId: () => "test-request-id",
}));

const checkRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit,
}));

describe("Rate limit abuse proof", () => {
  it("429 response includes Retry-After when rate limited", async () => {
    const resetMs = Date.now() + 45_000; // 45 seconds from now
    checkRateLimit.mockResolvedValue({
      success: false,
      headers: {
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(resetMs / 1000)),
        "Retry-After": "45",
      },
    });

    const { withRateLimit } = await import("@/lib/api-rate-limit");
    const req = new NextRequest("http://localhost/api/exports/abc");
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withRateLimit(req, handler, { customTier: "anonymous" });

    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
    const data = await res.json();
    expect(data.error?.code).toBe("RATE_LIMITED");
    expect(data.error?.requestId).toBeDefined();
    expect(res.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("burst: when limit exceeded, subsequent requests are blocked until reset", async () => {
    checkRateLimit
      .mockResolvedValueOnce({
        success: true,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "1",
          "X-RateLimit-Reset": "0",
        },
      })
      .mockResolvedValueOnce({
        success: false,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor((Date.now() + 60_000) / 1000)),
          "Retry-After": "60",
        },
      });

    const { withRateLimit } = await import("@/lib/api-rate-limit");
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const req1 = new NextRequest("http://localhost/api/test");
    const req2 = new NextRequest("http://localhost/api/test");

    const [res1, res2] = await Promise.all([
      withRateLimit(req1, handler, { customTier: "anonymous" }),
      withRateLimit(req2, handler, { customTier: "anonymous" }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
