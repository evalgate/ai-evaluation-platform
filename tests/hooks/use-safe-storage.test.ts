/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { getBearerToken, useSafeStorage } from "@/hooks/use-safe-storage";

describe("useSafeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return null initially when key does not exist", () => {
    const { result } = renderHook(() => useSafeStorage("test-key"));
    // After effect runs, value is null
    expect(result.current[0]).toBe(null);
  });

  it("should return stored string value", () => {
    localStorage.setItem("mykey", "hello");
    const { result } = renderHook(() => useSafeStorage("mykey"));
    expect(result.current[0]).toBe("hello");
  });

  it("should return parsed JSON value", () => {
    localStorage.setItem("json-key", JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useSafeStorage("json-key"));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("should use default value when key is missing", () => {
    const { result } = renderHook(() => useSafeStorage("missing", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should set and persist value", () => {
    const { result } = renderHook(() => useSafeStorage<string>("write-key"));
    act(() => {
      result.current[1]("new-value");
    });
    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("write-key")).toBe("new-value");
  });

  it("should remove value when set to null", () => {
    localStorage.setItem("rm-key", "val");
    const { result } = renderHook(() => useSafeStorage("rm-key"));
    act(() => {
      result.current[1](null);
    });
    expect(result.current[0]).toBe(null);
    expect(localStorage.getItem("rm-key")).toBe(null);
  });

  it("should report loading state", () => {
    const { result } = renderHook(() => useSafeStorage("any"));
    // After effect, isLoading becomes false
    expect(result.current[2]).toBe(false);
  });
});

describe("getBearerToken", () => {
  it("should return 'cookie-session' in browser environment", () => {
    expect(getBearerToken()).toBe("cookie-session");
  });
});
