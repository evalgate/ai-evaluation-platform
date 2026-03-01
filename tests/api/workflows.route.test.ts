import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Inline mock required: vi.hoisted runs before imports. See tests/helpers/mock-auth.ts for canonical structure.
const autumnServerMock = vi.hoisted(() => {
	const v = (globalThis as { vi?: typeof vi }).vi!;
	const ctx = {
		authenticated: true,
		userId: "test-user",
		organizationId: 1,
		role: "member",
		scopes: [
			"eval:read",
			"eval:write",
			"traces:read",
			"traces:write",
			"runs:read",
			"runs:write",
		],
		authType: "session",
	};
	return {
		checkFeature: v.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
		trackFeature: v.fn().mockResolvedValue({ success: true }),
		guardFeature: v.fn().mockResolvedValue(null),
		requireAuthWithOrg: v.fn().mockResolvedValue(ctx),
		requireAuth: v.fn().mockResolvedValue(ctx),
	};
});

const h = vi.hoisted(() => ({
	listMock: vi.fn(),
	createMock: vi.fn(),
}));

vi.mock("@/lib/services/workflow.service", () => ({
	workflowService: {
		list: h.listMock,
		create: h.createMock,
	},
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

vi.mock("@/lib/autumn-server", () => autumnServerMock);

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/validation", () => ({
	parsePaginationParams: vi.fn(() => ({ limit: 20, offset: 0 })),
}));

const { GET, POST } = await import("@/app/api/workflows/route");

describe("/api/workflows", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.listMock.mockReset().mockResolvedValue([]);
		h.createMock
			.mockReset()
			.mockResolvedValue({ id: 1, name: "Test Workflow" });
	});

	describe("GET", () => {
		it("returns a list of workflows", async () => {
			h.listMock.mockResolvedValueOnce([{ id: 1, name: "Workflow A" }]);

			const req = new NextRequest("http://localhost:3000/api/workflows");
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveLength(1);
			expect(data[0].name).toBe("Workflow A");
		});

		it("supports pagination parameters", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/workflows?limit=10&offset=5",
			);
			await GET(req, { params: Promise.resolve({}) } as never);

			expect(h.listMock).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ limit: 20, offset: 0 }),
			);
		});

		it("supports status filter", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/workflows?status=active",
			);
			await GET(req, { params: Promise.resolve({}) } as never);

			expect(h.listMock).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ status: "active" }),
			);
		});

		it("handles service errors gracefully", async () => {
			h.listMock.mockRejectedValueOnce(new Error("DB error"));

			const req = new NextRequest("http://localhost:3000/api/workflows");
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(500);
		});
	});

	describe("POST", () => {
		const validDefinition = {
			nodes: [
				{ id: "start", type: "agent", name: "Start Agent" },
				{ id: "end", type: "llm", name: "End LLM" },
			],
			edges: [{ from: "start", to: "end" }],
			entrypoint: "start",
		};

		it("creates a workflow with valid data", async () => {
			const body = {
				name: "Test Workflow",
				organizationId: 1,
				definition: validDefinition,
			};

			const req = new NextRequest("http://localhost:3000/api/workflows", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(201);
		});

		it("rejects missing name", async () => {
			const body = {
				organizationId: 1,
				definition: validDefinition,
			};

			const req = new NextRequest("http://localhost:3000/api/workflows", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(400);
		});

		it("rejects invalid definition without nodes", async () => {
			const body = {
				name: "Test Workflow",
				organizationId: 1,
				definition: { edges: [], entrypoint: "start" },
			};

			const req = new NextRequest("http://localhost:3000/api/workflows", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(400);
		});

		it("rejects invalid node type", async () => {
			const body = {
				name: "Test Workflow",
				organizationId: 1,
				definition: {
					nodes: [{ id: "n1", type: "invalid_type", name: "Bad Node" }],
					edges: [],
					entrypoint: "n1",
				},
			};

			const req = new NextRequest("http://localhost:3000/api/workflows", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(400);
		});
	});
});
