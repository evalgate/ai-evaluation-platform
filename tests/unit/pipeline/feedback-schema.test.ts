/**
 * Unit tests for feedback body schema validation (used by POST /api/traces/:id/feedback).
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirror the schema from the route (pure validation, no DB imports)
const feedbackBodySchema = z.object({
	feedback_type: z.enum(["thumbs_up", "thumbs_down", "rating", "comment"]),
	value: z.record(z.unknown()).optional(),
	user_id_external: z.string().optional(),
});

describe("feedbackBodySchema", () => {
	it("accepts thumbs_up", () => {
		const result = feedbackBodySchema.safeParse({ feedback_type: "thumbs_up" });
		expect(result.success).toBe(true);
	});

	it("accepts thumbs_down with value", () => {
		const result = feedbackBodySchema.safeParse({
			feedback_type: "thumbs_down",
			value: { score: 0 },
			user_id_external: "end-user-42",
		});
		expect(result.success).toBe(true);
	});

	it("accepts rating with score and comment", () => {
		const result = feedbackBodySchema.safeParse({
			feedback_type: "rating",
			value: { score: 4, comment: "Pretty good" },
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid feedback_type", () => {
		const result = feedbackBodySchema.safeParse({
			feedback_type: "like",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing feedback_type", () => {
		const result = feedbackBodySchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("accepts comment type", () => {
		const result = feedbackBodySchema.safeParse({
			feedback_type: "comment",
			value: { text: "This was helpful" },
		});
		expect(result.success).toBe(true);
	});
});
