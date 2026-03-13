import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgRole } from "@/lib/permissions";

const h = vi.hoisted(() => ({
	role: "member" as OrgRole,
	build: vi.fn(),
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (req: NextRequest) =>
			(handler as (...args: never[]) => unknown)(req, {
				userId: "test-user",
				organizationId: 1,
				role: h.role,
				scopes: ["exports:download"],
				authType: "session",
			});
	},
}));

vi.mock("@/lib/services/evalgate-export.service", () => ({
	evalgateExportService: {
		build: h.build,
	},
}));

import { POST } from "@/app/api/evalgate/export/route";

describe("/api/evalgate/export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.role = "member";
	});

	it("returns the assembled EvalGate export payload", async () => {
		h.build.mockResolvedValue({
			evaluation: { id: "12", name: "Export Eval" },
			type: "unit_test",
			summary: { totalTests: 4, passed: 3, failed: 1, passRate: "75%" },
			qualityScore: { overall: 88, grade: "B+" },
			run: { id: 99 },
			baselineRun: { id: 42 },
			report: { evaluationId: 12 },
			quality: {
				card: { overall: 88, grade: "B+" },
				current: { score: 72 },
				baseline: { score: 80 },
				comparison: {
					baselineRunId: 42,
					baselineScore: 80,
					regressionDelta: -8,
					regressionDetected: true,
					baselineMissing: false,
				},
			},
			artifacts: [{ id: 7, kind: "analysis" }],
		});

		const req = new NextRequest("http://localhost/api/evalgate/export", {
			method: "POST",
			body: JSON.stringify({ evaluationId: 12, runId: 99, artifactLimit: 10 }),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(req, { params: Promise.resolve({}) } as never);

		expect(response.status).toBe(200);
		expect(h.build).toHaveBeenCalledWith(1, 12, {
			runId: 99,
			artifactLimit: 10,
		});
		await expect(response.json()).resolves.toMatchObject({
			run: { id: 99 },
			baselineRun: { id: 42 },
			artifacts: [{ id: 7, kind: "analysis" }],
		});
	});

	it("returns forbidden when the role cannot download exports", async () => {
		h.role = "viewer";

		const req = new NextRequest("http://localhost/api/evalgate/export", {
			method: "POST",
			body: JSON.stringify({ evaluationId: 12 }),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(req, { params: Promise.resolve({}) } as never);

		expect(response.status).toBe(403);
		expect(h.build).not.toHaveBeenCalled();
	});

	it("returns not found when the evaluation or run is missing", async () => {
		h.build.mockResolvedValue(null);

		const req = new NextRequest("http://localhost/api/evalgate/export", {
			method: "POST",
			body: JSON.stringify({ evaluationId: 12, runId: 999 }),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(req, { params: Promise.resolve({}) } as never);

		expect(response.status).toBe(404);
	});
});
