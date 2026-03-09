import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
	getById: vi.fn(),
	listRuns: vi.fn(),
	createRun: vi.fn(),
	getRunById: vi.fn(),
	getRunWithDetails: vi.fn(),
	updateRun: vi.fn(),
	listHandoffs: vi.fn(),
	createHandoff: vi.fn(),
	getHandoffStats: vi.fn(),
}));

vi.mock("@/lib/services/workflow.service", () => ({
	workflowService: serviceMocks,
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			return (handler as (...args: never[]) => unknown)(
				req,
				{
					userId: "test-user",
					organizationId: 7,
					role: "member",
					scopes: ["runs:read", "runs:write"],
					authType: "session",
				},
				params,
			);
		};
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/validation", () => ({
	parsePaginationParams: vi.fn(() => ({ limit: 25, offset: 0 })),
}));

const runsRoute = await import("@/app/api/workflows/[id]/runs/route");
const runRoute = await import("@/app/api/workflows/[id]/runs/[runId]/route");
const handoffsRoute = await import("@/app/api/workflows/[id]/handoffs/route");

describe("workflow run and handoff routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		serviceMocks.getById.mockResolvedValue({ id: 11, organizationId: 7 });
		serviceMocks.listRuns.mockResolvedValue([]);
		serviceMocks.createRun.mockResolvedValue({ id: 101, workflowId: 11 });
		serviceMocks.getRunById.mockResolvedValue({ id: 21, workflowId: 11 });
		serviceMocks.getRunWithDetails.mockResolvedValue({
			run: { id: 21, workflowId: 11 },
			trace: null,
			handoffs: [],
		});
		serviceMocks.updateRun.mockResolvedValue({ id: 21, workflowId: 11 });
		serviceMocks.listHandoffs.mockResolvedValue([]);
		serviceMocks.createHandoff.mockResolvedValue({ id: 31, workflowRunId: 21 });
		serviceMocks.getHandoffStats.mockResolvedValue([]);
	});

	it("lists workflow runs with org-scoped service arguments", async () => {
		const req = new NextRequest(
			"http://localhost/api/workflows/11/runs?status=running",
		);

		const res = await runsRoute.GET(req, {
			params: Promise.resolve({ id: "11" }),
		});

		expect(res.status).toBe(200);
		expect(serviceMocks.listRuns).toHaveBeenCalledWith(
			11,
			7,
			expect.objectContaining({ limit: 25, offset: 0, status: "running" }),
		);
	});

	it("returns 404 when workflow run creation cannot resolve the trace in the caller org", async () => {
		serviceMocks.createRun.mockResolvedValueOnce(null);
		const req = new NextRequest("http://localhost/api/workflows/11/runs", {
			method: "POST",
			body: JSON.stringify({ traceId: 88, input: { q: "hello" } }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await runsRoute.POST(req, {
			params: Promise.resolve({ id: "11" }),
		});

		expect(res.status).toBe(404);
		expect(serviceMocks.createRun).toHaveBeenCalledWith(
			expect.objectContaining({
				workflowId: 11,
				traceId: 88,
				organizationId: 7,
			}),
		);
	});

	it("updates workflow runs using run + workflow + org scoping", async () => {
		serviceMocks.updateRun.mockResolvedValueOnce(null);
		const req = new NextRequest("http://localhost/api/workflows/11/runs/21", {
			method: "PUT",
			body: JSON.stringify({ status: "completed", errorMessage: null }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await runRoute.PUT(req, {
			params: Promise.resolve({ id: "11", runId: "21" }),
		});

		expect(res.status).toBe(404);
		expect(serviceMocks.updateRun).toHaveBeenCalledWith(
			21,
			11,
			7,
			expect.objectContaining({ status: "completed", errorMessage: undefined }),
		);
	});

	it("lists handoffs only through scoped workflow run resolution", async () => {
		serviceMocks.listHandoffs.mockResolvedValueOnce(null);
		const req = new NextRequest(
			"http://localhost/api/workflows/11/handoffs?runId=21",
		);

		const res = await handoffsRoute.GET(req, {
			params: Promise.resolve({ id: "11" }),
		});

		expect(res.status).toBe(404);
		expect(serviceMocks.listHandoffs).toHaveBeenCalledWith(21, 11, 7);
	});

	it("creates handoffs only for runs scoped to the path workflow and org", async () => {
		serviceMocks.createHandoff.mockResolvedValueOnce(null);
		const req = new NextRequest("http://localhost/api/workflows/11/handoffs", {
			method: "POST",
			body: JSON.stringify({
				workflowRunId: 21,
				toSpanId: "span-2",
				toAgent: "writer",
				handoffType: "delegation",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const res = await handoffsRoute.POST(req, {
			params: Promise.resolve({ id: "11" }),
		});

		expect(res.status).toBe(404);
		expect(serviceMocks.createHandoff).toHaveBeenCalledWith(
			expect.objectContaining({
				workflowId: 11,
				workflowRunId: 21,
				organizationId: 7,
			}),
		);
	});
});
