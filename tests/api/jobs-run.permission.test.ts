import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/errors", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/errors")>();
  return { ...original };
});

vi.mock("@/lib/api/secure-route", () => ({
  secureRoute: (handler: unknown) => {
    return async (req: NextRequest) =>
      handler(req, {
        userId: "u1",
        organizationId: 1,
        role: "member",
        scopes: [], // missing scope
        authType: "session",
      });
  },
}));

// If your handler enqueues jobs via service, keep it mocked to prove it doesn't get called
const enqueueMock = vi.fn();
vi.mock("@/lib/jobs/enqueue", () => ({ enqueueJob: (...args: unknown[]) => enqueueMock(...args) }));

const { POST } = await import("@/app/api/jobs/run/route");

describe("POST /api/jobs/run - permission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when scopes/role insufficient", async () => {
    const req = new NextRequest("http://localhost/api/jobs/run", {
      method: "POST",
      body: JSON.stringify({ type: "webhook_delivery", payload: { id: 1 } }),
    });

    const res = await (POST as (req: unknown) => Promise<Response>)(req as unknown);
    expect([401, 403]).toContain(res.status);
    expect(enqueueMock).not.toHaveBeenCalled();
  });
});
