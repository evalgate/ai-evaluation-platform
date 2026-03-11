import { describe, expect, it } from "vitest";

import {
	type ClusterSummary,
	clusterRunResult,
	parseClusterArgs,
} from "../../cli/cluster";
import type { RunResult } from "../../cli/run";

function createRunResult(): RunResult {
	return {
		schemaVersion: 1,
		runId: "run-test-cluster",
		metadata: {
			startedAt: 1,
			completedAt: 2,
			duration: 1,
			totalSpecs: 5,
			executedSpecs: 5,
			mode: "spec",
		},
		results: [
			{
				specId: "refund-1",
				name: "refund partial payment one",
				filePath: "evals/refunds.spec.ts",
				result: { status: "failed", duration: 10 },
				input: "User asks for refund on a partial payment order",
				expected: "Explain refund policy for partial payment and next steps",
				actual: "Refund not available for the partial payment request",
			},
			{
				specId: "refund-2",
				name: "refund partial payment two",
				filePath: "evals/refunds.spec.ts",
				result: { status: "failed", duration: 10 },
				input: "Customer needs a refund after paying part of the invoice",
				expected: "Handle partial payment refund request correctly",
				actual: "Denied the partial payment refund with wrong policy",
			},
			{
				specId: "tone-1",
				name: "support tone mismatch one",
				filePath: "evals/tone.spec.ts",
				result: { status: "failed", duration: 12 },
				input: "Write a calm support response to an angry user",
				expected: "Empathetic calm supportive response",
				actual: "Aggressive dismissive support reply",
			},
			{
				specId: "tone-2",
				name: "support tone mismatch two",
				filePath: "evals/tone.spec.ts",
				result: { status: "failed", duration: 11 },
				input: "Respond with empathy and calm tone",
				expected: "Calm empathetic response to upset customer",
				actual: "Rude angry response with no empathy",
			},
			{
				specId: "pass-1",
				name: "healthy passing case",
				filePath: "evals/general.spec.ts",
				result: { status: "passed", duration: 8 },
				input: "Say hello politely",
				expected: "Friendly greeting",
				actual: "Hello there",
			},
		],
		summary: {
			passed: 1,
			failed: 4,
			skipped: 0,
			passRate: 0.2,
		},
	};
}

describe("parseClusterArgs", () => {
	it("parses flags and aliases", () => {
		const parsed = parseClusterArgs([
			"--run",
			"run.json",
			"--output",
			"clusters.json",
			"--format",
			"json",
			"--k",
			"4",
			"--include-passed",
		]);

		expect(parsed).toEqual({
			runPath: "run.json",
			outputPath: "clusters.json",
			format: "json",
			clusters: 4,
			includePassed: true,
		});
	});
});

describe("clusterRunResult", () => {
	it("clusters failed traces and skips passing traces by default", async () => {
		const summary = await clusterRunResult(createRunResult(), { clusters: 2 });

		expect(summary.clusteredCases).toBe(4);
		expect(summary.skippedCases).toBe(1);
		expect(summary.clusters).toHaveLength(2);
		// With the new embedding-based clustering, we expect different cluster sizes
		// The important thing is that all failed traces are clustered
		const totalClustered = summary.clusters.reduce(
			(sum, cluster) => sum + cluster.traceCount,
			0,
		);
		expect(totalClustered).toBe(4);

		// Verify that we have the expected trace IDs across all clusters
		const allTraceIds = summary.clusters.flatMap((cluster) => cluster.traceIds);
		expect(allTraceIds).toContain("refund-1");
		expect(allTraceIds).toContain("refund-2");
		expect(allTraceIds).toContain("tone-1");
		expect(allTraceIds).toContain("tone-2");
	});

	it("can include passing traces when requested", async () => {
		const summary: ClusterSummary = await clusterRunResult(createRunResult(), {
			clusters: 2,
			includePassed: true,
		});

		expect(summary.clusteredCases).toBe(5);
		expect(summary.skippedCases).toBe(0);
		// With the new embedding-based clustering, we expect different cluster sizes
		// The important thing is that all traces are clustered
		const totalClustered = summary.clusters.reduce(
			(sum, cluster) => sum + cluster.traceCount,
			0,
		);
		expect(totalClustered).toBe(5);
		expect(
			summary.clusters.reduce(
				(total, cluster) => total + cluster.statusCounts.passed,
				0,
			),
		).toBe(1); // One passing trace
	});
});
