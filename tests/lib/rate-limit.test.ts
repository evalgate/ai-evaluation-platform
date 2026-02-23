import { describe, expect, it } from "vitest";
import { checkRateLimit, getRateLimitTier } from "@/lib/rate-limit";

describe("rate-limit helpers", () => {
  it("returns unlimited results when Redis is not configured", async () => {
    const identifier = "test-id";
    const result = await checkRateLimit(identifier, "anonymous");

    expect(result.success).toBe(true);
    expect(result.headers["X-RateLimit-Limit"]).toBe("unlimited");
    expect(result.headers["X-RateLimit-Remaining"]).toBe("unlimited");
    expect(result.headers["X-RateLimit-Reset"]).toBe("0");
  });

  it("derives tier from plan names case-insensitively", () => {
    expect(getRateLimitTier("Enterprise")).toBe("enterprise");
    expect(getRateLimitTier("Pro Plus")).toBe("pro");
    expect(getRateLimitTier("FREE-start")).toBe("free");
    expect(getRateLimitTier("unknown")).toBe("anonymous");
    expect(getRateLimitTier(undefined)).toBe("anonymous");
  });
});
