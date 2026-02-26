/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  it("should return false when window width is above breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true when window width is below breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should respond to matchMedia change events", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    let changeHandler: (() => void) | null = null;
    const mockMql = {
      matches: false,
      media: "(max-width: 767px)",
      onchange: null,
      addEventListener: vi.fn((_, handler) => {
        changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    vi.spyOn(window, "matchMedia").mockReturnValue(mockMql as unknown as MediaQueryList);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    act(() => {
      changeHandler?.();
    });
    expect(result.current).toBe(true);
  });
});
