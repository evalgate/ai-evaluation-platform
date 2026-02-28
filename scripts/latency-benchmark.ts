#!/usr/bin/env npx tsx
/**
 * Latency Benchmark — measures real endpoint p50/p95 response times.
 *
 * Usage: pnpm eval:latency-benchmark
 *
 * Targets the /api/health endpoint (stable, read-only, DB-backed).
 * Runs N iterations, computes percentiles, writes evals/latency-benchmark.json.
 *
 * The regression gate reads this file to compare against baseline.productMetrics.p95ApiLatencyMs.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

const ITERATIONS = 20;
const TARGET_PATH = "/api/health";
const BASE_URL = process.env.BENCHMARK_URL ?? "http://localhost:3000";
const OUTPUT_PATH = path.resolve(process.cwd(), "evals/latency-benchmark.json");

function percentile(sorted: number[], p: number): number {
	const idx = Math.ceil((p / 100) * sorted.length) - 1;
	return sorted[Math.max(0, idx)];
}

async function main() {
	console.log(`\n── Latency Benchmark ──`);
	console.log(`Target: ${BASE_URL}${TARGET_PATH}`);
	console.log(`Iterations: ${ITERATIONS}\n`);

	const timings: number[] = [];

	for (let i = 0; i < ITERATIONS; i++) {
		const start = performance.now();
		try {
			const res = await fetch(`${BASE_URL}${TARGET_PATH}`);
			const elapsed = Math.round(performance.now() - start);
			timings.push(elapsed);
			const status = res.ok ? "✓" : `${res.status}`;
			process.stdout.write(
				`  [${String(i + 1).padStart(2)}] ${elapsed}ms ${status}\n`,
			);
		} catch (e: unknown) {
			const elapsed = Math.round(performance.now() - start);
			timings.push(elapsed);
			process.stdout.write(
				`  [${String(i + 1).padStart(2)}] ${elapsed}ms ✗ ${(e as Error).message}\n`,
			);
		}
	}

	if (timings.length === 0) {
		console.error("\n❌ No successful requests. Is the server running?");
		console.error(`   Start with: pnpm dev`);
		process.exit(1);
	}

	const sorted = [...timings].sort((a, b) => a - b);
	const p50 = percentile(sorted, 50);
	const p95 = percentile(sorted, 95);
	const p99 = percentile(sorted, 99);
	const avg = Math.round(timings.reduce((s, t) => s + t, 0) / timings.length);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	console.log(`\n── Results ──`);
	console.log(`  p50:  ${p50}ms`);
	console.log(`  p95:  ${p95}ms`);
	console.log(`  p99:  ${p99}ms`);
	console.log(`  avg:  ${avg}ms`);
	console.log(`  min:  ${min}ms`);
	console.log(`  max:  ${max}ms`);

	const result = {
		timestamp: new Date().toISOString(),
		target: `${BASE_URL}${TARGET_PATH}`,
		iterations: ITERATIONS,
		p50Ms: p50,
		p95Ms: p95,
		p99Ms: p99,
		avgMs: avg,
		minMs: min,
		maxMs: max,
		timings,
	};

	writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
	console.log(`\n✅ Written to ${OUTPUT_PATH}\n`);
}

main();
