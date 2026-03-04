/**
 * Unit tests for server-side trace sampling logic.
 */
import { describe, expect, it } from "vitest";
import { shouldAnalyzeTrace } from "@/lib/collector/sampling";

describe("shouldAnalyzeTrace", () => {
	it("always analyzes error traces", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "error",
			hasFeedback: false,
			randomValue: 0.99, // would be skipped by sampling
		});
		expect(result.shouldAnalyze).toBe(true);
		expect(result.reason).toBe("error_trace");
	});

	it("always analyzes traces with thumbs_down feedback", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: true,
			feedbackType: "thumbs_down",
			randomValue: 0.99,
		});
		expect(result.shouldAnalyze).toBe(true);
		expect(result.reason).toBe("negative_feedback");
	});

	it("does NOT auto-analyze thumbs_up feedback", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: true,
			feedbackType: "thumbs_up",
			randomValue: 0.99,
		});
		expect(result.shouldAnalyze).toBe(false);
		expect(result.reason).toBe("skipped");
	});

	it("samples success traces at default 10% rate", () => {
		const analyzed = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			randomValue: 0.05, // below 0.1 threshold
		});
		expect(analyzed.shouldAnalyze).toBe(true);
		expect(analyzed.reason).toBe("sampled");

		const skipped = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			randomValue: 0.5, // above 0.1 threshold
		});
		expect(skipped.shouldAnalyze).toBe(false);
		expect(skipped.reason).toBe("skipped");
	});

	it("respects custom sample rate", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			sampleRate: 0.5,
			randomValue: 0.3, // below 0.5
		});
		expect(result.shouldAnalyze).toBe(true);

		const skipped = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			sampleRate: 0.5,
			randomValue: 0.7, // above 0.5
		});
		expect(skipped.shouldAnalyze).toBe(false);
	});

	it("sampleRate 0 skips all success traces", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			sampleRate: 0,
			randomValue: 0.0001,
		});
		expect(result.shouldAnalyze).toBe(false);
	});

	it("sampleRate 1.0 analyzes all success traces", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "success",
			hasFeedback: false,
			sampleRate: 1.0,
			randomValue: 0.999,
		});
		expect(result.shouldAnalyze).toBe(true);
	});

	it("error status takes priority over negative feedback", () => {
		const result = shouldAnalyzeTrace({
			traceStatus: "error",
			hasFeedback: true,
			feedbackType: "thumbs_down",
		});
		expect(result.reason).toBe("error_trace");
	});
});
