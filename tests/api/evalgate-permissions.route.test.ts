import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgRole } from "@/lib/permissions";

const h = vi.hoisted(() => ({
	role: "member" as OrgRole,
	parseBody: vi.fn(),
	analyzeDatasetContent: vi.fn(),
	synthesizeDatasetContent: vi.fn(),
	discoverDiversity: vi.fn(),
	buildRunDataset: vi.fn(),
	analyzeRunDataset: vi.fn(),
	clusterRun: vi.fn(),
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
					organizationId: 1,
					role: h.role,
					scopes: ["eval:read", "eval:write", "runs:read", "reports:write"],
					authType: "session",
				},
				params,
			);
		};
	},
}));

vi.mock("@/lib/api/parse", () => ({
	parseBody: (...args: unknown[]) => h.parseBody(...args),
}));

vi.mock("@/lib/services/evalgate-compute.service", () => ({
	evalgateComputeService: {
		analyzeDatasetContent: (...args: unknown[]) =>
			h.analyzeDatasetContent(...args),
		synthesizeDatasetContent: (...args: unknown[]) =>
			h.synthesizeDatasetContent(...args),
		discoverDiversity: (...args: unknown[]) => h.discoverDiversity(...args),
		buildRunDataset: (...args: unknown[]) => h.buildRunDataset(...args),
		analyzeRunDataset: (...args: unknown[]) => h.analyzeRunDataset(...args),
		clusterRun: (...args: unknown[]) => h.clusterRun(...args),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { POST: analyzeDatasetPOST } = await import(
	"@/app/api/evalgate/analyze/route"
);
const { POST: synthesizeDatasetPOST } = await import(
	"@/app/api/evalgate/synthesize/route"
);
const { POST: discoverDiversityPOST } = await import(
	"@/app/api/evalgate/discover-diversity/route"
);
const { POST: analyzeRunPOST } = await import(
	"@/app/api/evaluations/[id]/runs/[runId]/analyze/route"
);
const { POST: buildRunDatasetPOST } = await import(
	"@/app/api/evaluations/[id]/runs/[runId]/dataset/route"
);
const { POST: clusterRunPOST } = await import(
	"@/app/api/evaluations/[id]/runs/[runId]/cluster/route"
);

describe("EvalGate route permissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.role = "member";
		h.parseBody.mockResolvedValue({ ok: true, data: {} });
	});

	it("returns 403 for viewers on dataset analysis", async () => {
		h.role = "viewer";

		const response = await analyzeDatasetPOST(
			new NextRequest("http://localhost/api/evalgate/analyze", {
				method: "POST",
			}),
			{ params: Promise.resolve({}) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.analyzeDatasetContent).not.toHaveBeenCalled();
	});

	it("returns 403 for viewers on synthesis generation", async () => {
		h.role = "viewer";

		const response = await synthesizeDatasetPOST(
			new NextRequest("http://localhost/api/evalgate/synthesize", {
				method: "POST",
			}),
			{ params: Promise.resolve({}) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.synthesizeDatasetContent).not.toHaveBeenCalled();
	});

	it("returns 403 for viewers on diversity discovery", async () => {
		h.role = "viewer";

		const response = await discoverDiversityPOST(
			new NextRequest("http://localhost/api/evalgate/discover-diversity", {
				method: "POST",
			}),
			{ params: Promise.resolve({}) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.discoverDiversity).not.toHaveBeenCalled();
	});

	it("returns 403 for viewers on run analysis", async () => {
		h.role = "viewer";

		const response = await analyzeRunPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/analyze", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.analyzeRunDataset).not.toHaveBeenCalled();
	});

	it("returns 403 for viewers on run dataset generation", async () => {
		h.role = "viewer";

		const response = await buildRunDatasetPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/dataset", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.buildRunDataset).not.toHaveBeenCalled();
	});

	it("returns 403 for viewers on run clustering", async () => {
		h.role = "viewer";

		const response = await clusterRunPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/cluster", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.parseBody).not.toHaveBeenCalled();
		expect(h.clusterRun).not.toHaveBeenCalled();
	});

	it("allows members to analyze dataset content", async () => {
		h.parseBody.mockResolvedValue({
			ok: true,
			data: { datasetContent: "{}", top: 5 },
		});
		h.analyzeDatasetContent.mockReturnValue({
			rows: [{ failureMode: "tool_failure", count: 1 }],
			summary: { totalFailures: 1 },
		});

		const response = await analyzeDatasetPOST(
			new NextRequest("http://localhost/api/evalgate/analyze", {
				method: "POST",
			}),
			{ params: Promise.resolve({}) } as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.summary).toMatchObject({ totalFailures: 1 });
		expect(h.analyzeDatasetContent).toHaveBeenCalledWith("{}", 5);
	});

	it("allows members to synthesize dataset content", async () => {
		h.parseBody.mockResolvedValue({
			ok: true,
			data: {
				datasetContent: "{}",
				dimensions: { locale: ["en"] },
				count: 1,
				failureModes: ["tool_failure"],
			},
		});
		h.synthesizeDatasetContent.mockReturnValue({ generated: 1, cases: [] });

		const response = await synthesizeDatasetPOST(
			new NextRequest("http://localhost/api/evalgate/synthesize", {
				method: "POST",
			}),
			{ params: Promise.resolve({}) } as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.generated).toBe(1);
		expect(h.synthesizeDatasetContent).toHaveBeenCalledWith("{}", {
			dimensions: { locale: ["en"] },
			count: 1,
			failureModes: ["tool_failure"],
		});
	});

	it("allows members to analyze and cluster runs", async () => {
		h.parseBody
			.mockResolvedValueOnce({
				ok: true,
				data: { includePassed: true, top: 5 },
			})
			.mockResolvedValueOnce({
				ok: true,
				data: { includePassed: false, clusters: 3 },
			});
		h.analyzeRunDataset.mockResolvedValue({
			summary: { totalFailures: 2 },
			rows: [],
		});
		h.clusterRun.mockResolvedValue({
			run: { id: 34 },
			summary: { clusters: [{ id: "cluster-1" }] },
		});

		const analyzeResponse = await analyzeRunPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/analyze", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);
		const clusterResponse = await clusterRunPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/cluster", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);

		expect(analyzeResponse.status).toBe(200);
		expect(clusterResponse.status).toBe(200);
		expect(h.analyzeRunDataset).toHaveBeenCalledWith(1, 12, 34, {
			includePassed: true,
			top: 5,
		});
		expect(h.clusterRun).toHaveBeenCalledWith(1, 12, 34, {
			includePassed: false,
			clusters: 3,
		});
	});

	it("allows members to build run datasets", async () => {
		h.parseBody.mockResolvedValue({
			ok: true,
			data: { includePassed: true },
		});
		h.buildRunDataset.mockResolvedValue({
			total: 2,
			failed: 1,
			content: '{"caseId":"case-1"}',
		});

		const response = await buildRunDatasetPOST(
			new NextRequest("http://localhost/api/evaluations/12/runs/34/dataset", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "12", runId: "34" }) } as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({ total: 2, failed: 1 });
		expect(h.buildRunDataset).toHaveBeenCalledWith(1, 12, 34, {
			includePassed: true,
		});
	});
});
