/**
 * Server-side trace sampling — decides whether an ingested trace should be
 * enqueued for failure analysis.
 *
 * Rules:
 * 1. Traces with status "error" → always analyze
 * 2. Traces with thumbs_down feedback → always analyze
 * 3. Success traces → sampled at configurable rate (default 10%)
 */

export interface SamplingDecision {
	shouldAnalyze: boolean;
	reason: "error_trace" | "negative_feedback" | "sampled" | "skipped";
}

export interface SamplingInput {
	traceStatus: string;
	hasFeedback: boolean;
	feedbackType?: string;
	/** Server-side sample rate for success traces (0-1, default 0.1) */
	sampleRate?: number;
	/** Override random for testing */
	randomValue?: number;
}

const DEFAULT_SAMPLE_RATE = 0.1;

export function shouldAnalyzeTrace(input: SamplingInput): SamplingDecision {
	// Rule 1: errors always analyzed
	if (input.traceStatus === "error") {
		return { shouldAnalyze: true, reason: "error_trace" };
	}

	// Rule 2: negative feedback always analyzed
	if (input.hasFeedback && input.feedbackType === "thumbs_down") {
		return { shouldAnalyze: true, reason: "negative_feedback" };
	}

	// Rule 3: random sample of success/pending traces
	const rate = input.sampleRate ?? DEFAULT_SAMPLE_RATE;
	const roll = input.randomValue ?? Math.random();

	if (roll < rate) {
		return { shouldAnalyze: true, reason: "sampled" };
	}

	return { shouldAnalyze: false, reason: "skipped" };
}
