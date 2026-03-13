import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
	evalgateArtifacts,
	evaluationRuns,
	evaluations,
	humanAnnotations,
	llmJudgeResults,
	qualityScores,
	testCases,
	testResults,
	user,
} from "@/db/schema";
import type {
	EvalgateArtifactKind,
	EvalgateArtifactMetadata,
	EvalgateArtifactPayload,
	EvalgateArtifactSummary,
} from "@/db/types";
import {
	calculateQualityScore,
	type EvaluationStats,
	type QualityScore,
} from "@/lib/ai-quality-score";
import { type EvaluationType, formatExportData } from "@/lib/export-templates";
import {
	type ReportCardData,
	reportCardsService,
} from "@/lib/services/report-cards.service";

type EvaluationRecord = typeof evaluations.$inferSelect;
type EvaluationRunRecord = typeof evaluationRuns.$inferSelect;
type EvalgateArtifactRecord = typeof evalgateArtifacts.$inferSelect;
type QualityScoreRecord = typeof qualityScores.$inferSelect;
type TestResultRecord = typeof testResults.$inferSelect;
type TestCaseRecord = typeof testCases.$inferSelect;
type JudgeResultRecord = typeof llmJudgeResults.$inferSelect;

interface RunResultRow {
	result: TestResultRecord;
	testCase: Pick<TestCaseRecord, "name" | "input" | "expectedOutput"> | null;
}

export interface BuildEvalgateExportInput {
	runId?: number;
	artifactLimit?: number;
}

export interface EvalgateExportArtifact {
	id: number;
	kind: EvalgateArtifactKind;
	title: string;
	summary: EvalgateArtifactSummary;
	payload: EvalgateArtifactPayload;
	metadata: EvalgateArtifactMetadata | null;
	evaluationRunId: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface EvalgateExportPayload extends Record<string, unknown> {
	run: Record<string, unknown> | null;
	baselineRun: Record<string, unknown> | null;
	report: Record<string, unknown>;
	quality: {
		card: QualityScore;
		current: Record<string, unknown> | null;
		baseline: Record<string, unknown> | null;
		comparison: {
			baselineRunId: number | null;
			baselineScore: number | null;
			regressionDelta: number | null;
			regressionDetected: boolean;
			baselineMissing: boolean;
		};
	};
	artifacts: EvalgateExportArtifact[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function toIso(value: Date | string | null | undefined): string | null {
	if (!value) return null;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}

function computeAgreementPercentage(
	annotations: Array<{
		testCaseId: number;
		rating: number | null;
		labels: unknown;
	}>,
): number {
	const grouped = new Map<string, string[]>();
	for (const annotation of annotations) {
		const labels = asRecord(annotation.labels);
		const category =
			annotation.rating != null
				? String(annotation.rating)
				: labels?.rating != null
					? String(labels.rating)
					: labels?.quality != null
						? String(labels.quality)
						: null;
		if (!category) continue;
		const key = String(annotation.testCaseId);
		const existing = grouped.get(key) ?? [];
		existing.push(category);
		grouped.set(key, existing);
	}

	const comparableGroups = [...grouped.values()].filter(
		(group) => group.length > 1,
	);
	if (comparableGroups.length === 0) return 0;

	const agreed = comparableGroups.filter((group) =>
		group.every((value) => value === group[0]),
	);
	return Math.round((agreed.length / comparableGroups.length) * 100);
}

function extractAverageCost(rows: RunResultRow[]): number {
	const costs = rows
		.map((row) => {
			const metadata = asRecord(row.result.messages);
			const directMetadata = asRecord(
				(row.result as Record<string, unknown>).metadata,
			);
			const cost = directMetadata?.cost ?? metadata?.cost;
			return typeof cost === "number" ? cost : null;
		})
		.filter(
			(value): value is number => value !== null && Number.isFinite(value),
		);

	if (costs.length === 0) return 0.01;
	return costs.reduce((sum, value) => sum + value, 0) / costs.length;
}

function extractAverageLatency(rows: RunResultRow[]): number {
	const durations = rows
		.map((row) => row.result.durationMs)
		.filter((value): value is number => typeof value === "number" && value > 0);

	if (durations.length === 0) return 500;
	return durations.reduce((sum, value) => sum + value, 0) / durations.length;
}

function extractAverageScore(
	rows: RunResultRow[],
	passed: number,
	total: number,
): number {
	const scores = rows
		.map((row) => row.result.score)
		.filter(
			(value): value is number =>
				typeof value === "number" && Number.isFinite(value),
		);

	if (scores.length === 0) {
		return total > 0 ? (passed / total) * 100 : 0;
	}

	return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function extractConsistencyScore(rows: RunResultRow[]): number {
	const scores = rows
		.map((row) => row.result.score)
		.filter(
			(value): value is number =>
				typeof value === "number" && Number.isFinite(value),
		);

	if (scores.length <= 1) return 100;
	const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
	if (mean <= 0) return 0;
	const variance =
		scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / scores.length;
	const stdDev = Math.sqrt(variance);
	const coefficientOfVariation = stdDev / mean;
	return Math.max(
		0,
		Math.min(100, Math.round(100 - coefficientOfVariation * 100)),
	);
}

function buildQualityCard(
	run: EvaluationRunRecord | null,
	rows: RunResultRow[],
	previousStats?: EvaluationStats,
): QualityScore {
	const total = run?.totalCases ?? rows.length;
	const passed =
		run?.passedCases ??
		rows.filter((row) => row.result.status === "passed").length;
	const failed = run?.failedCases ?? Math.max(total - passed, 0);
	const stats: EvaluationStats = {
		totalEvaluations: total,
		passedEvaluations: passed,
		failedEvaluations: failed,
		averageLatency: extractAverageLatency(rows),
		averageCost: extractAverageCost(rows),
		averageScore: extractAverageScore(rows, passed, total),
		consistencyScore: extractConsistencyScore(rows),
	};
	return calculateQualityScore(stats, previousStats);
}

function serializeRun(run: EvaluationRunRecord): Record<string, unknown> {
	return {
		id: run.id,
		status: run.status,
		totalCases: run.totalCases ?? 0,
		passedCases: run.passedCases ?? 0,
		failedCases: run.failedCases ?? 0,
		processedCount: run.processedCount ?? 0,
		environment: run.environment ?? "dev",
		traceLog: run.traceLog ?? null,
		startedAt: toIso(run.startedAt),
		completedAt: toIso(run.completedAt),
		createdAt: toIso(run.createdAt),
	};
}

function serializeReport(report: ReportCardData): Record<string, unknown> {
	return {
		evaluationId: report.evaluationId,
		evaluationName: report.evaluationName,
		evaluationType: report.evaluationType,
		organizationName: report.organizationName,
		totalRuns: report.totalRuns,
		completedRuns: report.completedRuns,
		averageScore: report.averageScore,
		passRate: report.passRate,
		averageDuration: report.averageDuration,
		totalCost: report.totalCost,
		lastRunAt: report.lastRunAt,
		createdAt: report.createdAt,
		performance: report.performance,
		quality: report.quality,
		trends: report.trends,
		metadata: report.metadata,
	};
}

function serializeQualityRecord(
	record: QualityScoreRecord | null,
): Record<string, unknown> | null {
	if (!record) return null;
	return {
		id: record.id,
		evaluationRunId: record.evaluationRunId,
		score: record.score,
		total: record.total,
		traceCoverageRate: record.traceCoverageRate,
		provenanceCoverageRate: record.provenanceCoverageRate,
		breakdown: record.breakdown,
		flags: record.flags,
		evidenceLevel: record.evidenceLevel,
		scoringVersion: record.scoringVersion,
		model: record.model,
		isBaseline: record.isBaseline ?? false,
		inputsHash: record.inputsHash,
		scoringSpecHash: record.scoringSpecHash,
		scoringCommit: record.scoringCommit,
		createdAt: toIso(record.createdAt),
	};
}

function serializeArtifact(
	artifact: EvalgateArtifactRecord,
): EvalgateExportArtifact {
	return {
		id: artifact.id,
		kind: artifact.kind as EvalgateArtifactKind,
		title: artifact.title,
		summary: artifact.summary,
		payload: artifact.payload,
		metadata: artifact.metadata ?? null,
		evaluationRunId: artifact.evaluationRunId ?? null,
		createdAt: toIso(artifact.createdAt) ?? new Date(0).toISOString(),
		updatedAt: toIso(artifact.updatedAt) ?? new Date(0).toISOString(),
	};
}

async function selectEvaluation(
	organizationId: number,
	evaluationId: number,
): Promise<EvaluationRecord | null> {
	const [evaluation] = await db
		.select()
		.from(evaluations)
		.where(
			and(
				eq(evaluations.id, evaluationId),
				eq(evaluations.organizationId, organizationId),
			),
		)
		.limit(1);

	return evaluation ?? null;
}

async function selectRun(
	organizationId: number,
	evaluationId: number,
	runId?: number,
): Promise<EvaluationRunRecord | null> {
	if (runId) {
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
		return run ?? null;
	}

	const [latestRun] = await db
		.select()
		.from(evaluationRuns)
		.where(
			and(
				eq(evaluationRuns.evaluationId, evaluationId),
				eq(evaluationRuns.organizationId, organizationId),
			),
		)
		.orderBy(desc(evaluationRuns.createdAt), desc(evaluationRuns.id))
		.limit(1);

	return latestRun ?? null;
}

async function selectRunResults(runId: number): Promise<RunResultRow[]> {
	return db
		.select({
			result: testResults,
			testCase: {
				name: testCases.name,
				input: testCases.input,
				expectedOutput: testCases.expectedOutput,
			},
		})
		.from(testResults)
		.leftJoin(testCases, eq(testResults.testCaseId, testCases.id))
		.where(eq(testResults.evaluationRunId, runId))
		.orderBy(asc(testResults.createdAt));
}

async function selectComparisonRun(
	organizationId: number,
	evaluation: EvaluationRecord,
	selectedRun: EvaluationRunRecord,
): Promise<EvaluationRunRecord | null> {
	if (
		evaluation.publishedRunId &&
		evaluation.publishedRunId !== selectedRun.id
	) {
		const [publishedRun] = await db
			.select()
			.from(evaluationRuns)
			.where(
				and(
					eq(evaluationRuns.id, evaluation.publishedRunId),
					eq(evaluationRuns.evaluationId, evaluation.id),
					eq(evaluationRuns.organizationId, organizationId),
				),
			)
			.limit(1);
		if (publishedRun) {
			return publishedRun;
		}
	}

	const [previousRun] = await db
		.select()
		.from(evaluationRuns)
		.where(
			and(
				eq(evaluationRuns.evaluationId, evaluation.id),
				eq(evaluationRuns.organizationId, organizationId),
				ne(evaluationRuns.id, selectedRun.id),
			),
		)
		.orderBy(desc(evaluationRuns.createdAt), desc(evaluationRuns.id))
		.limit(1);

	return previousRun ?? null;
}

async function selectQualityForRun(
	organizationId: number,
	runId: number,
): Promise<QualityScoreRecord | null> {
	const [quality] = await db
		.select()
		.from(qualityScores)
		.where(
			and(
				eq(qualityScores.evaluationRunId, runId),
				eq(qualityScores.organizationId, organizationId),
			),
		)
		.orderBy(desc(qualityScores.createdAt), desc(qualityScores.id))
		.limit(1);

	return quality ?? null;
}

async function selectArtifacts(
	organizationId: number,
	evaluationId: number,
	limit: number,
): Promise<EvalgateArtifactRecord[]> {
	return db
		.select()
		.from(evalgateArtifacts)
		.where(
			and(
				eq(evalgateArtifacts.organizationId, organizationId),
				eq(evalgateArtifacts.evaluationId, evaluationId),
			),
		)
		.orderBy(desc(evalgateArtifacts.createdAt), desc(evalgateArtifacts.id))
		.limit(limit);
}

async function buildHumanEvalAdditionalData(
	evaluation: EvaluationRecord,
	runId: number,
): Promise<Record<string, unknown>> {
	const annotations = await db
		.select({
			id: humanAnnotations.id,
			testCaseId: humanAnnotations.testCaseId,
			annotatorId: humanAnnotations.annotatorId,
			rating: humanAnnotations.rating,
			feedback: humanAnnotations.feedback,
			labels: humanAnnotations.labels,
			createdAt: humanAnnotations.createdAt,
		})
		.from(humanAnnotations)
		.where(eq(humanAnnotations.evaluationRunId, runId));

	const annotatorIds = [
		...new Set(annotations.map((annotation) => annotation.annotatorId)),
	];
	const annotatorNames = new Map<string, string>();
	if (annotatorIds.length > 0) {
		const usersData = await db
			.select({ id: user.id, name: user.name })
			.from(user)
			.where(inArray(user.id, annotatorIds));
		for (const userRecord of usersData) {
			annotatorNames.set(userRecord.id, userRecord.name ?? userRecord.id);
		}
	}

	const agreementPercentage = computeAgreementPercentage(annotations);
	const executionSettings = asRecord(evaluation.executionSettings);
	const rawCriteria = Array.isArray(executionSettings?.humanEvalCriteria)
		? executionSettings.humanEvalCriteria
		: [];

	return {
		evaluations: annotations.map((annotation) => ({
			id: String(annotation.id),
			evaluator_id: annotation.annotatorId,
			evaluator_name:
				annotatorNames.get(annotation.annotatorId) ?? annotation.annotatorId,
			test_case_id: String(annotation.testCaseId),
			ratings: {
				rating: annotation.rating,
				...(asRecord(annotation.labels) ?? {}),
			},
			comments: annotation.feedback ?? "",
			timestamp: toIso(annotation.createdAt) ?? "",
		})),
		criteria: rawCriteria.map((criterion) => {
			const entry = asRecord(criterion) ?? {};
			return {
				name: typeof entry.name === "string" ? entry.name : "",
				description:
					typeof entry.description === "string" ? entry.description : "",
				scale: typeof entry.scale === "string" ? entry.scale : "1-5",
			};
		}),
		interRaterReliability: {
			cohens_kappa: null,
			fleiss_kappa: null,
			agreement_percentage: agreementPercentage,
		},
	};
}

async function buildModelEvalAdditionalData(
	evaluation: EvaluationRecord,
	runId: number,
): Promise<Record<string, unknown>> {
	const judgeResults = await db
		.select()
		.from(llmJudgeResults)
		.where(eq(llmJudgeResults.evaluationRunId, runId));

	const modelSettings = asRecord(evaluation.modelSettings);
	return {
		judgeEvaluations: judgeResults.map((judgeResult: JudgeResultRecord) => ({
			id: String(judgeResult.id),
			test_case_id:
				judgeResult.testCaseId != null ? String(judgeResult.testCaseId) : "",
			judge_model:
				typeof modelSettings?.judgeModel === "string"
					? modelSettings.judgeModel
					: "gpt-4",
			input: judgeResult.input,
			response: judgeResult.output,
			judgment: {
				label:
					typeof asRecord(judgeResult.metadata)?.label === "string"
						? String(asRecord(judgeResult.metadata)?.label)
						: "",
				score: judgeResult.score ?? 0,
				reasoning: judgeResult.reasoning ?? "",
				metadata: asRecord(judgeResult.metadata) ?? undefined,
			},
			timestamp: toIso(judgeResult.createdAt) ?? "",
		})),
		judgePrompt:
			typeof modelSettings?.judgePrompt === "string"
				? modelSettings.judgePrompt
				: "",
		judgeModel:
			typeof modelSettings?.judgeModel === "string"
				? modelSettings.judgeModel
				: "gpt-4",
		aggregateMetrics:
			judgeResults.length > 0
				? {
						average_score:
							judgeResults.reduce(
								(sum, judgeResult) => sum + (judgeResult.score ?? 0),
								0,
							) / judgeResults.length,
						score_distribution: {},
						common_failure_patterns: [],
					}
				: undefined,
	};
}

async function buildABTestAdditionalData(
	organizationId: number,
	evaluation: EvaluationRecord,
	evaluationId: number,
	selectedRun: EvaluationRunRecord | null,
): Promise<Record<string, unknown>> {
	const runs = await db
		.select()
		.from(evaluationRuns)
		.where(
			and(
				eq(evaluationRuns.evaluationId, evaluationId),
				eq(evaluationRuns.organizationId, organizationId),
			),
		)
		.orderBy(desc(evaluationRuns.createdAt), desc(evaluationRuns.id));

	const executionSettings = asRecord(evaluation.executionSettings);
	const selectedTraceLog = asRecord(selectedRun?.traceLog);
	return {
		variants: Array.isArray(executionSettings?.variants)
			? executionSettings.variants
			: [],
		results: runs.map((run) => ({
			variant_id: asRecord(run.traceLog)?.variant_id,
			variant_name: asRecord(run.traceLog)?.variant_name,
			test_count: run.totalCases ?? 0,
			success_rate: (run.passedCases ?? 0) / Math.max(run.totalCases ?? 0, 1),
			average_latency:
				typeof asRecord(run.traceLog)?.average_latency === "number"
					? asRecord(run.traceLog)?.average_latency
					: null,
			average_cost:
				typeof asRecord(run.traceLog)?.average_cost === "number"
					? asRecord(run.traceLog)?.average_cost
					: null,
			quality_score:
				typeof asRecord(run.traceLog)?.quality_score === "number"
					? asRecord(run.traceLog)?.quality_score
					: null,
		})),
		statisticalSignificance: selectedTraceLog?.statistical_significance,
		comparison: selectedTraceLog?.comparison,
	};
}

async function buildAdditionalExportData(
	evaluation: EvaluationRecord,
	selectedRun: EvaluationRunRecord | null,
	resultRows: RunResultRow[],
): Promise<Record<string, unknown>> {
	if (!selectedRun) {
		if (evaluation.type === "ab_test") {
			return buildABTestAdditionalData(
				evaluation.organizationId,
				evaluation,
				evaluation.id,
				null,
			);
		}
		if (evaluation.type === "human_eval") {
			const executionSettings = asRecord(evaluation.executionSettings);
			return {
				evaluations: [],
				criteria: Array.isArray(executionSettings?.humanEvalCriteria)
					? executionSettings.humanEvalCriteria
					: [],
				interRaterReliability: {
					cohens_kappa: null,
					fleiss_kappa: null,
					agreement_percentage: 0,
				},
			};
		}
		if (evaluation.type === "model_eval") {
			const modelSettings = asRecord(evaluation.modelSettings);
			return {
				judgeEvaluations: [],
				judgePrompt:
					typeof modelSettings?.judgePrompt === "string"
						? modelSettings.judgePrompt
						: "",
				judgeModel:
					typeof modelSettings?.judgeModel === "string"
						? modelSettings.judgeModel
						: "gpt-4",
			};
		}
		return { testResults: [], codeValidation: undefined };
	}

	switch (evaluation.type as EvaluationType) {
		case "human_eval":
			return buildHumanEvalAdditionalData(evaluation, selectedRun.id);
		case "model_eval":
			return buildModelEvalAdditionalData(evaluation, selectedRun.id);
		case "ab_test":
			return buildABTestAdditionalData(
				evaluation.organizationId,
				evaluation,
				evaluation.id,
				selectedRun,
			);
		default:
			return {
				testResults: resultRows.map((row) => ({
					id: String(row.result.id),
					name: row.testCase?.name ?? "",
					input: row.testCase?.input,
					expected_output: row.testCase?.expectedOutput,
					actual_output: row.result.output,
					passed: row.result.status === "passed",
					execution_time_ms: row.result.durationMs ?? undefined,
					error_message: row.result.error ?? undefined,
				})),
				codeValidation: asRecord(selectedRun.traceLog)?.code_validation,
			};
	}
}

export const evalgateExportService = {
	async build(
		organizationId: number,
		evaluationId: number,
		input: BuildEvalgateExportInput = {},
	): Promise<EvalgateExportPayload | null> {
		const evaluation = await selectEvaluation(organizationId, evaluationId);
		if (!evaluation) {
			return null;
		}

		const artifactLimit = Math.min(input.artifactLimit ?? 25, 250);
		const selectedRun = await selectRun(
			organizationId,
			evaluationId,
			input.runId,
		);
		if (input.runId && !selectedRun) {
			return null;
		}

		const resultRows = selectedRun
			? await selectRunResults(selectedRun.id)
			: [];
		const comparisonRun = selectedRun
			? await selectComparisonRun(organizationId, evaluation, selectedRun)
			: null;
		const [currentQuality, baselineQuality, report, additionalData, artifacts] =
			await Promise.all([
				selectedRun
					? selectQualityForRun(organizationId, selectedRun.id)
					: Promise.resolve(null),
				comparisonRun
					? selectQualityForRun(organizationId, comparisonRun.id)
					: Promise.resolve(null),
				reportCardsService.generateReportCard(evaluationId, organizationId),
				buildAdditionalExportData(evaluation, selectedRun, resultRows),
				selectArtifacts(organizationId, evaluationId, artifactLimit),
			]);

		const previousStats =
			comparisonRun && baselineQuality
				? {
						totalEvaluations: comparisonRun.totalCases ?? 0,
						passedEvaluations: comparisonRun.passedCases ?? 0,
						failedEvaluations: comparisonRun.failedCases ?? 0,
						averageLatency: 500,
						averageCost: 0.01,
						averageScore: baselineQuality.score,
						consistencyScore: 85,
					}
				: undefined;
		const qualityCard = buildQualityCard(
			selectedRun,
			resultRows,
			previousStats,
		);
		const total = selectedRun?.totalCases ?? resultRows.length;
		const passed =
			selectedRun?.passedCases ??
			resultRows.filter((row) => row.result.status === "passed").length;
		const failed = selectedRun?.failedCases ?? Math.max(total - passed, 0);
		const exportData = formatExportData(
			{
				evaluation: {
					id: String(evaluation.id),
					name: evaluation.name,
					description: evaluation.description ?? "",
					type: evaluation.type as EvaluationType,
					category: (evaluation as { category?: string }).category,
					created_at: toIso(evaluation.createdAt) ?? new Date(0).toISOString(),
				},
				timestamp: new Date().toISOString(),
				summary: {
					totalTests: total,
					passed,
					failed,
					passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : "0%",
				},
				qualityScore: qualityCard,
			},
			additionalData,
		) as unknown as Record<string, unknown>;

		const baselineScore = baselineQuality?.score ?? null;
		const regressionDelta =
			currentQuality && baselineQuality
				? currentQuality.score - baselineQuality.score
				: null;

		return {
			...exportData,
			run: selectedRun ? serializeRun(selectedRun) : null,
			baselineRun: comparisonRun ? serializeRun(comparisonRun) : null,
			report: serializeReport(report),
			quality: {
				card: qualityCard,
				current: serializeQualityRecord(currentQuality),
				baseline: serializeQualityRecord(baselineQuality),
				comparison: {
					baselineRunId: comparisonRun?.id ?? null,
					baselineScore,
					regressionDelta,
					regressionDetected: regressionDelta !== null && regressionDelta <= -5,
					baselineMissing: selectedRun !== null && baselineQuality === null,
				},
			},
			artifacts: artifacts.map(serializeArtifact),
		};
	},
};
