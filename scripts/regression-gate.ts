#!/usr/bin/env npx tsx
/**
 * Regression Gate — compares current eval run against committed baseline.
 *
 * Usage:
 *   pnpm eval:regression-gate          # run gate check
 *   pnpm eval:baseline-update          # update baseline with current scores
 *
 * How it works:
 *   1. Reads evals/baseline.json (committed to repo)
 *   2. Reads evals/confidence-summary.json (emitted by run-confidence.ts)
 *   3. Runs golden eval (reads evals/golden/golden-results.json)
 *   4. Compares current vs baseline with tolerance
 *   5. Fails CI if regression exceeds tolerance
 *   6. Prints score/cost/latency deltas + top failing examples
 *
 * Exit codes:
 *   0 — Gate passed (no regression)
 *   1 — Gate failed: regression detected
 *   2 — Gate infra error: baseline file missing or invalid
 *   3 — Gate infra error: confidence summary missing (run pnpm test:confidence first)
 *   4 — Gate infra error: golden eval crashed or results missing
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Report schema version — bump when report shape changes */
const REPORT_SCHEMA_VERSION = 1;

const EXIT = {
  PASS: 0,
  REGRESSION: 1,
  BASELINE_MISSING: 2,
  CONFIDENCE_MISSING: 3,
  GOLDEN_ERROR: 4,
} as const;

const BASELINE_PATH = path.resolve(process.cwd(), "evals/baseline.json");
const CONFIDENCE_SUMMARY_PATH = path.resolve(process.cwd(), "evals/confidence-summary.json");
const RESULTS_PATH = path.resolve(process.cwd(), "evals/golden/golden-results.json");
const REPORT_PATH = path.resolve(process.cwd(), "evals/regression-report.json");

// ── Types ──

interface Tolerance {
  scoreDrop: number;
  passRateDrop: number;
  maxLatencyIncreaseMs: number;
  maxCostIncreaseUsd: number;
}

interface GoldenBaseline {
  score: number;
  passRate: number;
  totalCases: number;
  passedCases: number;
}

interface QualityBaseline {
  overall: number;
  grade: string;
  accuracy: number;
  safety: number;
  latency: number;
  cost: number;
  consistency: number;
}

interface ConfidenceBaseline {
  unitPassed: boolean;
  unitTotal: number;
  dbPassed: boolean;
  dbTotal: number;
}

interface ProductMetrics {
  p95ApiLatencyMs?: number;
  goldenCostUsd?: number;
}

interface QualityMetrics {
  unitLaneDurationMs?: number;
  dbLaneDurationMs?: number;
}

interface Baseline {
  schemaVersion: number;
  description: string;
  generatedAt: string;
  generatedBy: string;
  commitSha: string;
  updatedAt: string;
  updatedBy: string;
  tolerance: Tolerance;
  goldenEval: GoldenBaseline;
  qualityScore: QualityBaseline;
  confidenceTests: ConfidenceBaseline;
  productMetrics?: ProductMetrics;
  qualityMetrics?: QualityMetrics;
}

interface Delta {
  metric: string;
  baseline: number | string;
  current: number | string;
  delta: string;
  status: "pass" | "fail" | "warn";
}

interface ConfidenceSummary {
  schemaVersion: number;
  timestamp: string;
  allPassed: boolean;
  totalDurationMs: number;
  lanes: Array<{
    name: string;
    passed: boolean;
    testsPassed: number;
    testsTotal: number;
    durationMs: number;
  }>;
}

type ExitCategory = "pass" | "regression" | "infra_error";

// ── Helpers ──

function loadBaseline(): Baseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function loadConfidenceSummary(): ConfidenceSummary | null {
  if (!existsSync(CONFIDENCE_SUMMARY_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIDENCE_SUMMARY_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function getCommitSha(): string {
  try {
    const r = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
    return (r.stdout ?? "").trim() || "unknown";
  } catch {
    return "unknown";
  }
}

function runCommand(cmd: string): { ok: boolean; output: string } {
  // Cross-platform: use spawnSync with shell on Windows (needed for .cmd wrappers like pnpm)
  const isWin = process.platform === "win32";
  const parts = cmd.split(" ");
  const result = spawnSync(parts[0], parts.slice(1), {
    encoding: "utf-8",
    env: { ...process.env, NODE_ENV: "test" },
    stdio: ["pipe", "pipe", "pipe"],
    shell: isWin,
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  return { ok: result.status === 0, output };
}

// ── Report writer ──

function writeReport(
  exitCode: number,
  category: ExitCategory,
  deltas: Delta[],
  failures: string[],
  baseline: Baseline | null,
) {
  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    passed: exitCode === EXIT.PASS,
    exitCode,
    category,
    deltas,
    failures,
    baseline: baseline ? { updatedAt: baseline.updatedAt, updatedBy: baseline.updatedBy } : null,
  };
  try {
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  } catch {
    // Non-critical
  }
}

function printSummary(deltas: Delta[], failures: string[], category: ExitCategory) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Regression Gate Summary                                    ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Metric              Baseline    Current     Delta   Status ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  for (const d of deltas) {
    const icon = d.status === "pass" ? "✅" : d.status === "warn" ? "⚠️" : "❌";
    const metric = d.metric.padEnd(20);
    const base = String(d.baseline).padStart(8);
    const curr = String(d.current).padStart(10);
    const delta = String(d.delta).padStart(8);
    console.log(`║  ${icon} ${metric} ${base} ${curr} ${delta}        ║`);
  }
  console.log("╠══════════════════════════════════════════════════════════════╣");

  if (category === "infra_error") {
    console.log("║  🔧 INFRA ERROR — gate could not run                        ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    for (const f of failures) {
      console.log(`║  • ${f.padEnd(56)} ║`);
    }
  } else if (failures.length > 0) {
    console.log("║  ❌ REGRESSION DETECTED                                     ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    for (const f of failures) {
      console.log(`║  • ${f.padEnd(56)} ║`);
    }
    console.log("║                                                             ║");
    console.log("║  Fix regressions or update baseline:                        ║");
    console.log("║    pnpm eval:baseline-update                                ║");
  } else {
    console.log("║  ✅ NO REGRESSION — gate passed                             ║");
  }
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

// ── Main Gate Logic ──

function runGate(): number {
  const baseline = loadBaseline();
  if (!baseline) {
    console.error("❌ Baseline file not found: evals/baseline.json");
    console.error("   Run: pnpm eval:baseline-update to create it.");
    writeReport(EXIT.BASELINE_MISSING, "infra_error", [], ["Baseline file missing"], null);
    return EXIT.BASELINE_MISSING;
  }

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║       Regression Gate                    ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`Baseline from: ${baseline.updatedAt} (by ${baseline.updatedBy})`);
  console.log(
    `Tolerance: score ±${baseline.tolerance.scoreDrop}, passRate ±${baseline.tolerance.passRateDrop}\n`,
  );

  const deltas: Delta[] = [];
  let hasRegression = false;
  const failures: string[] = [];

  // ── 1. Golden eval (runs the command, reads structured JSON output) ──
  console.log("── Golden eval ──");
  const goldenResult = runCommand("pnpm eval:golden");

  if (!existsSync(RESULTS_PATH)) {
    console.error("❌ Golden eval results not found — eval may have crashed");
    writeReport(
      EXIT.GOLDEN_ERROR,
      "infra_error",
      [],
      ["Golden eval results file missing"],
      baseline,
    );
    return EXIT.GOLDEN_ERROR;
  }

  let goldenScore = 0;
  let goldenPassRate = 0;
  try {
    const results = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
    goldenScore = results.currentScore ?? 0;
    const goldenTotal = results.totalCount ?? 0;
    const goldenPassed = results.passedCount ?? 0;
    goldenPassRate = goldenTotal > 0 ? Math.round((goldenPassed / goldenTotal) * 100) : 0;
  } catch {
    console.error("❌ Golden eval results file is malformed");
    writeReport(
      EXIT.GOLDEN_ERROR,
      "infra_error",
      [],
      ["Golden eval results file malformed"],
      baseline,
    );
    return EXIT.GOLDEN_ERROR;
  }

  const scoreDelta = goldenScore - baseline.goldenEval.score;
  const passRateDelta = goldenPassRate - baseline.goldenEval.passRate;

  deltas.push({
    metric: "Golden score",
    baseline: baseline.goldenEval.score,
    current: goldenScore,
    delta: `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`,
    status: scoreDelta < -baseline.tolerance.scoreDrop ? "fail" : scoreDelta < 0 ? "warn" : "pass",
  });
  deltas.push({
    metric: "Golden pass rate",
    baseline: `${baseline.goldenEval.passRate}%`,
    current: `${goldenPassRate}%`,
    delta: `${passRateDelta >= 0 ? "+" : ""}${passRateDelta}%`,
    status:
      passRateDelta < -baseline.tolerance.passRateDrop
        ? "fail"
        : passRateDelta < 0
          ? "warn"
          : "pass",
  });

  if (scoreDelta < -baseline.tolerance.scoreDrop) {
    hasRegression = true;
    failures.push(
      `Golden score dropped ${Math.abs(scoreDelta)} pts (tolerance: ${baseline.tolerance.scoreDrop})`,
    );
  }
  if (!goldenResult.ok) {
    hasRegression = true;
    failures.push("Golden eval did not pass");
  }

  // ── 2. Confidence tests (read structured JSON — no regex parsing) ──
  console.log("\n── Confidence tests ──");

  // Run confidence tests to produce the summary file
  console.log("Running pnpm test:confidence...");
  runCommand("pnpm test:confidence");

  const summary = loadConfidenceSummary();
  if (!summary) {
    console.error("❌ Confidence summary not found: evals/confidence-summary.json");
    console.error("   This file is emitted by pnpm test:confidence. The command may have crashed.");
    writeReport(
      EXIT.CONFIDENCE_MISSING,
      "infra_error",
      deltas,
      ["Confidence summary file missing — test infra may have crashed"],
      baseline,
    );
    return EXIT.CONFIDENCE_MISSING;
  }

  const unitLane = summary.lanes.find((l) => l.name === "Unit confidence");
  const dbLane = summary.lanes.find((l) => l.name === "DB confidence");

  const unitPassed = unitLane?.testsPassed ?? 0;
  const unitOk = unitLane?.passed ?? false;
  const dbPassed = dbLane?.testsPassed ?? 0;
  const dbOk = dbLane?.passed ?? false;

  deltas.push({
    metric: "Unit tests",
    baseline: baseline.confidenceTests.unitTotal,
    current: unitPassed,
    delta: unitOk ? "✓" : `${unitPassed - baseline.confidenceTests.unitTotal}`,
    status: unitOk ? "pass" : "fail",
  });
  deltas.push({
    metric: "DB tests",
    baseline: baseline.confidenceTests.dbTotal,
    current: dbPassed,
    delta: dbOk ? "✓" : `${dbPassed - baseline.confidenceTests.dbTotal}`,
    status: dbOk ? "pass" : "fail",
  });

  if (!unitOk) {
    hasRegression = true;
    failures.push(
      `Unit confidence tests failed (${unitPassed} passed, expected ${baseline.confidenceTests.unitTotal})`,
    );
  }
  if (!dbOk) {
    hasRegression = true;
    failures.push(
      `DB confidence tests failed (${dbPassed} passed, expected ${baseline.confidenceTests.dbTotal})`,
    );
  }

  // ── 3. Product metrics — real API latency (if baseline has it) ──
  if (baseline.productMetrics?.p95ApiLatencyMs != null) {
    const baseLatency = baseline.productMetrics.p95ApiLatencyMs;
    // Read from latency benchmark results if available
    const latencyResultsPath = path.resolve(process.cwd(), "evals/latency-benchmark.json");
    let currentLatency = baseLatency; // default: no change
    if (existsSync(latencyResultsPath)) {
      try {
        const lr = JSON.parse(readFileSync(latencyResultsPath, "utf-8"));
        currentLatency = lr.p95Ms ?? baseLatency;
      } catch {
        /* use default */
      }
    }
    const latDelta = currentLatency - baseLatency;
    deltas.push({
      metric: "p95 API latency (ms)",
      baseline: baseLatency,
      current: currentLatency,
      delta: `${latDelta >= 0 ? "+" : ""}${latDelta}`,
      status:
        latDelta > baseline.tolerance.maxLatencyIncreaseMs
          ? "fail"
          : latDelta > 0
            ? "warn"
            : "pass",
    });
    if (latDelta > baseline.tolerance.maxLatencyIncreaseMs) {
      hasRegression = true;
      failures.push(
        `p95 API latency increased ${latDelta}ms (tolerance: ${baseline.tolerance.maxLatencyIncreaseMs}ms)`,
      );
    }
  }

  // ── 4. Quality metrics — lane durations (informational, not gating) ──
  if (summary) {
    const dbDur = dbLane?.durationMs ?? 0;
    if (baseline.qualityMetrics?.dbLaneDurationMs != null) {
      const baseDur = baseline.qualityMetrics.dbLaneDurationMs;
      const durDelta = dbDur - baseDur;
      deltas.push({
        metric: "DB lane duration (ms)",
        baseline: baseDur,
        current: dbDur,
        delta: `${durDelta >= 0 ? "+" : ""}${durDelta}`,
        status: "pass", // informational only
      });
    }
  }

  // ── Summary ──
  const category: ExitCategory = hasRegression ? "regression" : "pass";
  const exitCode = hasRegression ? EXIT.REGRESSION : EXIT.PASS;
  printSummary(deltas, failures, category);
  writeReport(exitCode, category, deltas, failures, baseline);
  return exitCode;
}

// ── Baseline Update ──

function updateBaseline(): number {
  console.log("\n── Updating baseline ──\n");

  // Run golden eval
  runCommand("pnpm eval:golden");
  let goldenScore = 100;
  let goldenPassRate = 100;
  let goldenTotal = 3;
  let goldenPassed = 3;

  if (existsSync(RESULTS_PATH)) {
    try {
      const results = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
      goldenScore = results.currentScore ?? 100;
      goldenTotal = results.totalCount ?? 3;
      goldenPassed = results.passedCount ?? 3;
      goldenPassRate = goldenTotal > 0 ? Math.round((goldenPassed / goldenTotal) * 100) : 100;
    } catch {
      // Use defaults
    }
  }

  // Run confidence tests (produces evals/confidence-summary.json)
  runCommand("pnpm test:confidence");
  const summary = loadConfidenceSummary();

  const unitLane = summary?.lanes.find((l) => l.name === "Unit confidence");
  const dbLane = summary?.lanes.find((l) => l.name === "DB confidence");

  const unitPassed = unitLane?.testsPassed ?? 0;
  const unitOk = unitLane?.passed ?? false;
  const dbPassed = dbLane?.testsPassed ?? 0;
  const dbOk = dbLane?.passed ?? false;

  // Load existing baseline for tolerance and quality values (or use defaults)
  const existing = loadBaseline();
  const tolerance = existing?.tolerance ?? {
    scoreDrop: 5,
    passRateDrop: 5,
    maxLatencyIncreaseMs: 200,
    maxCostIncreaseUsd: 0.05,
  };

  // Compute quality metrics (lane durations — informational)
  const unitDur = unitLane?.durationMs;
  const dbDur = dbLane?.durationMs;

  // Read latency benchmark if available
  const latencyResultsPath = path.resolve(process.cwd(), "evals/latency-benchmark.json");
  let p95ApiLatencyMs: number | undefined;
  if (existsSync(latencyResultsPath)) {
    try {
      const lr = JSON.parse(readFileSync(latencyResultsPath, "utf-8"));
      p95ApiLatencyMs = lr.p95Ms;
    } catch {
      /* skip */
    }
  }

  const now = new Date().toISOString();
  const who = process.env.USER ?? process.env.USERNAME ?? "unknown";
  const sha = getCommitSha();

  const newBaseline: Baseline = {
    schemaVersion: 1,
    description:
      "Regression gate baseline — committed to repo, updated by pnpm eval:baseline-update",
    generatedAt: now,
    generatedBy: who,
    commitSha: sha,
    updatedAt: now,
    updatedBy: who,
    tolerance,
    goldenEval: {
      score: goldenScore,
      passRate: goldenPassRate,
      totalCases: goldenTotal,
      passedCases: goldenPassed,
    },
    qualityScore: existing?.qualityScore ?? {
      overall: 90,
      grade: "A",
      accuracy: 85,
      safety: 100,
      latency: 90,
      cost: 90,
      consistency: 90,
    },
    confidenceTests: {
      unitPassed: unitOk,
      unitTotal: unitPassed || 0,
      dbPassed: dbOk,
      dbTotal: dbPassed || 0,
    },
    productMetrics: {
      p95ApiLatencyMs: p95ApiLatencyMs ?? existing?.productMetrics?.p95ApiLatencyMs,
      goldenCostUsd: existing?.productMetrics?.goldenCostUsd,
    },
    qualityMetrics: {
      unitLaneDurationMs: unitDur,
      dbLaneDurationMs: dbDur,
    },
  };

  writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2) + "\n");
  console.log(`✅ Baseline updated: ${BASELINE_PATH}`);
  console.log(`   Commit: ${sha}`);
  console.log(`   Golden: score=${goldenScore}, passRate=${goldenPassRate}%`);
  console.log(`   Unit confidence: ${unitPassed} tests (${unitOk ? "passed" : "FAILED"})`);
  console.log(`   DB confidence: ${dbPassed} tests (${dbOk ? "passed" : "FAILED"})`);
  if (unitDur != null) console.log(`   Unit lane: ${unitDur}ms`);
  if (dbDur != null) console.log(`   DB lane: ${dbDur}ms`);
  if (p95ApiLatencyMs != null) console.log(`   p95 API latency: ${p95ApiLatencyMs}ms`);
  console.log();

  return 0;
}

// ── Entry Point ──

const mode = process.argv[2];
if (mode === "update") {
  process.exit(updateBaseline());
} else {
  process.exit(runGate());
}
