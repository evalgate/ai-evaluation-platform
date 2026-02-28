/**
 * Regression Safety Tests
 *
 * Dogfood our own product: test that evaluation scores don't regress.
 * Verify export validation catches incomplete data.
 * Verify sanitization blocks secrets.
 *
 * Covers:
 * - Score tolerance (score ≥ previous - tolerance)
 * - Export data validation completeness checks
 * - Secret detection in export payloads
 * - Quality score grade boundaries (regression guard)
 */

import { describe, expect, it } from "vitest";
import {
	calculateQualityScore,
	type EvaluationStats,
} from "@/lib/ai-quality-score";
import {
	type UnitTestExportData,
	validateExportData,
} from "@/lib/export-templates";
import {
	assertNoSecrets,
	prepareExportForShare,
	sanitizeExportData,
} from "@/lib/shared-exports";

// ── Score Tolerance ──

describe("Score regression tolerance", () => {
	const TOLERANCE = 5; // Allow 5-point drop before failing

	const baselineStats: EvaluationStats = {
		totalEvaluations: 100,
		passedEvaluations: 90,
		failedEvaluations: 10,
		averageLatency: 400,
		averageCost: 0.01,
		averageScore: 90,
		consistencyScore: 92,
	};

	const baselineScore = calculateQualityScore(baselineStats);

	it("current score is within tolerance of baseline", () => {
		// Simulate a slightly degraded run
		const degraded: EvaluationStats = {
			...baselineStats,
			passedEvaluations: 87,
			failedEvaluations: 13,
			averageScore: 87,
		};
		const current = calculateQualityScore(degraded);
		expect(current.overall).toBeGreaterThanOrEqual(
			baselineScore.overall - TOLERANCE,
		);
	});

	it("detects regression beyond tolerance", () => {
		// Simulate a badly degraded run
		const badRun: EvaluationStats = {
			...baselineStats,
			passedEvaluations: 50,
			failedEvaluations: 50,
			averageScore: 50,
			consistencyScore: 40,
		};
		const bad = calculateQualityScore(badRun);
		// This SHOULD fail the tolerance check — proving the guard works
		expect(bad.overall).toBeLessThan(baselineScore.overall - TOLERANCE);
	});

	it("identical runs produce zero regression", () => {
		const runA = calculateQualityScore(baselineStats);
		const runB = calculateQualityScore(baselineStats);
		const delta = Math.abs(runA.overall - runB.overall);
		expect(delta).toBe(0);
	});
});

// ── Grade Boundary Guards ──

describe("Quality score grade boundaries", () => {
	it("perfect stats → grade A or A+", () => {
		const perfect: EvaluationStats = {
			totalEvaluations: 100,
			passedEvaluations: 100,
			failedEvaluations: 0,
			averageLatency: 50,
			averageCost: 0.0001,
			averageScore: 100,
			consistencyScore: 100,
		};
		const score = calculateQualityScore(perfect);
		expect(["A+", "A"]).toContain(score.grade);
		expect(score.overall).toBeGreaterThanOrEqual(93);
	});

	it("terrible stats → grade D or F", () => {
		const terrible: EvaluationStats = {
			totalEvaluations: 100,
			passedEvaluations: 10,
			failedEvaluations: 90,
			averageLatency: 10000,
			averageCost: 1.0,
			averageScore: 10,
			consistencyScore: 10,
		};
		const score = calculateQualityScore(terrible);
		expect(["D", "F"]).toContain(score.grade);
		expect(score.overall).toBeLessThan(50);
	});
});

// ── Export Validation ──

describe("Export data validation", () => {
	const validExport: UnitTestExportData = {
		evaluation: {
			id: "1",
			name: "Test Eval",
			description: "desc",
			type: "unit_test",
			created_at: "2025-01-01T00:00:00Z",
		},
		timestamp: "2025-01-01T00:00:00Z",
		summary: { totalTests: 1, passed: 1, failed: 0, passRate: "100%" },
		qualityScore: calculateQualityScore({
			totalEvaluations: 1,
			passedEvaluations: 1,
			failedEvaluations: 0,
			averageLatency: 100,
			averageCost: 0.01,
			averageScore: 100,
			consistencyScore: 100,
		}),
		type: "unit_test",
		testResults: [
			{
				id: "tc-1",
				name: "Test 1",
				input: "hello",
				expected_output: "world",
				actual_output: "world",
				passed: true,
			},
		],
	};

	it("valid export passes validation", () => {
		const result = validateExportData(validExport);
		expect(result.valid).toBe(true);
		expect(result.missingFields).toHaveLength(0);
	});

	it("export missing testResults fails validation", () => {
		const incomplete = { ...validExport, testResults: [] };
		const result = validateExportData(incomplete);
		expect(result.valid).toBe(false);
		expect(result.missingFields).toContain("testResults");
	});

	it("export missing evaluation.id fails validation", () => {
		const noId = {
			...validExport,
			evaluation: { ...validExport.evaluation, id: "" },
		};
		const result = validateExportData(noId);
		expect(result.valid).toBe(false);
		expect(result.missingFields).toContain("evaluation.id");
	});
});

// ── Secret Detection ──

describe("Export secret detection", () => {
	it("blocks API keys embedded in whitelisted fields", () => {
		const payload = {
			evaluation: {
				id: "1",
				name: "Test",
				description: "key is sk-proj-abc123456789012345678901234567890 here",
			},
		};
		expect(() => prepareExportForShare(payload)).toThrow();
	});

	it("blocks JWT tokens in string values", () => {
		const jwt =
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
		const payload = {
			evaluation: { id: "1", name: "Test", description: jwt },
		};
		// sanitizeExportData strips non-whitelisted keys, but the JWT is in a value
		const sanitized = sanitizeExportData(payload);
		expect(() => assertNoSecrets(sanitized)).toThrow();
	});

	it("allows clean export data through", () => {
		const clean = {
			evaluation: {
				id: "1",
				name: "Test",
				description: "A clean eval",
				type: "unit_test",
			},
			timestamp: "2025-01-01T00:00:00Z",
			summary: { totalTests: 1, passed: 1, failed: 0, passRate: "100%" },
		};
		expect(() => prepareExportForShare(clean)).not.toThrow();
	});

	it("strips unknown top-level keys", () => {
		const withExtra = {
			evaluation: { id: "1", name: "Test" },
			timestamp: "2025-01-01T00:00:00Z",
			internalNotes: "should be removed",
			debugInfo: { stack: "trace" },
		};
		const sanitized = sanitizeExportData(withExtra);
		expect(sanitized).not.toHaveProperty("internalNotes");
		expect(sanitized).not.toHaveProperty("debugInfo");
		expect(sanitized).toHaveProperty("evaluation");
		expect(sanitized).toHaveProperty("timestamp");
	});
});
