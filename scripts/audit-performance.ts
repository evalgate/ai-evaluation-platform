#!/usr/bin/env npx tsx
/**
 * Performance Budget Audit
 *
 * Asserts max acceptable runtime for:
 * - Local eval (small suite)
 * - SDK init
 *
 * Run: pnpm audit:performance
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createTestSuite } = require("../src/packages/sdk/dist/index.js");

const N_EVAL_RUNS = 3;
const LOCAL_EVAL_P95_MAX_MS = 30_000; // P95 of 3 runs < 30s
const SDK_INIT_MAX_MS = 100;

function p95(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const idx = Math.ceil(sorted.length * 0.95) - 1;
	return sorted[Math.max(0, idx)];
}

async function main(): Promise<number> {
	let failed = false;

	// SDK init
	const initStart = performance.now();
	const { AIEvalClient } = await import("../src/packages/sdk/dist/client.js");
	new AIEvalClient({ apiKey: "test-key", baseUrl: "http://localhost:3000" });
	const initMs = performance.now() - initStart;
	if (initMs > SDK_INIT_MAX_MS) {
		console.error(
			`audit:performance — SDK init: ${initMs.toFixed(0)}ms > ${SDK_INIT_MAX_MS}ms`,
		);
		failed = true;
	} else {
		console.log(`audit:performance — SDK init: ${initMs.toFixed(0)}ms ✓`);
	}

	// Local eval — run N times, assert P95 < threshold
	const executor = async (input: string) => input;
	const suite = createTestSuite("perf-audit", {
		cases: [
			{
				input: "a",
				assertions: [(o: string) => ({ passed: o === "a", message: "" })],
			},
			{
				input: "b",
				assertions: [(o: string) => ({ passed: o === "b", message: "" })],
			},
			{
				input: "c",
				assertions: [(o: string) => ({ passed: o === "c", message: "" })],
			},
		],
		executor,
	});

	const evalDurations: number[] = [];
	for (let i = 0; i < N_EVAL_RUNS; i++) {
		const start = performance.now();
		await suite.run();
		evalDurations.push(performance.now() - start);
	}
	const p95Ms = p95(evalDurations);
	if (p95Ms > LOCAL_EVAL_P95_MAX_MS) {
		console.error(
			`audit:performance — Local eval P95: ${p95Ms.toFixed(0)}ms > ${LOCAL_EVAL_P95_MAX_MS}ms`,
		);
		failed = true;
	} else {
		console.log(`audit:performance — Local eval P95: ${p95Ms.toFixed(0)}ms ✓`);
	}

	if (failed) return 1;
	console.log("audit:performance — PASS");
	return 0;
}

main().then((code) => process.exit(code));
