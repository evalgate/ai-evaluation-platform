/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardNavigation, useKeyboardShortcuts } from "@/hooks/use-keyboard-navigation";

describe("useKeyboardNavigation", () => {
  it("should return containerRef and currentIndex", () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.setCurrentIndex).toBeDefined();
  });

  it("should use initialIndex when provided", () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, initialIndex: 3 }));
    expect(result.current.currentIndex).toBe(3);
  });

  it("should accept all options without throwing", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    expect(() =>
      renderHook(() =>
        useKeyboardNavigation({
          itemCount: 10,
          enableArrowKeys: true,
          enableEscape: true,
          enableSelect: true,
          enableTabNavigation: true,
          loop: false,
          onSelect,
          onClose,
        }),
      ),
    ).not.toThrow();
  });
});

describe("useKeyboardShortcuts", () => {
  it("should register and invoke keyboard shortcut", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+k": handler }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not invoke handler for non-matching keys", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+k": handler }));

    const event = new KeyboardEvent("keydown", {
      key: "j",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
