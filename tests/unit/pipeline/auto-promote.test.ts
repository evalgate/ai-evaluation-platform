/**
 * Unit tests for auto-promote heuristic.
 */
import { describe, expect, it } from "vitest";
import {
	AUTO_PROMOTE_THRESHOLDS,
	isAutoPromoteEligible,
} from "@/lib/pipeline/auto-promote";

describe("isAutoPromoteEligible", () => {
	it("returns true when all conditions met", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 92,
				confidence: 85,
				detectorCount: 3,
			}),
		).toBe(true);
	});

	it("returns false when quality_score below threshold", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 89,
				confidence: 85,
				detectorCount: 3,
			}),
		).toBe(false);
	});

	it("returns false when confidence below threshold", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 92,
				confidence: 79,
				detectorCount: 3,
			}),
		).toBe(false);
	});

	it("returns false when detector_count below threshold", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 92,
				confidence: 85,
				detectorCount: 1,
			}),
		).toBe(false);
	});

	it("returns true at exact threshold boundaries", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: AUTO_PROMOTE_THRESHOLDS.MIN_QUALITY_SCORE,
				confidence: AUTO_PROMOTE_THRESHOLDS.MIN_CONFIDENCE,
				detectorCount: AUTO_PROMOTE_THRESHOLDS.MIN_DETECTOR_COUNT,
			}),
		).toBe(true);
	});

	it("returns false when all conditions fail", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 50,
				confidence: 40,
				detectorCount: 1,
			}),
		).toBe(false);
	});

	it("returns false when only one condition met (quality)", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 95,
				confidence: 50,
				detectorCount: 1,
			}),
		).toBe(false);
	});

	it("returns false when only one condition met (confidence)", () => {
		expect(
			isAutoPromoteEligible({
				qualityScore: 50,
				confidence: 90,
				detectorCount: 1,
			}),
		).toBe(false);
	});
});
