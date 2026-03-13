import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
	selectQueue: [] as unknown[][],
	report: {
		evaluationId: 10,
		evaluationName: "EvalGate Export",
		evaluationType: "unit_test",
		organizationId: 1,
		organizationName: "Test Org",
		totalRuns: 2,
		completedRuns: 2,
		averageScore: 81,
		passRate: 75,
		averageDuration: 120,
		totalCost: 1.2,
		lastRunAt: "2026-03-13T00:00:00.000Z",
		createdAt: "2026-03-12T00:00:00.000Z",
		performance: {
			scoreDistribution: {},
			statusDistribution: {},
			durationStats: { min: 100, max: 140, avg: 120, p95: 140 },
			costStats: { min: 0.4, max: 0.8, avg: 0.6, total: 1.2 },
		},
		quality: {
			judgeResults: {
				totalJudged: 0,
				averageJudgeScore: 0,
				passedJudged: 0,
				failedJudged: 0,
			},
			consistency: {
				scoreVariance: 0,
				scoreStdDev: 0,
				coefficientOfVariation: 0,
			},
		},
		trends: {
			recentPerformance: [],
			scoreTrend: "stable" as const,
			performanceChange: 0,
		},
		metadata: {},
	},
}));

const makeBuilder = (result: unknown[]) => {
	const builder: Record<string, unknown> = {
		from: vi.fn(() => builder),
		where: vi.fn(() => builder),
		leftJoin: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		orderBy: vi.fn(() => builder),
		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: (value: unknown) => unknown) => {
			return Promise.resolve(result).then(onFulfilled);
		},
	};
	return builder;
};

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(() => makeBuilder(state.selectQueue.shift() ?? [])),
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn((left: unknown, right: unknown) => ({ left, right })),
	and: vi.fn((...args: unknown[]) => ({ args })),
	asc: vi.fn((value: unknown) => value),
	desc: vi.fn((value: unknown) => value),
	inArray: vi.fn((left: unknown, right: unknown) => ({ left, right })),
	ne: vi.fn((left: unknown, right: unknown) => ({ left, right })),
}));

vi.mock("@/lib/services/report-cards.service", () => ({
	reportCardsService: {
		generateReportCard: vi.fn(() => Promise.resolve(state.report)),
	},
}));

describe("evalgateExportService", () => {
	let evalgateExportService: any;
	let reportCardsService: any;

	beforeAll(async () => {
		const serviceMod = await import("@/lib/services/evalgate-export.service");
		evalgateExportService = serviceMod.evalgateExportService;
		const reportMod = await import("@/lib/services/report-cards.service");
		reportCardsService = reportMod.reportCardsService;
	});

	beforeEach(() => {
		vi.clearAllMocks();
		state.selectQueue = [];
	});

	it("returns null when the evaluation is not found in the organization", async () => {
		state.selectQueue = [[]];

		const result = await evalgateExportService.build(1, 999);

		expect(result).toBeNull();
	});

	it("builds a unit-test export bundle with comparison quality and artifacts", async () => {
		state.selectQueue = [
			[
				{
					id: 10,
					organizationId: 1,
					name: "EvalGate Export",
					description: "Server bundle",
					type: "unit_test",
					createdAt: new Date("2026-03-12T00:00:00.000Z"),
					publishedRunId: 22,
					executionSettings: {},
					modelSettings: {},
				},
			],
			[
				{
					id: 30,
					evaluationId: 10,
					organizationId: 1,
					status: "completed",
					totalCases: 4,
					passedCases: 3,
					failedCases: 1,
					processedCount: 4,
					environment: "prod",
					traceLog: { code_validation: { syntax_errors: 0 } },
					startedAt: new Date("2026-03-13T00:00:00.000Z"),
					completedAt: new Date("2026-03-13T00:05:00.000Z"),
					createdAt: new Date("2026-03-13T00:00:00.000Z"),
				},
			],
			[
				{
					result: {
						id: 1,
						status: "passed",
						output: "ok",
						score: 90,
						error: null,
						durationMs: 100,
						messages: null,
					},
					testCase: {
						name: "case 1",
						input: "input 1",
						expectedOutput: "expected 1",
					},
				},
				{
					result: {
						id: 2,
						status: "failed",
						output: "bad",
						score: 40,
						error: "boom",
						durationMs: 140,
						messages: null,
					},
					testCase: {
						name: "case 2",
						input: "input 2",
						expectedOutput: "expected 2",
					},
				},
			],
			[
				{
					id: 22,
					evaluationId: 10,
					organizationId: 1,
					status: "completed",
					totalCases: 4,
					passedCases: 4,
					failedCases: 0,
					processedCount: 4,
					environment: "prod",
					traceLog: null,
					startedAt: new Date("2026-03-12T00:00:00.000Z"),
					completedAt: new Date("2026-03-12T00:05:00.000Z"),
					createdAt: new Date("2026-03-12T00:00:00.000Z"),
				},
			],
			[
				{
					id: 401,
					evaluationRunId: 30,
					score: 72,
					total: 4,
					traceCoverageRate: "0.75",
					provenanceCoverageRate: "1",
					breakdown: { accuracy: 72 },
					flags: { minN: false },
					evidenceLevel: "medium",
					scoringVersion: "v1",
					model: "gpt-4",
					isBaseline: false,
					inputsHash: "abc",
					scoringSpecHash: "def",
					scoringCommit: "sha",
					createdAt: new Date("2026-03-13T00:06:00.000Z"),
				},
			],
			[
				{
					id: 402,
					evaluationRunId: 22,
					score: 82,
					total: 4,
					traceCoverageRate: "1",
					provenanceCoverageRate: "1",
					breakdown: { accuracy: 82 },
					flags: { minN: false },
					evidenceLevel: "strong",
					scoringVersion: "v1",
					model: "gpt-4",
					isBaseline: true,
					inputsHash: "ghi",
					scoringSpecHash: "jkl",
					scoringCommit: "sha2",
					createdAt: new Date("2026-03-12T00:06:00.000Z"),
				},
			],
			[
				{
					id: 7,
					kind: "analysis",
					title: "Failure analysis",
					summary: { rows: 2 },
					payload: { rows: [{ failureMode: "tool_failure" }] },
					metadata: { source: "evaluation_run", evaluationRunId: 30 },
					evaluationRunId: 30,
					createdAt: new Date("2026-03-13T00:07:00.000Z"),
					updatedAt: new Date("2026-03-13T00:08:00.000Z"),
				},
			],
		];

		const payload = await evalgateExportService.build(1, 10, {
			runId: 30,
			artifactLimit: 5,
		});

		expect(reportCardsService.generateReportCard).toHaveBeenCalledWith(10, 1);
		expect(payload).not.toBeNull();
		expect(payload).toMatchObject({
			type: "unit_test",
			summary: { totalTests: 4, passed: 3, failed: 1, passRate: "75%" },
			run: { id: 30, environment: "prod" },
			baselineRun: { id: 22 },
			report: { evaluationId: 10, organizationName: "Test Org" },
			quality: {
				current: { score: 72 },
				baseline: { score: 82 },
				comparison: {
					baselineRunId: 22,
					baselineScore: 82,
					regressionDelta: -10,
					regressionDetected: true,
					baselineMissing: false,
				},
			},
			artifacts: [{ id: 7, kind: "analysis", evaluationRunId: 30 }],
		});
		expect(payload?.qualityScore).toBeDefined();
		expect(payload?.testResults).toHaveLength(2);
	});
});
