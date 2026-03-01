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
	listBenchmarksMock: vi.fn(),
	createBenchmarkMock: vi.fn(),
}));

vi.mock("@/lib/services/benchmark.service", () => ({
	benchmarkService: {
		listBenchmarks: h.listBenchmarksMock,
		createBenchmark: h.createBenchmarkMock,
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

const { GET, POST } = await import("@/app/api/benchmarks/route");

describe("/api/benchmarks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.listBenchmarksMock.mockReset().mockResolvedValue([]);
		h.createBenchmarkMock
			.mockReset()
			.mockResolvedValue({ id: 1, name: "Test Benchmark" });
	});

	describe("GET", () => {
		it("returns a list of benchmarks", async () => {
			h.listBenchmarksMock.mockResolvedValueOnce([
				{ id: 1, name: "Benchmark A" },
			]);

			const req = new NextRequest("http://localhost:3000/api/benchmarks");
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveLength(1);
			expect(data[0].name).toBe("Benchmark A");
		});

		it("includes public benchmarks by default", async () => {
			const req = new NextRequest("http://localhost:3000/api/benchmarks");
			await GET(req, { params: Promise.resolve({}) } as never);

			expect(h.listBenchmarksMock).toHaveBeenCalledWith(1, true);
		});

		it("respects includePublic=false parameter", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/benchmarks?includePublic=false",
			);
			await GET(req, { params: Promise.resolve({}) } as never);

			expect(h.listBenchmarksMock).toHaveBeenCalledWith(1, false);
		});

		it("handles service errors gracefully", async () => {
			h.listBenchmarksMock.mockRejectedValueOnce(new Error("DB error"));

			const req = new NextRequest("http://localhost:3000/api/benchmarks");
			const response = await GET(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(500);
		});
	});

	describe("POST", () => {
		it("creates a benchmark with valid data", async () => {
			const body = {
				name: "Test Benchmark",
				taskType: "qa",
				metrics: ["accuracy", "latency"],
				organizationId: 1,
			};

			const req = new NextRequest("http://localhost:3000/api/benchmarks", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(201);
		});

		it("rejects invalid task types", async () => {
			const body = {
				name: "Test",
				taskType: "invalid_type",
				metrics: ["accuracy"],
				organizationId: 1,
			};

			const req = new NextRequest("http://localhost:3000/api/benchmarks", {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(req, {
				params: Promise.resolve({}),
			} as never);

			expect(response.status).toBe(400);
		});

		it("rejects empty name", async () => {
			const body = {
				name: "",
				taskType: "qa",
				metrics: ["accuracy"],
				organizationId: 1,
			};

			const req = new NextRequest("http://localhost:3000/api/benchmarks", {
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
