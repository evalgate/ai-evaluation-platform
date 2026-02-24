/**
 * Confidence test runner — single command to run both lanes.
 *
 * Usage: pnpm test:confidence
 *
 * Runs unit confidence tests first (fast), then DB confidence tests (slower).
 * Prints a summary at the end.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const UNIT_CMD = "pnpm vitest run tests/unit/confidence --config vitest.unit.config.ts";
const DB_CMD = [
  "pnpm vitest run",
  "tests/integration/golden-flow.test.ts",
  "tests/integration/failure-modes.test.ts",
  "tests/integration/concurrency.test.ts",
  "--config vitest.db.config.ts",
].join(" ");

interface LaneResult {
  name: string;
  passed: boolean;
  durationMs: number;
  testsPassed: number;
  testsTotal: number;
}

function stripAnsi(s: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ANSI escape stripping
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function extractCounts(output: string): { passed: number; total: number } {
  const clean = stripAnsi(output);
  const m = clean.match(/^\s*Tests\s+(\d+)\s+passed\s+\((\d+)\)/m);
  if (m) return { passed: parseInt(m[1], 10), total: parseInt(m[2], 10) };
  const all = [...clean.matchAll(/(\d+)\s+passed\s+\((\d+)\)/g)];
  if (all.length > 0) {
    const last = all[all.length - 1];
    return { passed: parseInt(last[1], 10), total: parseInt(last[2], 10) };
  }
  return { passed: 0, total: 0 };
}

function runLane(name: string, cmd: string): LaneResult {
  const start = performance.now();
  const isWin = process.platform === "win32";
  const parts = cmd.split(" ");
  const result = spawnSync(parts[0], parts.slice(1), {
    encoding: "utf-8",
    env: { ...process.env, NODE_ENV: "test" },
    stdio: ["pipe", "pipe", "pipe"],
    shell: isWin,
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  process.stdout.write(output);
  const counts = extractCounts(output);
  const ok = result.status === 0;
  return {
    name,
    passed: ok,
    durationMs: Math.round(performance.now() - start),
    testsPassed: counts.passed,
    testsTotal: counts.total,
  };
}

console.log("\n╔══════════════════════════════════════════╗");
console.log("║       Confidence Test Suite              ║");
console.log("╚══════════════════════════════════════════╝\n");

const results: LaneResult[] = [];

console.log("── Unit confidence ──\n");
results.push(runLane("Unit confidence", UNIT_CMD));

console.log("\n── DB confidence ──\n");
results.push(runLane("DB confidence", DB_CMD));

// ── Summary ──
console.log("\n╔══════════════════════════════════════════╗");
console.log("║       Confidence Summary                 ║");
console.log("╠══════════════════════════════════════════╣");
for (const r of results) {
  const icon = r.passed ? "✅" : "❌";
  const time = `${(r.durationMs / 1000).toFixed(1)}s`;
  console.log(`║  ${icon} ${r.name.padEnd(25)} ${time.padStart(8)} ║`);
}
const allPassed = results.every((r) => r.passed);
const totalMs = results.reduce((s, r) => s + r.durationMs, 0);
console.log("╠══════════════════════════════════════════╣");
console.log(
  `║  ${allPassed ? "✅ ALL PASSED" : "❌ FAILURES DETECTED"}${`${(totalMs / 1000).toFixed(1)}s total`.padStart(allPassed ? 21 : 17)} ║`,
);
console.log("╚══════════════════════════════════════════╝\n");

// ── Write machine-readable summary for regression gate ──
const SUMMARY_PATH = path.resolve(process.cwd(), "evals/confidence-summary.json");
const summary = {
  schemaVersion: 1,
  timestamp: new Date().toISOString(),
  allPassed,
  totalDurationMs: totalMs,
  lanes: results.map((r) => ({
    name: r.name,
    passed: r.passed,
    testsPassed: r.testsPassed,
    testsTotal: r.testsTotal,
    durationMs: r.durationMs,
  })),
};
try {
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  console.log(`Summary written to ${SUMMARY_PATH}`);
} catch {
  // Non-critical — regression gate falls back to running tests itself
}

process.exit(allPassed ? 0 : 1);
