/**
 * Unit tests for collector body Zod schema validation.
 */
import { describe, expect, it } from "vitest";
import { collectorBodySchema } from "@/lib/validation";

const validSpan = {
	span_id: "span-1",
	type: "llm" as const,
	name: "generate-response",
	input: { role: "user", content: "Hello" },
	output: { role: "assistant", content: "Hi there" },
	model: "gpt-4o",
	vendor: "openai",
	timestamps: { started_at: 1000, finished_at: 2000 },
};

const validPayload = {
	trace_id: "trace-123",
	name: "Customer Support Flow",
	status: "success" as const,
	spans: [validSpan],
};

describe("collectorBodySchema", () => {
	it("accepts a valid minimal payload", () => {
		const result = collectorBodySchema.safeParse(validPayload);
		expect(result.success).toBe(true);
	});

	it("accepts payload with source and environment", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			source: "sdk",
			environment: "production",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.source).toBe("sdk");
			expect(result.data.environment).toBe("production");
		}
	});

	it("accepts payload with user_feedback", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			user_feedback: { type: "thumbs_down", user_id: "end-user-42" },
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.user_feedback!.type).toBe("thumbs_down");
		}
	});

	it("accepts payload with metadata", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			metadata: { user_id: "u123", thread_id: "t456" },
		});
		expect(result.success).toBe(true);
	});

	it("accepts payload with duration_ms", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			duration_ms: 1500,
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing trace_id", () => {
		const { trace_id, ...rest } = validPayload;
		const result = collectorBodySchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing name", () => {
		const { name, ...rest } = validPayload;
		const result = collectorBodySchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects empty spans array", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid source value", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			source: "invalid",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid environment value", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			environment: "test",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid feedback type", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			user_feedback: { type: "invalid_type" },
		});
		expect(result.success).toBe(false);
	});

	it("defaults status to pending", () => {
		const { status, ...rest } = validPayload;
		const result = collectorBodySchema.safeParse(rest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("pending");
		}
	});

	// Span validation
	it("rejects span without span_id", () => {
		const { span_id, ...badSpan } = validSpan;
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [badSpan],
		});
		expect(result.success).toBe(false);
	});

	it("rejects span without name", () => {
		const { name, ...badSpan } = validSpan;
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [badSpan],
		});
		expect(result.success).toBe(false);
	});

	it("defaults span type to 'default'", () => {
		const { type, ...spanNoType } = validSpan;
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [spanNoType],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.spans[0].type).toBe("default");
		}
	});

	it("accepts multiple spans", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [
				validSpan,
				{
					...validSpan,
					span_id: "span-2",
					name: "tool-call",
					type: "tool" as const,
				},
			],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.spans).toHaveLength(2);
		}
	});

	it("accepts span with error field", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [{ ...validSpan, error: { message: "timeout", code: "TIMEOUT" } }],
		});
		expect(result.success).toBe(true);
	});

	it("accepts span with metrics", () => {
		const result = collectorBodySchema.safeParse({
			...validPayload,
			spans: [
				{
					...validSpan,
					metrics: {
						prompt_tokens: 100,
						completion_tokens: 50,
						total_time_ms: 800,
					},
				},
			],
		});
		expect(result.success).toBe(true);
	});
});
