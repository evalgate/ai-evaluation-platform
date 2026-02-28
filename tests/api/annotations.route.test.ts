import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
	selectResult: [] as unknown[],
	insertResult: [] as unknown[],
}));

const makeBuilder = (result: unknown[]) => {
	const builder: Record<string, unknown> = {
		from: vi.fn(() => builder),
		where: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		offset: vi.fn(() => builder),
		orderBy: vi.fn(() => builder),
		innerJoin: vi.fn(() => builder),
		leftJoin: vi.fn(() => builder),
		returning: vi.fn(() => Promise.resolve(result)),
		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: (value: unknown) => unknown) =>
			Promise.resolve(result).then(onFulfilled),
	};
	return builder;
};

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(() => makeBuilder(h.selectResult)),
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: () => Promise.resolve(h.insertResult),
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => Promise.resolve()),
			})),
		})),
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
	and: vi.fn(),
	desc: vi.fn(),
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (req: NextRequest) =>
			(handler as (...args: never[]) => unknown)(req, {
				userId: "test-user",
				organizationId: 1,
				role: "member",
				scopes: ["eval:read", "eval:write"],
				authType: "session",
			});
	},
}));

vi.mock("@/lib/api/errors", () => ({
	validationError: vi.fn((msg: string) => {
		return new Response(JSON.stringify({ error: msg }), { status: 400 });
	}),
}));

const { GET, POST } = await import("@/app/api/annotations/route");

describe("/api/annotations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.selectResult = [];
		h.insertResult = [];
	});

	describe("GET", () => {
		it("returns annotations scoped to organization", async () => {
			h.selectResult = [
				{
					id: 1,
					evaluationRunId: 10,
					testCaseId: 5,
					annotatorId: "u1",
					rating: 4,
					feedback: "Good",
					labels: {},
					metadata: {},
					createdAt: new Date().toISOString(),
					annotator: { id: "u1", name: "Test User", email: "test@test.com" },
					testCase: { name: "TC 1" },
				},
			];

			const req = new NextRequest("http://localhost:3000/api/annotations");
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.annotations).toHaveLength(1);
		});

		it("supports evaluationRunId filter", async () => {
			h.selectResult = [];
			const req = new NextRequest(
				"http://localhost:3000/api/annotations?evaluationRunId=10",
			);
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(200);
		});
	});

	describe("POST", () => {
		it("creates an annotation with valid data", async () => {
			h.selectResult = [{ organizationId: 1 }];
			h.insertResult = [
				{
					id: 1,
					evaluationRunId: 10,
					testCaseId: 5,
					annotatorId: "test-user",
					rating: 4,
					feedback: "Good",
				},
			];

			const req = new NextRequest("http://localhost:3000/api/annotations", {
				method: "POST",
				body: JSON.stringify({
					evaluationRunId: 10,
					testCaseId: 5,
					rating: 4,
					feedback: "Good",
				}),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(201);
		});

		it("rejects missing required fields", async () => {
			const req = new NextRequest("http://localhost:3000/api/annotations", {
				method: "POST",
				body: JSON.stringify({ rating: 4 }),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(400);
		});
	});
});
