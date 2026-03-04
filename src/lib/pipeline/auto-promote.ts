/**
 * Auto-promote heuristic — determines if a candidate eval case is eligible
 * for automatic promotion to the golden regression dataset.
 *
 * Criteria (all must be met):
 *   1. quality_score >= 90
 *   2. confidence >= 0.8 (80 when stored as 0-100 integer)
 *   3. detector_count >= 2
 */

export interface AutoPromoteInput {
	qualityScore: number;
	/** Confidence as 0-100 integer */
	confidence: number;
	detectorCount: number;
}

export const AUTO_PROMOTE_THRESHOLDS = {
	MIN_QUALITY_SCORE: 90,
	MIN_CONFIDENCE: 80, // stored as 0-100 integer
	MIN_DETECTOR_COUNT: 2,
} as const;

export function isAutoPromoteEligible(input: AutoPromoteInput): boolean {
	return (
		input.qualityScore >= AUTO_PROMOTE_THRESHOLDS.MIN_QUALITY_SCORE &&
		input.confidence >= AUTO_PROMOTE_THRESHOLDS.MIN_CONFIDENCE &&
		input.detectorCount >= AUTO_PROMOTE_THRESHOLDS.MIN_DETECTOR_COUNT
	);
}
