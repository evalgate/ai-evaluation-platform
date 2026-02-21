import { describe, expect, it } from "vitest";
import { parsePaginationParams } from "@/lib/validation";

describe("parsePaginationParams", () => {
  it("defaults limit/offset when missing", () => {
    const sp = new URL("http://x.test").searchParams;
    const { limit, offset } = parsePaginationParams(sp);
    expect(typeof limit).toBe("number");
    expect(typeof offset).toBe("number");
    expect(limit).toBeGreaterThan(0);
    expect(offset).toBeGreaterThanOrEqual(0);
  });

  it("throws validation error for invalid values", async () => {
    const sp = new URL("http://x.test?limit=-5&offset=-10").searchParams;

    // The function throws validation errors for invalid values, it doesn't clamp them
    expect(() => parsePaginationParams(sp)).toThrow();
  });

  it("parses provided values", () => {
    const sp = new URL("http://x.test?limit=5&offset=10").searchParams;
    const { limit, offset } = parsePaginationParams(sp);
    expect(limit).toBe(5);
    expect(offset).toBe(10);
  });
});
