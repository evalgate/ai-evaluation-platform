import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
	listMock: vi.fn(),
}));

vi.mock("@/lib/services/audit.service", () => ({
	auditService: {
		list: h.listMock,
	},
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (req: NextRequest) =>
			(handler as (...args: never[]) => unknown)(req, {
				userId: "test-user",
				organizationId: 1,
				role: "admin",
				scopes: ["admin:org"],
				authType: "session",
			});
	},
}));

vi.mock("@/lib/validation", () => ({
	parsePaginationParams: vi.fn((params: URLSearchParams) => ({
		limit: Number(params.get("limit")) || 50,
		offset: Number(params.get("offset")) || 0,
	})),
}));

const { GET } = await import("@/app/api/audit-logs/route");

describe("/api/audit-logs", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.listMock.mockReset().mockResolvedValue([]);
	});

	it("returns audit logs for admin users", async () => {
		h.listMock.mockResolvedValueOnce([
			{
				id: 1,
				action: "evaluation.created",
				createdAt: "2026-01-01T00:00:00Z",
			},
		]);

		const req = new NextRequest("http://localhost:3000/api/audit-logs");
		const response = await GET(req, {
			params: Promise.resolve({}),
		} as never);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.data).toHaveLength(1);
		expect(data.data[0].action).toBe("evaluation.created");
	});

	it("passes filter parameters to the service", async () => {
		const req = new NextRequest(
			"http://localhost:3000/api/audit-logs?action=evaluation.created&resourceType=evaluation&limit=20",
		);
		await GET(req, { params: Promise.resolve({}) } as never);

		expect(h.listMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				action: "evaluation.created",
				resourceType: "evaluation",
				limit: 20,
			}),
		);
	});

	it("supports date range filtering", async () => {
		const req = new NextRequest(
			"http://localhost:3000/api/audit-logs?since=2026-01-01&until=2026-01-31",
		);
		await GET(req, { params: Promise.resolve({}) } as never);

		expect(h.listMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				since: "2026-01-01",
				until: "2026-01-31",
			}),
		);
	});

	it("returns empty data when no logs exist", async () => {
		const req = new NextRequest("http://localhost:3000/api/audit-logs");
		const response = await GET(req, {
			params: Promise.resolve({}),
		} as never);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.data).toHaveLength(0);
		expect(data.count).toBe(0);
	});
});
