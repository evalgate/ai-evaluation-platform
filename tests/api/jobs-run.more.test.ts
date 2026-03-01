import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (req: NextRequest) => {
			// Provide complete auth context
			const ctx = {
				userId: "u1",
				organizationId: 1,
				role: "member",
				scopes: [],
				authType: "session",
				authenticated: true,
			};
			return handler(req, ctx);
		};
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/parse", () => ({
	parseBody: vi.fn(async () => ({
		ok: false,
		response: new Response(
			JSON.stringify({ error: { code: "VALIDATION_ERROR" } }),
			{
				status: 400,
				headers: { "content-type": "application/json" },
			},
		),
	})),
}));

const { GET } = await import("@/app/api/jobs/run/route");

describe("GET /api/jobs/run (more)", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when authentication fails", async () => {
		const req = new NextRequest("http://localhost/api/jobs/run", {
			method: "GET",
		});

		const res = await (GET as (req: unknown) => Promise<Response>)(
			req as unknown,
		);
		expect(res.status).toBe(401);

		const body = await res.json();
		expect(body.error?.code).toBeTruthy();
	});
});
