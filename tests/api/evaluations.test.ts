import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/evaluations/route";

// Inline mock required: vi.hoisted runs before imports. See tests/helpers/mock-auth.ts for canonical structure.
const autumnServerMock = vi.hoisted(() => {
	const v = (globalThis as { vi?: typeof vi }).vi!;
	const ctx = {
		authenticated: true,
		userId: "test-user",
		organizationId: 1,
		role: "member",
		scopes: ["eval:read", "eval:write"],
		authType: "session",
	};
	return {
		checkFeature: v.fn(),
		trackFeature: v.fn(),
		guardFeature: v.fn().mockResolvedValue(null),
		requireAuthWithOrg: v.fn().mockResolvedValue(ctx),
		requireAuth: v.fn().mockResolvedValue(ctx),
	};
});

/**
 * IMPORTANT:
 * vi.mock() is hoisted. Use vi.hoisted() for unknown variables referenced inside mock factories.
 */
const h = vi.hoisted(() => {
	return {
		evaluationListMock: vi.fn(),
		evaluationGetByIdMock: vi.fn(),
	};
});

vi.mock("@/db", () => {
	const mockChain: Record<string, unknown> = {
		select: vi.fn(),
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
		$dynamic: vi.fn(),
	};

	(mockChain.select as any).mockReturnValue(mockChain);
	(mockChain.from as any).mockReturnValue(mockChain);
	(mockChain.$dynamic as any).mockReturnValue(mockChain);
	(mockChain.where as any).mockReturnValue(mockChain);
	(mockChain.limit as any).mockReturnValue(mockChain);
	(mockChain.offset as any).mockReturnValue(mockChain);
	(mockChain.orderBy as any).mockResolvedValue([]);

	return { db: mockChain };
});

vi.mock("@/lib/api-rate-limit", () => ({
	withRateLimit: vi.fn((req, handler) => handler(req)),
}));

vi.mock("@/lib/autumn-server", () => autumnServerMock);

vi.mock("@/lib/services/evaluation.service", () => ({
	evaluationService: {
		list: h.evaluationListMock,
		getById: h.evaluationGetByIdMock,
	},
}));

describe("/api/evaluations", () => {
	const routeContext = { params: Promise.resolve({}) };

	beforeEach(() => {
		vi.clearAllMocks();
		h.evaluationListMock.mockReset().mockResolvedValue([]);
		h.evaluationGetByIdMock.mockReset().mockResolvedValue(null);
	});

	describe("GET", () => {
		it("should return evaluations list", async () => {
			const req = new NextRequest("http://localhost:3000/api/evaluations");
			const response = await GET(req, routeContext as never);
			expect(response.status).toBe(200);
		});

		it("should support search parameter", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/evaluations?search=test",
			);
			const response = await GET(req, routeContext as never);
			expect(response.status).toBe(200);
		});

		it("should support pagination", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/evaluations?limit=20&offset=40",
			);
			const response = await GET(req, routeContext as never);
			expect(response.status).toBe(200);
		});

		it("passes pagination and filters to the service layer", async () => {
			h.evaluationListMock.mockResolvedValueOnce([{ id: 1, name: "Demo" }]);

			const req = new NextRequest(
				"http://localhost:3000/api/evaluations?limit=5&offset=10&status=draft",
			);

			const response = await GET(req, routeContext as never);
			await response.json();

			expect(response.status).toBe(200);
			expect(h.evaluationListMock).toHaveBeenCalledWith(1, {
				limit: 5,
				offset: 10,
				status: "draft",
			});
		});

		it("returns validation error when requested id is invalid", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/evaluations?id=abc",
			);

			const response = await GET(req, routeContext as never);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error.code).toBe("VALIDATION_ERROR");
		});

		it("returns NOT_FOUND when evaluation does not exist", async () => {
			const req = new NextRequest("http://localhost:3000/api/evaluations?id=2");

			const response = await GET(req, routeContext as never);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error.code).toBe("NOT_FOUND");
			expect(h.evaluationGetByIdMock).toHaveBeenCalledWith(2, 1);
		});

		it("returns an evaluation when id lookup succeeds", async () => {
			const expected = { id: 3, name: "Eval" };
			h.evaluationGetByIdMock.mockResolvedValueOnce(expected);

			const req = new NextRequest("http://localhost:3000/api/evaluations?id=3");

			const response = await GET(req, routeContext as never);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toMatchObject(expected);
			expect(h.evaluationGetByIdMock).toHaveBeenCalledWith(3, 1);
		});
	});
});
