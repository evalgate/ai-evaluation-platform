/**
 * Typed interfaces for all JSONB columns in the database schema.
 *
 * These replace untyped `unknown` / `as any` access patterns, giving
 * compile-time safety when reading or writing JSON metadata.
 */

// ── evaluations ──────────────────────────────────────────────

export interface ExecutionSettings {
	maxRetries?: number;
	timeout?: number;
	parallel?: boolean;
	batchSize?: number;
	[key: string]: unknown;
}

export interface ModelSettings {
	model?: string;
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	provider?: string;
	[key: string]: unknown;
}

export interface CustomMetric {
	name: string;
	formula?: string;
	weight?: number;
	threshold?: number;
	[key: string]: unknown;
}

export type CustomMetrics = CustomMetric[];

export interface ExecutorConfig {
	type?: string;
	endpoint?: string;
	headers?: Record<string, string>;
	[key: string]: unknown;
}

// ── evaluation_test_cases / test_cases ───────────────────────

export interface TestCaseMetadata {
	tags?: string[];
	category?: string;
	difficulty?: string;
	source?: string;
	[key: string]: unknown;
}

// ── evaluation_runs ──────────────────────────────────────────

export interface TraceLog {
	messages?: Array<{
		role: string;
		content: string;
		timestamp?: string;
	}>;
	originalEvaluationId?: number;
	shadowEvalType?: string;
	completedAt?: string;
	averageScore?: number;
	[key: string]: unknown;
}

// ── traces / spans ───────────────────────────────────────────

export interface TraceMetadata {
	score?: number | null;
	tags?: string[];
	environment?: string;
	userId?: string;
	sessionId?: string;
	[key: string]: unknown;
}

export interface SpanMetadata {
	model?: string;
	provider?: string;
	tokenCount?: number;
	cost?: number;
	[key: string]: unknown;
}

// ── annotation_tasks ─────────────────────────────────────────

export interface AnnotationSettings {
	guidelines?: string;
	labelSchema?: Record<string, unknown>;
	allowMultipleAnnotators?: boolean;
	[key: string]: unknown;
}

// ── annotation_items ─────────────────────────────────────────

export interface Annotation {
	labels?: Record<string, unknown>;
	score?: number;
	feedback?: string;
	[key: string]: unknown;
}

// ── llm_judge_configs ────────────────────────────────────────

export interface JudgeCriteria {
	[criterion: string]: {
		weight?: number;
		description?: string;
		threshold?: number;
	};
}

export interface JudgeSettings {
	temperature?: number;
	maxTokens?: number;
	retryCount?: number;
	[key: string]: unknown;
}

// ── llm_judge_results ────────────────────────────────────────

export interface JudgeResultMetadata {
	originalScore?: number | null;
	originalStatus?: string;
	passed?: boolean;
	evaluationRunId?: number;
	error?: string;
	generatedAt?: string;
	[key: string]: unknown;
}

// ── api_keys ─────────────────────────────────────────────────

export type ApiKeyScopes = string[];

// ── webhooks ─────────────────────────────────────────────────

export type WebhookEvents = string[];

// ── provider_keys ────────────────────────────────────────────

export interface ProviderKeyMetadata {
	description?: string;
	region?: string;
	version?: string;
	[key: string]: unknown;
}

// ── webhook_deliveries ───────────────────────────────────────

export interface WebhookPayload {
	event: string;
	data: Record<string, unknown>;
	timestamp?: string;
	[key: string]: unknown;
}

// ── human_annotations ────────────────────────────────────────

export type AnnotationLabels = Record<string, unknown>;

export interface HumanAnnotationMetadata {
	annotatorExperience?: string;
	timeSpentMs?: number;
	[key: string]: unknown;
}

// ── test_results ─────────────────────────────────────────────

export interface AssertionsJson {
	[assertionName: string]: boolean | number | string;
}

export interface TestResultMessage {
	role: string;
	content: string;
	timestamp?: string;
}

export interface ToolCall {
	name: string;
	arguments: Record<string, unknown>;
	output?: string;
	timestamp?: string;
}

// ── email_subscribers ────────────────────────────────────────

export interface SubscriberContext {
	scenario?: string;
	score?: number;
	referrer?: string;
	[key: string]: unknown;
}

export type SubscriberTags = string[];

// ── workflows ────────────────────────────────────────────────

export interface WorkflowDefinition {
	nodes: Array<{
		id: string;
		type: string;
		config?: Record<string, unknown>;
	}>;
	edges: Array<{
		from: string;
		to: string;
		condition?: string;
	}>;
	[key: string]: unknown;
}

// ── workflow_runs ────────────────────────────────────────────

export interface WorkflowRunMetadata {
	trigger?: string;
	environment?: string;
	[key: string]: unknown;
}

// ── agent_handoffs ───────────────────────────────────────────

export interface HandoffContext {
	reason?: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
}

// ── agent_decisions ──────────────────────────────────────────

export interface DecisionAlternative {
	name: string;
	score?: number;
	reasoning?: string;
}

export interface DecisionInputContext {
	messages?: Array<{ role: string; content: string }>;
	state?: Record<string, unknown>;
	[key: string]: unknown;
}

// ── benchmarks ───────────────────────────────────────────────

export interface BenchmarkDataset {
	items: Array<{
		input: string;
		expectedOutput?: string;
		metadata?: Record<string, unknown>;
	}>;
	[key: string]: unknown;
}

export interface BenchmarkMetrics {
	accuracy?: boolean;
	latency?: boolean;
	cost?: boolean;
	successRate?: boolean;
	toolUseEfficiency?: boolean;
	[key: string]: unknown;
}

// ── agent_configs ────────────────────────────────────────────

export interface AgentConfig {
	model?: string;
	temperature?: number;
	tools?: string[];
	systemPrompt?: string;
	[key: string]: unknown;
}

// ── benchmark_results ────────────────────────────────────────

export type BenchmarkCustomMetrics = Record<string, number>;

// ── golden_sets ──────────────────────────────────────────────

export type GoldenSetTestCaseIds = number[];

// ── arena_matches ────────────────────────────────────────────

export interface ArenaResult {
	modelId: string;
	modelLabel: string;
	score: number;
	output: string;
	responseTime?: number;
	tokenCount?: number;
	cost?: number;
}

export type ArenaScores = Record<string, number>;

// ── report_cards ─────────────────────────────────────────────

export interface ReportData {
	generatedAt: string;
	scores?: Record<string, number>;
	summary?: string;
	[key: string]: unknown;
}

// ── audit_logs ───────────────────────────────────────────────

export interface AuditLogMetadata {
	previousValue?: unknown;
	newValue?: unknown;
	reason?: string;
	[key: string]: unknown;
}

// ── quality_scores ───────────────────────────────────────────

export interface QualityBreakdown {
	safety?: number;
	cost?: number;
	accuracy?: number;
	relevance?: number;
	coherence?: number;
	[key: string]: unknown;
}

export interface QualityFlags {
	lowSampleSize?: boolean;
	highVariance?: boolean;
	[key: string]: unknown;
}

export type QualityInputsJson = Record<string, unknown>;
export type QualityScoringSpecJson = Record<string, unknown>;

// ── evaluation_versions ──────────────────────────────────────

export type VersionSnapshotJson = Record<string, unknown>;

// ── drift_alerts ─────────────────────────────────────────────

export interface DriftAlertMetadata {
	historicalValues?: number[];
	threshold?: number;
	[key: string]: unknown;
}

// ── shared_exports ───────────────────────────────────────────

export type ExportData = Record<string, unknown>;

// ── jobs ─────────────────────────────────────────────────────

export interface JobPayload {
	type?: string;
	webhookId?: number;
	eventType?: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
}
