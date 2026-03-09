import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/traces/route";
import { trackFeature } from "@/lib/autumn-server";

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

const routeContext = { params: Promise.resolve({}) };

vi.mock("@/lib/services/trace.service", () => ({
	traceService: {
		list: vi
			.fn()
			.mockResolvedValue([{ id: 1, name: "Test Trace", traceId: "trace-1" }]),
		create: vi
			.fn()
			.mockResolvedValue([{ id: 1, name: "Test Trace", traceId: "trace-123" }]),
		remove: vi.fn().mockResolvedValue(true),
	},
}));

vi.mock("@/lib/autumn-server", () => autumnServerMock);

vi.mock("@/lib/api-rate-limit", () => ({
	withRateLimit: vi.fn(
		(_req: unknown, handler: (r: unknown) => Promise<Response>) =>
			handler(_req),
	),
}));

describe("/api/traces", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET", () => {
		it("should return traces with default pagination", async () => {
			const req = new NextRequest("http://localhost:3000/api/traces");

			const response = await GET(req, routeContext as never);

			expect(response.status).toBe(200);
		});

		it("should filter by organizationId", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/traces?organizationId=123",
			);

			const response = await GET(req, routeContext as never);

			expect(response.status).toBe(200);
		});

		it("should respect limit and offset parameters", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/traces?limit=10&offset=20",
			);

			const response = await GET(req, routeContext as never);

			expect(response.status).toBe(200);
		});
	});

	describe("POST", () => {
		it("should create a new trace with valid data", async () => {
			const req = new NextRequest("http://localhost:3000/api/traces", {
				method: "POST",
				body: JSON.stringify({
					name: "Test Trace",
					traceId: "trace-123",
					organizationId: 1,
					status: "pending",
				}),
			});

			const response = await POST(req, routeContext as never);

			expect(response.status).toBe(201);
			expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					featureId: "traces",
					idempotencyKey: "traces-1",
				}),
			);
			expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					featureId: "traces_per_project",
					idempotencyKey: "traces_per_project-1-1",
				}),
			);
		});

		it("should reject missing required fields", async () => {
			const req = new NextRequest("http://localhost:3000/api/traces", {
				method: "POST",
				body: JSON.stringify({
					// Missing name (required); traceId is optional and auto-generated
					traceId: "trace-xyz",
				}),
			});

			const response = await POST(req, routeContext as never);

			expect(response.status).toBe(400);
		});
	});
});
