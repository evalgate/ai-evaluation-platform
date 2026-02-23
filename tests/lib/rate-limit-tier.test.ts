import { describe, expect, it } from "vitest";
import { getRateLimitTier } from "@/lib/rate-limit";

describe("getRateLimitTier", () => {
  it("undefined → anonymous", () => {
    expect(getRateLimitTier(undefined)).toBe("anonymous");
  });

  it("free → free", () => {
    expect(getRateLimitTier("free")).toBe("free");
  });

  it("pro → pro", () => {
    expect(getRateLimitTier("pro")).toBe("pro");
  });

  it("enterprise → enterprise", () => {
    expect(getRateLimitTier("enterprise")).toBe("enterprise");
  });

  it("case-insensitive: Enterprise Plan → enterprise", () => {
    expect(getRateLimitTier("Enterprise Plan")).toBe("enterprise");
  });

  it("case-insensitive: PRO → pro", () => {
    expect(getRateLimitTier("PRO")).toBe("pro");
  });

  it("case-insensitive: FREE → free", () => {
    expect(getRateLimitTier("FREE")).toBe("free");
  });

  it("case-insensitive: ENTERPRISE → enterprise", () => {
    expect(getRateLimitTier("ENTERPRISE")).toBe("enterprise");
  });

  it("unknown plan string → anonymous", () => {
    expect(getRateLimitTier("premium")).toBe("anonymous");
    expect(getRateLimitTier("basic")).toBe("anonymous");
    expect(getRateLimitTier("")).toBe("anonymous");
  });

  it("partial matches work", () => {
    expect(getRateLimitTier("My Enterprise Plan")).toBe("enterprise");
    expect(getRateLimitTier("Pro Tier")).toBe("pro");
    expect(getRateLimitTier("Free Trial")).toBe("free");
  });
});
