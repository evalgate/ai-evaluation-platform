#!/usr/bin/env npx tsx
/**
 * Determinism Audit — Prove the eval gate is stable run-to-run.
 *
 * Runs the same local eval N times and asserts:
 * - Overall score variance within tolerance (ABS + REL)
 * - Per-case variance: flags flaky cases (passed in some runs, failed in others)
 *
 * Requires OPENAI_API_KEY. Skips if not set (e.g. local dev without key).
 *
 * Run: pnpm audit:determinism
 * Run: pnpm audit:determinism --fail-on-flake  (exit 1 if unknown case is flaky)
 * CI: nightly only (not every PR)
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { openAIChatEval } = require("../src/packages/sdk/dist/index.js");

const N_RUNS = 5;
const ABS_THRESHOLD = 5; // max - min <= 5
const REL_THRESHOLD = 0.02; // (max - min) / mean <= 2%
const _FLAKY_VARIANCE_THRESHOLD = 0; // case is flaky if pass rate < 100% across runs
const GOLDEN_CASES = [
  { input: "What is 2 + 2?", expectedOutput: "4" },
  { input: "Say hello in one word.", expectedOutput: "hello" },
];

const failOnFlake = process.argv.includes("--fail-on-flake");

interface PerCaseVariance {
  caseId: string;
  input: string;
  passRate: number;
  passedRuns: number;
  totalRuns: number;
  variance: number; // 1 - passRate (0 = stable, 1 = always failed)
  isFlaky: boolean;
}

async function main(): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("audit:determinism — OPENAI_API_KEY not set, skipping (run nightly with key)");
    return 0;
  }

  const scores: number[] = [];
  const perCaseByInput = new Map<string, { passed: number; total: number }>();

  for (let i = 0; i < N_RUNS; i++) {
    const result = await openAIChatEval({
      name: "determinism-audit",
      model: "gpt-4o-mini",
      apiKey,
      cases: GOLDEN_CASES,
    });
    scores.push(result.score);
    console.log(`Run ${i + 1}/${N_RUNS}: score=${result.score}`);

    for (const r of result.results) {
      const key = r.input ?? r.id ?? `case-${result.results.indexOf(r)}`;
      const prev = perCaseByInput.get(key) ?? { passed: 0, total: 0 };
      prev.total += 1;
      if (r.passed) prev.passed += 1;
      perCaseByInput.set(key, prev);
    }
  }

  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const absVariance = maxScore - minScore;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const relVariance = mean > 0 ? absVariance / mean : 0;

  const passAbs = absVariance <= ABS_THRESHOLD;
  const passRel = relVariance <= REL_THRESHOLD;

  const perCaseVariances: PerCaseVariance[] = [];
  for (const [input, { passed, total }] of perCaseByInput) {
    const passRate = total > 0 ? passed / total : 1;
    const variance = 1 - passRate;
    const isFlaky = passRate < 1 && passRate > 0;
    perCaseVariances.push({
      caseId: input.slice(0, 40) + (input.length > 40 ? "…" : ""),
      input,
      passRate,
      passedRuns: passed,
      totalRuns: total,
      variance,
      isFlaky,
    });
  }

  const flakyCases = perCaseVariances.filter((c) => c.isFlaky);

  if (!passAbs && !passRel) {
    console.error("audit:determinism — FAIL: variance exceeds both thresholds");
    console.error(`  Scores: ${scores.join(", ")}`);
    console.error(
      `  Abs: ${absVariance} (max ${ABS_THRESHOLD}), Rel: ${(relVariance * 100).toFixed(2)}% (max ${REL_THRESHOLD * 100}%)`,
    );
    return 1;
  }

  console.log(
    `audit:determinism — PASS: abs=${absVariance}<=${ABS_THRESHOLD} or rel=${(relVariance * 100).toFixed(2)}%<=${REL_THRESHOLD * 100}%`,
  );

  if (perCaseVariances.length > 0) {
    console.log("\nPer-case variance:");
    for (const c of perCaseVariances) {
      const flag = c.isFlaky ? " [FLAKY]" : "";
      console.log(
        `  ${c.caseId}: passRate=${(c.passRate * 100).toFixed(0)}% (${c.passedRuns}/${c.totalRuns})${flag}`,
      );
    }
  }

  if (flakyCases.length > 0) {
    console.log(`\naudit:determinism — ${flakyCases.length} flaky case(s) detected`);
    if (failOnFlake) {
      console.error("audit:determinism — FAIL (--fail-on-flake)");
      return 1;
    }
  }

  return 0;
}

main().then((code) => process.exit(code));
