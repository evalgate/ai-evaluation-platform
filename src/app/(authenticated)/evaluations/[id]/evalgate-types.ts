import type { DiversityStats } from "@/lib/evalgate/discover-core";
import type { EvaluationType } from "@/lib/export-templates";

export interface EvaluationRun {
	id: number;
	totalCases?: number;
	total_cases?: number;
	total_tests?: number;
	passedCases?: number;
	passed_cases?: number;
	passed_tests?: number;
	failedCases?: number;
	failed_cases?: number;
	runId?: number;
	variant_id?: string;
	variant_name?: string;
	average_latency?: number;
	average_cost?: number;
	quality_score?: number;
	status?: string;
	createdAt?: string;
	completedAt?: string;
	startedAt?: string;
	started_at?: string;
	traceLog?: unknown;
}

export interface Evaluation {
	id: number;
	name: string;
	type: EvaluationType;
	description?: string;
	category?: string;
	created_at?: string;
	human_eval_criteria?: Array<{
		name: string;
		description: string;
		scale: string;
	}>;
	judge_prompt?: string;
	judge_model?: string;
	variants?: Array<{
		id: string;
		name: string;
		description?: string;
	}>;
}

export interface TestCase {
	id: number;
	input: string;
	expected?: string;
	expectedOutput?: string;
	actualOutput?: string;
	passed?: boolean;
	executionTimeMs?: number;
	errorMessage?: string;
	name?: string;
}

export interface RunDatasetPreview {
	total: number;
	passed: number;
	failed: number;
	content: string;
}

export interface FailureModeSummary {
	mode: string;
	count: number;
	frequency: number;
}

export interface RunAnalysisPreview {
	total: number;
	failed: number;
	passRate: number;
	failureModes: FailureModeSummary[];
}

export interface RunClusterPreview {
	id: string;
	clusterLabel: string;
	dominantPattern: string;
	suggestedFailureMode: string | null;
	traceCount: number;
	keywords: string[];
	density: number;
}

export type RunInsightKind = "dataset" | "analysis" | "cluster";

export interface RunInsightState {
	loading?: RunInsightKind;
	error?: string | null;
	dataset?: RunDatasetPreview;
	analysis?: RunAnalysisPreview;
	clusters?: RunClusterPreview[];
	saving?: RunInsightKind;
	artifactsLoading?: boolean;
	savedArtifacts?: PersistedEvalgateArtifact[];
}

export interface PersistedEvalgateArtifact {
	id: number;
	kind: "labeled_dataset" | "analysis" | "cluster" | "synthesis" | "diversity";
	title: string;
	summary: Record<string, unknown>;
	payload?: Record<string, unknown>;
	metadata?: Record<string, unknown> | null;
	evaluationRunId?: number | null;
	createdAt: string;
	updatedAt?: string;
}

export interface DiversityPreview {
	specCount: number;
	diversity: DiversityStats;
}

export interface AutoPlanPreview {
	iteration: number;
	selectedFamily: string | null;
	proposedPatch: string | null;
	candidate: {
		id: string;
		label: string;
		instruction: string;
	} | null;
	reason: string | null;
	rankedFamilies: Array<{
		id: string;
		description: string;
		estimatedCost: string;
		targetedFailureModes: string[];
	}>;
}

export interface AutoExperimentSummary {
	id: string;
	iteration: number;
	mutationFamily: string;
	candidatePatch: string | null;
	utilityScore: number | null;
	objectiveReduction: number | null;
	regressions: number | null;
	improvements: number | null;
	decision: string | null;
	hardVetoReason: string | null;
	reflection: string | null;
	createdAt: string;
}

export interface AutoSessionListItem {
	sessionId: string;
	name: string;
	status: string;
	currentIteration: number;
	maxIterations: number;
	createdAt: string;
}

export interface AutoSessionStatus {
	sessionId: string;
	name: string;
	objective: string;
	status: "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
	currentIteration: number;
	maxIterations: number;
	experiments: AutoExperimentSummary[];
	bestExperiment: AutoExperimentSummary | null;
	budgetUsed: {
		iterations: number;
		costUsd: number;
	};
	startedAt: string | null;
	completedAt: string | null;
	stopReason: string | null;
	error: string | null;
}
