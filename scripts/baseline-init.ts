#!/usr/bin/env npx tsx
/**
 * Hello World Baseline Generator
 *
 * Creates an initial evals/baseline.json from a sample evaluation.
 * New users run this once, commit the file, then the regression gate works.
 *
 * Usage: pnpm eval:baseline-init
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASELINE_PATH = path.resolve(process.cwd(), "evals/baseline.json");
const EVALS_DIR = path.resolve(process.cwd(), "evals");

function main(): number {
	if (existsSync(BASELINE_PATH)) {
		console.log("⚠  evals/baseline.json already exists.");
		console.log(
			"   To update it with live scores, run: pnpm eval:baseline-update",
		);
		console.log(
			"   To overwrite, delete the file first and re-run this command.",
		);
		return 0;
	}

	// Ensure evals/ directory exists
	if (!existsSync(EVALS_DIR)) {
		mkdirSync(EVALS_DIR, { recursive: true });
	}

	const baseline = {
		description:
			"Regression gate baseline — committed to repo, updated by pnpm eval:baseline-update",
		updatedAt: new Date().toISOString(),
		updatedBy: process.env.USER ?? process.env.USERNAME ?? "unknown",
		tolerance: {
			scoreDrop: 5,
			passRateDrop: 5,
			maxLatencyIncreaseMs: 200,
			maxCostIncreaseUsd: 0.05,
		},
		goldenEval: {
			score: 100,
			passRate: 100,
			totalCases: 3,
			passedCases: 3,
		},
		qualityScore: {
			overall: 90,
			grade: "A",
			accuracy: 85,
			safety: 100,
			latency: 90,
			cost: 90,
			consistency: 90,
		},
		confidenceTests: {
			unitPassed: true,
			unitTotal: 0,
			dbPassed: true,
			dbTotal: 0,
		},
		productMetrics: {},
	};

	writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);

	console.log("✅ Created evals/baseline.json with sample values\n");
	console.log("Next steps:");
	console.log("  1. Commit evals/baseline.json to your repo");
	console.log("  2. Copy .github/workflows/evalai.yml to enable CI gate");
	console.log("  3. Open a PR — the regression gate will run automatically\n");
	console.log("To update baseline with real scores: pnpm eval:baseline-update");

	return 0;
}

process.exit(main());
