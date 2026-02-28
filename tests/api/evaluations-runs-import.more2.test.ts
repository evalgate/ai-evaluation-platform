import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
	selectQueue: [] as unknown[],
}));

const chain = (result: unknown) => {
	const b: Record<string, unknown> = {
		select: vi.fn(() => b),
		from: vi.fn(() => b),
		where: vi.fn(() => b),
		limit: vi.fn(() => b),
		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: unknown) =>
			Promise.resolve(result).then(onFulfilled as (value: unknown) => unknown),
	};
	return b;
};

vi.mock("@/db", () => ({
	db: {
		select: () => chain(state.selectQueue.shift() ?? []),
		insert: vi.fn(() => chain([])),
	},
}));

vi.mock("@/db/schema", () => ({
	evaluations: { id: "id", organizationId: "organizationId" },
	evaluationRuns: { id: "id" },
	evaluationRunResults: { id: "id" },
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/errors", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/lib/api/errors")>();
	return { ...original };
});

vi.mock("@/lib/api/parse", () => ({
	parseBody: vi.fn(async (req: NextRequest) => {
		const data = await req.json();
		// emulate zod schema failure: missing results
		if (!("results" in data)) {
			return {
				ok: false,
				response: new Response(
					JSON.stringify({ error: { code: "VALIDATION_ERROR" } }),
					{
						status: 400,
						headers: { "content-type": "application/json" },
					},
				),
			};
		}
		return { ok: true, data };
	}),
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (
		handler: (req: NextRequest, ctx: unknown, params: unknown) => unknown,
	) => {
		return async (req: NextRequest) =>
			handler(
				req,
				{ userId: "u1", organizationId: 1, role: "member" },
				{ id: "123" },
			);
	},
}));

const { POST } = await import("@/app/api/evaluations/[id]/runs/import/route");

describe("POST /api/evaluations/[id]/runs/import (more2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		state.selectQueue.length = 0;
	});

	it("returns 400 on invalid payload (missing results)", async () => {
		const req = new NextRequest(
			"http://localhost/api/evaluations/123/runs/import",
			{
				method: "POST",
				body: JSON.stringify({ environment: "ci" }),
			},
		);

		const res = await (
			POST as (req: unknown, opts: unknown) => Promise<Response>
		)(req as unknown, {} as unknown);
		expect(res.status).toBe(400);

		const body = await res.json();
		expect(body.error?.code).toBe("VALIDATION_ERROR");
	});

	it("returns 404 when evaluation not found", async () => {
		state.selectQueue.push([]); // eval lookup returns none

		const req = new NextRequest(
			"http://localhost/api/evaluations/123/runs/import",
			{
				method: "POST",
				body: JSON.stringify({ environment: "ci", results: [] }),
			},
		);

		const res = await (
			POST as (req: unknown, opts: unknown) => Promise<Response>
		)(req as unknown, {} as unknown);
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.error?.code).toBe("NOT_FOUND");
	});
});
