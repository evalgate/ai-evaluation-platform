import { describe, expect, it } from "vitest";
import type {
	ArenaResult,
	ExecutionSettings,
	ModelSettings,
	QualityBreakdown,
	TraceLog,
	TraceMetadata,
	WorkflowDefinition,
} from "@/db/types";

describe("Database JSON column types", () => {
	it("ExecutionSettings accepts valid structure", () => {
		const settings: ExecutionSettings = {
			maxRetries: 3,
			timeout: 30000,
			parallel: true,
			batchSize: 10,
		};
		expect(settings.maxRetries).toBe(3);
	});

	it("ModelSettings accepts model configuration", () => {
		const settings: ModelSettings = {
			model: "gpt-4o",
			systemPrompt: "You are a helpful assistant.",
			temperature: 0.7,
			maxTokens: 2048,
			provider: "openai",
		};
		expect(settings.model).toBe("gpt-4o");
		expect(settings.provider).toBe("openai");
	});

	it("TraceLog supports message array and shadow eval fields", () => {
		const log: TraceLog = {
			messages: [
				{ role: "user", content: "Hello", timestamp: "2026-01-01T00:00:00Z" },
				{ role: "assistant", content: "Hi there" },
			],
			originalEvaluationId: 42,
			shadowEvalType: "shadow_eval",
		};
		expect(log.originalEvaluationId).toBe(42);
		expect(log.messages).toHaveLength(2);
	});

	it("TraceMetadata supports score and tags", () => {
		const metadata: TraceMetadata = {
			score: 95,
			tags: ["production", "high-priority"],
			environment: "prod",
		};
		expect(metadata.score).toBe(95);
		expect(metadata.tags).toContain("production");
	});

	it("QualityBreakdown supports safety and cost dimensions", () => {
		const breakdown: QualityBreakdown = {
			safety: 0.98,
			cost: 0.75,
			accuracy: 0.92,
			relevance: 0.88,
		};
		expect(breakdown.safety).toBe(0.98);
		expect(breakdown.cost).toBe(0.75);
	});

	it("WorkflowDefinition supports DAG structure", () => {
		const definition: WorkflowDefinition = {
			nodes: [
				{ id: "start", type: "agent", config: { model: "gpt-4" } },
				{ id: "end", type: "llm" },
			],
			edges: [{ from: "start", to: "end", condition: "score > 0.8" }],
		};
		expect(definition.nodes).toHaveLength(2);
		expect(definition.edges[0].condition).toBe("score > 0.8");
	});

	it("ArenaResult captures model comparison data", () => {
		const result: ArenaResult = {
			modelId: "gpt-4o",
			modelLabel: "GPT-4o",
			score: 87,
			output: "The answer is 42.",
			responseTime: 1200,
			tokenCount: 150,
			cost: 0.003,
		};
		expect(result.score).toBe(87);
		expect(result.cost).toBe(0.003);
	});

	it("allows index-signature extensibility", () => {
		const settings: ExecutionSettings = {
			maxRetries: 3,
			customField: "custom-value",
		};
		expect(settings.customField).toBe("custom-value");
	});
});
