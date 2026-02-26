/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEvalStream } from "@/hooks/use-eval-stream";

// Minimal EventSource mock
class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  private listeners: Record<string, ((e: { data: string; lastEventId: string }) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    // Simulate async open
    setTimeout(() => this.onopen?.(), 0);
  }

  addEventListener(type: string, handler: (e: { data: string; lastEventId: string }) => void) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  close() {
    // no-op
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.();
  }
}

describe("useEvalStream", () => {
  let mockEs: MockEventSource;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should connect and set connected=true on open", async () => {
    vi.stubGlobal("EventSource", class extends MockEventSource {
      constructor(url: string) {
        super(url);
        mockEs = this;
      }
    });

    const { result } = renderHook(() =>
      useEvalStream({ evaluationId: 1, enabled: true }),
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it("should not connect when disabled", () => {
    let constructed = false;
    vi.stubGlobal("EventSource", class extends MockEventSource {
      constructor(url: string) {
        super(url);
        constructed = true;
      }
    });

    renderHook(() => useEvalStream({ evaluationId: 1, enabled: false }));
    expect(constructed).toBe(false);
  });

  it("should accumulate events from onmessage", async () => {
    vi.stubGlobal("EventSource", class extends MockEventSource {
      constructor(url: string) {
        super(url);
        mockEs = this;
      }
    });

    const { result } = renderHook(() =>
      useEvalStream({ evaluationId: 1, enabled: true }),
    );

    await waitFor(() => expect(result.current.connected).toBe(true));

    const event = { type: "test", data: { foo: 1 }, timestamp: "2026-01-01T00:00:00Z" };
    mockEs.simulateMessage(event);

    await waitFor(() => {
      expect(result.current.events.length).toBe(1);
    });
  });

  it("should set error on connection failure", async () => {
    vi.stubGlobal("EventSource", class extends MockEventSource {
      constructor(url: string) {
        super(url);
        mockEs = this;
        // Simulate open then error
        setTimeout(() => {
          this.onopen?.();
          setTimeout(() => this.onerror?.(), 5);
        }, 0);
      }
    });

    const { result } = renderHook(() =>
      useEvalStream({ evaluationId: 1, enabled: true }),
    );

    await waitFor(() => {
      expect(result.current.error).not.toBe(null);
    });
    expect(result.current.connected).toBe(false);
  });
});
