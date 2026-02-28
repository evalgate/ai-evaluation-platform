import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
	selectRows: [] as unknown[],
}));

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(async () => h.selectRows),
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(async () => []),
			})),
		})),
	},
}));

vi.mock("@/db/schema", () => ({
	jobs: { id: "id", status: "status", nextRunAt: "nextRunAt" },
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
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
				role: "admin",
				scopes: ["jobs:write"],
				authType: "session",
				authenticated: true,
			});
	},
}));

const { POST } = await import("@/app/api/jobs/dead/bulk-retry/route");

describe("POST /api/jobs/dead/bulk-retry - empty", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.selectRows = [];
	});

	it("returns 200 with retried=0 when nothing eligible", async () => {
		// Mock the DB query to return empty array (job not found)
		h.selectRows = [];

		const req = new NextRequest("http://localhost/api/jobs/dead/bulk-retry", {
			method: "POST",
			body: JSON.stringify({ jobIds: [999] }), // Non-existent job ID
		});

		const res = await (
			POST as (req: unknown, opts: unknown) => Promise<Response>
		)(req as unknown, {} as unknown);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.retried ?? body.count ?? 0).toBe(0);
	});
});
