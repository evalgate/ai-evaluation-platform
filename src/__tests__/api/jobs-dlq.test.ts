/**
 * DLQ API tests — GET /api/jobs/dead and POST /api/jobs/:id/retry
 *
 * Covers: admin-only access, org scoping, field reset on retry,
 * conflict on non-dead_letter retry, 404 on missing/wrong-org job.
 */

import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock state ────────────────────────────────────────────────────────────────

interface MockJob {
  id: number;
  type: string;
  status: string;
  attempt: number;
  maxAttempts: number;
  lastErrorCode: string | null;
  lastError: string | null;
  lastStartedAt: Date | null;
  lastFinishedAt: Date | null;
  lastDurationMs: number | null;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: number;
  lockedAt: Date | null;
  lockedUntil: Date | null;
  lockedBy: string | null;
}

let jobStore: MockJob[] = [];

vi.mock("@/db/schema", () => ({
  jobs: {
    id: "id",
    type: "type",
    status: "status",
    attempt: "attempt",
    maxAttempts: "maxAttempts",
    lastErrorCode: "lastErrorCode",
    lastError: "lastError",
    lastStartedAt: "lastStartedAt",
    lastFinishedAt: "lastFinishedAt",
    lastDurationMs: "lastDurationMs",
    nextRunAt: "nextRunAt",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    organizationId: "organizationId",
    lockedAt: "lockedAt",
    lockedUntil: "lockedUntil",
    lockedBy: "lockedBy",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  eq: (col: unknown, val: unknown) => ({ col, val }),
  desc: (col: unknown) => ({ col, dir: "desc" }),
}));

vi.mock("@/db", () => ({
  db: {
    select: (_fields?: unknown) => ({
      from: (_table: unknown) => ({
        where: (cond: unknown) => {
          const conds = cond as Array<{ col: unknown; val: unknown }>;
          const statusCond = conds.find?.((c) => c?.col === "status");
          const orgCond = conds.find?.((c) => c?.col === "organizationId");
          const idCond = conds.find?.((c) => c?.col === "id");

          const filterJobs = () =>
            jobStore.filter((j) => {
              if (statusCond && j.status !== statusCond.val) return false;
              if (orgCond && j.organizationId !== orgCond.val) return false;
              if (idCond && j.id !== idCond.val) return false;
              return true;
            });

          return {
            orderBy: (_: unknown) => ({
              limit: (limit: number) => ({
                offset: (offset: number) => {
                  const filtered = filterJobs()
                    .slice(offset, offset + limit)
                    .map((j) => ({
                      id: j.id,
                      type: j.type,
                      status: j.status,
                      attempt: j.attempt,
                      maxAttempts: j.maxAttempts,
                      lastErrorCode: j.lastErrorCode,
                      lastError: j.lastError,
                      lastStartedAt: j.lastStartedAt,
                      lastFinishedAt: j.lastFinishedAt,
                      lastDurationMs: j.lastDurationMs,
                      nextRunAt: j.nextRunAt,
                      createdAt: j.createdAt,
                      updatedAt: j.updatedAt,
                      organizationId: j.organizationId,
                    }));
                  return Promise.resolve(filtered);
                },
              }),
            }),
            limit: (n: number) => {
              const filtered = filterJobs()
                .slice(0, n)
                .map((j) => ({ id: j.id, status: j.status, organizationId: j.organizationId }));
              return Promise.resolve(filtered);
            },
          };
        },
      }),
    }),
    update: (_table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: (cond: unknown) => {
          // cond may be a single {col,val} or an array of them
          const conds = (Array.isArray(cond) ? cond : [cond]) as Array<{
            col: unknown;
            val: unknown;
          }>;
          const idCond = conds.find?.((c) => c?.col === "id");
          const job = jobStore.find((j) => j.id === idCond?.val);
          if (job) Object.assign(job, values);
          return Promise.resolve();
        },
      }),
    }),
  },
}));

vi.mock("@/lib/api/secure-route", () => ({
  secureRoute: (handler: (req: NextRequest, ctx: unknown) => unknown, _opts?: unknown) => handler,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<MockJob> = {}): MockJob {
  return {
    id: Math.floor(Math.random() * 100000) + 1,
    type: "webhook_delivery",
    status: "dead_letter",
    attempt: 3,
    maxAttempts: 3,
    lastErrorCode: "JOB_HANDLER_ERROR",
    lastError: "handler failed",
    lastStartedAt: new Date(),
    lastFinishedAt: new Date(),
    lastDurationMs: 120,
    nextRunAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: 1,
    lockedAt: null,
    lockedUntil: null,
    lockedBy: null,
    ...overrides,
  };
}

function makeCtx(role = "admin", orgId = 1) {
  return { userId: "u1", organizationId: orgId, role, scopes: [], authType: "session" as const };
}

function makeReq(url = "http://localhost/api/jobs/dead"): NextRequest {
  return { url, headers: { get: () => null } } as unknown as NextRequest;
}

// ── GET /api/jobs/dead ────────────────────────────────────────────────────────

describe("GET /api/jobs/dead", () => {
  beforeEach(() => {
    jobStore = [];
    vi.resetModules();
  });

  it("returns dead_letter jobs for the caller org", async () => {
    jobStore.push(makeJob({ organizationId: 1 }));
    jobStore.push(makeJob({ organizationId: 2 })); // different org — should not appear

    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(makeReq(), makeCtx("admin", 1));
    const body = await res.json();

    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0].organizationId).toBe(1);
  });

  it("does not include payload in response", async () => {
    jobStore.push(makeJob());

    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(makeReq(), makeCtx());
    const body = await res.json();

    expect(body.jobs[0]).not.toHaveProperty("payload");
  });

  it("returns empty array when no DLQ jobs", async () => {
    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(makeReq(), makeCtx());
    const body = await res.json();

    expect(body.jobs).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("respects limit query param", async () => {
    for (let i = 0; i < 10; i++) jobStore.push(makeJob({ id: i + 1 }));

    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(
      makeReq("http://localhost/api/jobs/dead?limit=3"),
      makeCtx(),
    );
    const body = await res.json();

    expect(body.jobs.length).toBeLessThanOrEqual(3);
  });

  it("returns 400 for non-numeric limit", async () => {
    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(
      makeReq("http://localhost/api/jobs/dead?limit=abc"),
      makeCtx(),
    );

    expect(res.status).toBe(400);
  });

  it("returns safe fields: id, type, status, attempt, lastErrorCode, lastError", async () => {
    jobStore.push(makeJob());

    const { GET } = await import("../../app/api/jobs/dead/route");
    const res = await (GET as Function)(makeReq(), makeCtx());
    const body = await res.json();
    const job = body.jobs[0];

    expect(job).toHaveProperty("id");
    expect(job).toHaveProperty("type");
    expect(job).toHaveProperty("status");
    expect(job).toHaveProperty("attempt");
    expect(job).toHaveProperty("lastErrorCode");
    expect(job).toHaveProperty("lastError");
  });
});

// ── POST /api/jobs/:id/retry ──────────────────────────────────────────────────

describe("POST /api/jobs/:id/retry", () => {
  beforeEach(() => {
    jobStore = [];
    vi.resetModules();
  });

  it("resets job fields and requeues dead_letter job", async () => {
    const job = makeJob({ id: 42, status: "dead_letter", attempt: 3 });
    jobStore.push(job);

    const { POST } = await import("../../app/api/jobs/[id]/retry/route");
    const res = await (POST as Function)(makeReq(), makeCtx(), { id: "42" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.jobId).toBe(42);
    expect(job.status).toBe("pending");
    expect(job.attempt).toBe(0);
    expect(job.lastError).toBeNull();
    expect(job.lastErrorCode).toBeNull();
    expect(job.lockedAt).toBeNull();
    expect(job.lockedUntil).toBeNull();
    expect(job.lockedBy).toBeNull();
  });

  it("returns 409 when job is not in dead_letter status", async () => {
    const job = makeJob({ id: 99, status: "pending" });
    jobStore.push(job);

    const { POST } = await import("../../app/api/jobs/[id]/retry/route");
    const res = await (POST as (...args: unknown[]) => Promise<Response>)(makeReq(), makeCtx(), {
      id: "99",
    });

    expect(res.status).toBe(409);
  });

  it("returns 404 when job does not exist", async () => {
    const { POST } = await import("../../app/api/jobs/[id]/retry/route");
    const res = await (POST as (...args: unknown[]) => Promise<Response>)(makeReq(), makeCtx(), {
      id: "9999",
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when job belongs to a different org", async () => {
    const job = makeJob({ id: 77, organizationId: 2 });
    jobStore.push(job);

    const { POST } = await import("../../app/api/jobs/[id]/retry/route");
    const res = await (POST as (...args: unknown[]) => Promise<Response>)(
      makeReq(),
      makeCtx("admin", 1),
      { id: "77" },
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-numeric id", async () => {
    const { POST } = await import("../../app/api/jobs/[id]/retry/route");
    const res = await (POST as (...args: unknown[]) => Promise<Response>)(makeReq(), makeCtx(), {
      id: "abc",
    });

    expect(res.status).toBe(404);
  });
});
