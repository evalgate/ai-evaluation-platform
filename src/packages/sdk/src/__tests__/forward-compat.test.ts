/**
 * Forward-compat smoke test — SDK gracefully handles:
 * - unknown response fields
 * - missing optional fields
 *
 * Shows resilience to partial rollouts (new SDK → slightly older API).
 */

import { describe, expect, it, vi } from "vitest";
import { AIEvalClient } from "../client";

const mockFetch = vi.fn();

describe("Forward compatibility", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("handles unknown response fields without crash", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: "Eval",
        _unknownField: "ignored",
        futureApiField: { nested: true },
      }),
      status: 200,
      headers: new Headers(),
    });

    const client = new AIEvalClient({
      apiKey: "key",
      baseUrl: "http://localhost:3000",
      organizationId: 1,
    });

    const result = await client.evaluations.create({
      name: "Eval",
      type: "unit_test",
      organizationId: 1,
      createdBy: 1,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe("Eval");
  });

  it("handles missing optional fields without crash", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }), // minimal response, many fields omitted
      status: 200,
      headers: new Headers(),
    });

    const client = new AIEvalClient({
      apiKey: "key",
      baseUrl: "http://localhost:3000",
      organizationId: 1,
    });

    const result = await client.evaluations.create({
      name: "Eval",
      type: "unit_test",
      organizationId: 1,
      createdBy: 1,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("handles error response with extra fields and surfaces requestId", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { code: "NOT_FOUND", message: "Not found", requestId: "req-123" },
        _debug: "extra",
      }),
      status: 404,
      headers: new Headers({ "x-request-id": "req-123" }),
    });

    const client = new AIEvalClient({
      apiKey: "key",
      baseUrl: "http://localhost:3000",
      retry: { maxAttempts: 1 },
    });

    await expect(client.request("/api/nonexistent")).rejects.toMatchObject({
      code: "NOT_FOUND",
      requestId: "req-123",
    });
  });
});
