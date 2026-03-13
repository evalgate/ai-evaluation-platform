import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
	evaluationRuns,
	evaluations,
	testCases,
	testResults,
} from "@/db/schema";
import type { AssertionsJson } from "@/db/types";
import {
	type AnalyzeSummary,
	analyzeLabeledDataset,
	type LabeledGoldenCase,
	parseLabeledDataset,
} from "@/lib/evalgate/analyze-core";
import {
	type ClusterSummary,
	clusterRunResult,
} from "@/lib/evalgate/cluster-core";
import {
	calculateDiversityStats,
	type DiscoverableSpec,
	type DiversityStats,
} from "@/lib/evalgate/discover-core";
import {
	type SynthesizeSummary,
	synthesizeFromDatasetContent,
} from "@/lib/evalgate/synthesize-core";
import { track } from "@/lib/telemetry";

type EvaluationRunRecord = typeof evaluationRuns.$inferSelect;

type NormalizedResultStatus = "passed" | "failed" | "skipped";

interface RunResultRecord {
	resultId: number;
	testCaseId: number | null;
	status: string;
	output: string | null;
	error: string | null;
	durationMs: number | null;
	assertionsJson: AssertionsJson | null;
	createdAt: Date;
	testCaseName: string | null;
	testCaseInput: string | null;
	expectedOutput: string | null;
}

interface RunContext {
	run: EvaluationRunRecord;
	results: RunResultRecord[];
}

export interface RunDatasetSummary {
	run: EvaluationRunRecord;
	rows: LabeledGoldenCase[];
	content: string;
	total: number;
	passed: number;
	failed: number;
}

function normalizeResultStatus(status: string): NormalizedResultStatus {
	if (status === "passed") {
		return "passed";
	}
	if (status === "failed") {
		return "failed";
	}
	return "skipped";
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 64);
}

function inferFailureMode(
	output: string | null,
	error: string | null,
	assertionsJson: AssertionsJson | null,
): string {
	const failedAssertion = Object.entries(assertionsJson ?? {}).find(
		([, value]) => value === false,
	)?.[0];
	if (failedAssertion) {
		return `assertion_${slugify(failedAssertion) || "failure"}`;
	}

	const combinedText = `${error ?? ""}\n${output ?? ""}`.toLowerCase();
	if (
		combinedText.includes("timeout") ||
		combinedText.includes("timed out") ||
		combinedText.includes("latency")
	) {
		return "performance_timeout";
	}
	if (
		combinedText.includes("rate limit") ||
		combinedText.includes("429") ||
		combinedText.includes("quota")
	) {
		return "rate_limited";
	}
	if (
		combinedText.includes("null") ||
		combinedText.includes("undefined") ||
		combinedText.includes("nil")
	) {
		return "null_reference";
	}
	if (
		combinedText.includes("json") ||
		combinedText.includes("parse") ||
		combinedText.includes("format")
	) {
		return "format_mismatch";
	}
	if (
		combinedText.includes("tool") ||
		combinedText.includes("function call") ||
		combinedText.includes("argument")
	) {
		return "tool_failure";
	}
	if (
		combinedText.includes("assert") ||
		combinedText.includes("expect") ||
		combinedText.includes("mismatch")
	) {
		return "assertion_failure";
	}
	return "evaluation_failure";
}

async function fetchRunContext(
	organizationId: number,
	evaluationId: number,
	runId: number,
): Promise<RunContext | null> {
	const [evaluation] = await db
		.select({ id: evaluations.id })
		.from(evaluations)
		.where(
			and(
				eq(evaluations.id, evaluationId),
				eq(evaluations.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!evaluation) {
		return null;
	}

	const [run] = await db
		.select()
		.from(evaluationRuns)
		.where(
			and(
				eq(evaluationRuns.id, runId),
				eq(evaluationRuns.evaluationId, evaluationId),
				eq(evaluationRuns.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!run) {
		return null;
	}

	const results = await db
		.select({
			resultId: testResults.id,
			testCaseId: testResults.testCaseId,
			status: testResults.status,
			output: testResults.output,
			error: testResults.error,
			durationMs: testResults.durationMs,
			assertionsJson: testResults.assertionsJson,
			createdAt: testResults.createdAt,
			testCaseName: testCases.name,
			testCaseInput: testCases.input,
			expectedOutput: testCases.expectedOutput,
		})
		.from(testResults)
		.leftJoin(testCases, eq(testResults.testCaseId, testCases.id))
		.where(eq(testResults.evaluationRunId, runId))
		.orderBy(asc(testResults.createdAt));

	return { run, results };
}

function buildRunDatasetRows(
	context: RunContext,
	options: { includePassed?: boolean } = {},
): LabeledGoldenCase[] {
	const includePassed = options.includePassed !== false;
	const labeledAt =
		context.run.completedAt?.toISOString() ?? new Date().toISOString();

	return context.results.flatMap((result) => {
		const status = normalizeResultStatus(result.status);
		if (status === "skipped") {
			return [];
		}
		if (!includePassed && status !== "failed") {
			return [];
		}

		return [
			{
				caseId:
					result.testCaseId != null
						? `test-case-${result.testCaseId}`
						: `result-${result.resultId}`,
				input: result.testCaseInput ?? "",
				expected: result.expectedOutput ?? "",
				actual: result.output ?? result.error ?? "",
				label: status === "failed" ? "fail" : "pass",
				failureMode:
					status === "failed"
						? inferFailureMode(
								result.output,
								result.error,
								result.assertionsJson,
							)
						: null,
				labeledAt: result.createdAt?.toISOString?.() ?? labeledAt,
			},
		];
	});
}

function datasetContentFromRows(rows: LabeledGoldenCase[]): string {
	return rows.map((row) => JSON.stringify(row)).join("\n");
}

export const evalgateComputeService = {
	async buildRunDataset(
		organizationId: number,
		evaluationId: number,
		runId: number,
		options: { includePassed?: boolean } = {},
	): Promise<RunDatasetSummary | null> {
		const context = await fetchRunContext(organizationId, evaluationId, runId);
		if (!context) {
			return null;
		}

		const rows = buildRunDatasetRows(context, options);
		const total = rows.length;
		const failed = rows.filter((row) => row.label === "fail").length;
		const passed = total - failed;

		return {
			run: context.run,
			rows,
			content: datasetContentFromRows(rows),
			total,
			passed,
			failed,
		};
	},

	async analyzeRunDataset(
		organizationId: number,
		evaluationId: number,
		runId: number,
		options: { includePassed?: boolean; top?: number } = {},
	): Promise<{
		run: EvaluationRunRecord;
		dataset: RunDatasetSummary;
		summary: AnalyzeSummary;
	} | null> {
		const dataset = await this.buildRunDataset(
			organizationId,
			evaluationId,
			runId,
			{ includePassed: options.includePassed },
		);
		if (!dataset) {
			return null;
		}

		const summary = analyzeLabeledDataset(dataset.rows, options.top ?? 5);
		track("evalgate.analysis.generated", {
			organizationId,
			evaluationId,
			runId,
			source: "run",
			total: summary.total,
			failed: summary.failed,
		});

		return {
			run: dataset.run,
			dataset,
			summary,
		};
	},

	async clusterRun(
		organizationId: number,
		evaluationId: number,
		runId: number,
		options: { clusters?: number | null; includePassed?: boolean } = {},
	): Promise<{
		run: EvaluationRunRecord;
		summary: ClusterSummary;
	} | null> {
		const context = await fetchRunContext(organizationId, evaluationId, runId);
		if (!context) {
			return null;
		}

		const summary = await clusterRunResult(
			{
				runId: String(context.run.id),
				results: context.results.map((result) => ({
					specId:
						result.testCaseId != null
							? `test-case-${result.testCaseId}`
							: `result-${result.resultId}`,
					name:
						result.testCaseName ??
						(result.testCaseId != null
							? `Test Case ${result.testCaseId}`
							: `Result ${result.resultId}`),
					filePath:
						result.testCaseId != null
							? `evaluation/${evaluationId}/test-case/${result.testCaseId}`
							: `evaluation/${evaluationId}/result/${result.resultId}`,
					result: {
						status: normalizeResultStatus(result.status),
						error: result.error ?? undefined,
						duration: result.durationMs ?? undefined,
					},
					input: result.testCaseInput ?? "",
					expected: result.expectedOutput ?? "",
					actual: result.output ?? result.error ?? "",
				})),
			},
			options,
		);

		track("evalgate.cluster.generated", {
			organizationId,
			evaluationId,
			runId,
			clusterCount: summary.clusters.length,
			clusteredCases: summary.clusteredCases,
			skippedCases: summary.skippedCases,
		});

		return { run: context.run, summary };
	},

	analyzeDatasetContent(
		datasetContent: string,
		top = 5,
	): {
		rows: LabeledGoldenCase[];
		summary: AnalyzeSummary;
	} {
		const rows = parseLabeledDataset(datasetContent);
		const summary = analyzeLabeledDataset(rows, top);
		track("evalgate.analysis.generated", {
			source: "dataset_content",
			total: summary.total,
			failed: summary.failed,
		});
		return {
			rows,
			summary,
		};
	},

	synthesizeDatasetContent(
		datasetContent: string,
		options: {
			dimensions?: Record<string, string[]>;
			count?: number | null;
			failureModes?: string[];
		},
	): SynthesizeSummary {
		const summary = synthesizeFromDatasetContent(datasetContent, options);
		track("evalgate.synthesis.preview_generated", {
			source: "dataset_content",
			generated: summary.generated,
			sourceCases: summary.sourceCases,
			sourceFailures: summary.sourceFailures,
		});
		return summary;
	},

	discoverDiversity(
		specs: DiscoverableSpec[],
		threshold?: number,
	): DiversityStats {
		return calculateDiversityStats(specs, threshold);
	},
};
