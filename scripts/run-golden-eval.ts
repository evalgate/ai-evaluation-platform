#!/usr/bin/env npx tsx
/**
 * Golden Dataset Regression Test
 *
 * Runs a frozen eval dataset. Fails if score drops or assertions fail.
 * Uses deterministic mock executor when OPENAI_API_KEY not set (CI without key).
 * With OPENAI_API_KEY, runs real LLM eval.
 *
 * Run: pnpm eval:golden
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sdk = require("../src/packages/sdk/dist/index.js");
const { createTestSuite, expect, openAIChatEval } = sdk;

const GOLDEN_PATH = path.resolve(process.cwd(), "evals/golden/cases.json");

interface GoldenCase {
	input: string;
	expectedOutput: string;
}

interface GoldenConfig {
	name: string;
	minScore: number;
	baselineScore?: number;
	cases: GoldenCase[];
}

interface GoldenResults {
	currentScore: number;
	baselineScore: number;
	delta: number;
	passed: boolean;
	passedCount: number;
	totalCount: number;
	timestamp: string;
}

function createMockExecutor(expectedOutputs: Record<string, string>) {
	return async (input: string): Promise<string> => {
		return expectedOutputs[input] ?? "";
	};
}

async function main(): Promise<number> {
	const raw = readFileSync(GOLDEN_PATH, "utf-8");
	const config: GoldenConfig = JSON.parse(raw);

	const apiKey = process.env.OPENAI_API_KEY;

	const baseline = config.baselineScore ?? config.minScore;

	if (apiKey) {
		const result = await openAIChatEval({
			name: config.name,
			model: "gpt-4o-mini",
			apiKey,
			cases: config.cases.map((c) => ({
				input: c.input,
				expectedOutput: c.expectedOutput,
			})),
		});
		const score =
			result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
		const delta = score - baseline;
		const passed = score >= config.minScore && result.passed === result.total;

		const results: GoldenResults = {
			currentScore: score,
			baselineScore: baseline,
			delta,
			passed,
			passedCount: result.passed,
			totalCount: result.total,
			timestamp: new Date().toISOString(),
		};
		const outPath = path.resolve(
			process.cwd(),
			"evals/golden/golden-results.json",
		);
		writeFileSync(outPath, JSON.stringify(results, null, 2));

		console.log(
			`eval:golden — current=${score} baseline=${baseline} delta=${delta >= 0 ? "+" : ""}${delta} ${passed ? "PASS" : "FAIL"}`,
		);
		if (!passed) {
			if (score < config.minScore)
				console.error(`  score ${score} < minScore ${config.minScore}`);
			if (result.passed !== result.total)
				console.error(`  ${result.total - result.passed} assertion(s) failed`);
			return 1;
		}
		return 0;
	}

	// Deterministic mock: each input maps to expected output
	const expectedMap: Record<string, string> = {};
	for (const c of config.cases) {
		expectedMap[c.input] = c.expectedOutput;
	}
	const executor = createMockExecutor(expectedMap);

	const suiteCases = config.cases.map((c) => ({
		input: c.input,
		expected: c.expectedOutput,
		assertions: [
			(output: string) =>
				expect(output).toContainKeywords(
					c.expectedOutput.split(/\s+/).filter(Boolean),
				),
		],
	}));

	const suite = createTestSuite(config.name, { cases: suiteCases, executor });
	const result = await suite.run();
	const score =
		result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
	const delta = score - baseline;
	const passed = score >= config.minScore && result.passed === result.total;

	const results: GoldenResults = {
		currentScore: score,
		baselineScore: baseline,
		delta,
		passed,
		passedCount: result.passed,
		totalCount: result.total,
		timestamp: new Date().toISOString(),
	};
	const outPath = path.resolve(
		process.cwd(),
		"evals/golden/golden-results.json",
	);
	writeFileSync(outPath, JSON.stringify(results, null, 2));

	console.log(
		`eval:golden — current=${score} baseline=${baseline} delta=${delta >= 0 ? "+" : ""}${delta} ${passed ? "PASS" : "FAIL"}`,
	);

	if (!passed) {
		if (score < config.minScore)
			console.error(`  score ${score} < minScore ${config.minScore}`);
		if (result.passed !== result.total) {
			console.error(`  ${result.failed} assertion(s) failed`);
			for (const r of result.results.filter(
				(x: { passed: boolean }) => !x.passed,
			)) {
				console.error(
					`  - "${r.input}" → expected: ${r.expected}, got: ${r.actual}`,
				);
			}
		}
		return 1;
	}
	return 0;
}

main().then((code) => process.exit(code));
