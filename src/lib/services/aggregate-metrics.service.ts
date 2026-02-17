/**
 * Aggregate Metrics Service
 *
 * Computes exact aggregates for quality score inputs from real DB data:
 * passRate, safetyPassRate, judgeAvg, avgLatencyMs, avgCostUsd.
 *
 * Also provides confidence bands for trend data based on sample size.
 */

import { db } from '@/db';
import {
  evaluationRuns,
  testResults,
  llmJudgeResults,
  costRecords,
  qualityScores,
} from '@/db/schema';
import { eq, and, sql, desc, isNotNull } from 'drizzle-orm';
import { computeQualityScore, type ScoreInputs, type QualityScoreResult } from '@/lib/scoring/quality-score';
import { logger } from '@/lib/logger';

export interface AggregateMetrics {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  safetyPassRate: number | null;
  safetyFromProxy: boolean; // true when using keyword proxy instead of assertionsJson
  traceCoverageRate: number | null; // for trace-linked runs: matched/total
  judgeAvg: number | null;
  avgLatencyMs: number | null;
  avgCostUsd: number | null;
}

export interface ConfidenceBand {
  lower: number;
  upper: number;
  sampleSize: number;
}

/**
 * Compute aggregates for a completed evaluation run from the test_results,
 * llm_judge_results, and cost_records tables.
 */
export async function computeRunAggregates(
  evaluationRunId: number,
  organizationId: number,
): Promise<AggregateMetrics> {
  // Pass/fail counts from test_results
  const results = await db
    .select({
      total: sql<number>`count(*)`,
      passed: sql<number>`sum(case when ${testResults.status} = 'passed' then 1 else 0 end)`,
      failed: sql<number>`sum(case when ${testResults.status} = 'failed' then 1 else 0 end)`,
      avgLatency: sql<number>`avg(${testResults.durationMs})`,
    })
    .from(testResults)
    .where(
      and(
        eq(testResults.evaluationRunId, evaluationRunId),
        eq(testResults.organizationId, organizationId),
      ),
    );

  const row = results[0] ?? { total: 0, passed: 0, failed: 0, avgLatency: null };
  const total = Number(row.total) || 0;
  const passed = Number(row.passed) || 0;
  const failed = Number(row.failed) || 0;
  const passRate = total > 0 ? passed / total : 0;
  const avgLatencyMs = row.avgLatency != null ? Number(row.avgLatency) : null;

  // Safety pass rate: prefer structured assertionsJson when available; fall back to keyword proxy
  let safetyPassRate: number | null = null;
  let safetyFromProxy = false;
  if (total > 0) {
    const resultsWithAssertions = await db
      .select({ assertionsJson: testResults.assertionsJson })
      .from(testResults)
      .where(
        and(
          eq(testResults.evaluationRunId, evaluationRunId),
          eq(testResults.organizationId, organizationId),
        ),
      );

    const withAssertions = resultsWithAssertions.filter(
      (r) => r.assertionsJson != null && typeof r.assertionsJson === 'object',
    );

    if (withAssertions.length > 0) {
      const safetyPassed = withAssertions.filter((r) => {
        const a = r.assertionsJson as Record<string, unknown>;
        return !a.pii && !a.toxicity && !a.harmful;
      }).length;
      safetyPassRate = safetyPassed / withAssertions.length;
    } else {
      safetyFromProxy = true;
      const safetyFailures = await db
        .select({ count: sql<number>`count(*)` })
        .from(testResults)
        .where(
          and(
            eq(testResults.evaluationRunId, evaluationRunId),
            eq(testResults.organizationId, organizationId),
            sql`lower(${testResults.error}) like '%safety%' or lower(${testResults.error}) like '%harmful%' or lower(${testResults.error}) like '%toxic%'`,
          ),
        );
      const safetyFails = Number(safetyFailures[0]?.count ?? 0);
      safetyPassRate = 1 - (safetyFails / total);
    }
  }

  // Judge average from llm_judge_results (org-scoped via join)
  let judgeAvg: number | null = null;
  const judgeRows = await db
    .select({
      avgScore: sql<number>`avg(cast(${llmJudgeResults.score} as real))`,
    })
    .from(llmJudgeResults)
    .innerJoin(evaluationRuns, eq(llmJudgeResults.evaluationRunId, evaluationRuns.id))
    .where(
      and(
        eq(llmJudgeResults.evaluationRunId, evaluationRunId),
        eq(evaluationRuns.organizationId, organizationId),
      ),
    );

  if (judgeRows[0]?.avgScore != null) {
    // Normalize judge score to 0..1 (judge scores are 0-100)
    judgeAvg = Number(judgeRows[0].avgScore) / 100;
  }

  // Average cost from cost_records scoped to this run (not org-wide)
  let avgCostUsd: number | null = null;
  const costRows = await db
    .select({
      avgCost: sql<number>`avg(cast(${costRecords.totalCost} as real))`,
    })
    .from(costRecords)
    .where(
      and(
        eq(costRecords.organizationId, organizationId),
        eq(costRecords.evaluationRunId, evaluationRunId),
      ),
    );

  if (costRows[0]?.avgCost != null) {
    avgCostUsd = Number(costRows[0].avgCost);
  }

  // Trace coverage: for trace-linked runs, matchedCount / total
  let traceCoverageRate: number | null = null;
  const traceLinkedCount = await db
    .select({
      total: sql<number>`count(*)`,
      matched: sql<number>`sum(case when ${testResults.traceLinkedMatched} = 1 then 1 else 0 end)`,
    })
    .from(testResults)
    .where(
      and(
        eq(testResults.evaluationRunId, evaluationRunId),
        eq(testResults.organizationId, organizationId),
        isNotNull(testResults.traceLinkedMatched),
      ),
    );
  const tcRow = traceLinkedCount[0];
  if (tcRow && Number(tcRow.total) > 0) {
    traceCoverageRate = Number(tcRow.matched) / Number(tcRow.total);
  }

  return {
    total,
    passed,
    failed,
    passRate,
    safetyPassRate,
    safetyFromProxy,
    traceCoverageRate,
    judgeAvg,
    avgLatencyMs,
    avgCostUsd,
  };
}

/**
 * Compute and persist the quality score for a completed evaluation run.
 * Called at the end of evaluation run processing.
 */
export async function computeAndStoreQualityScore(
  evaluationRunId: number,
  evaluationId: number,
  organizationId: number,
  model?: string,
): Promise<QualityScoreResult> {
  const metrics = await computeRunAggregates(evaluationRunId, organizationId);

  const inputs: ScoreInputs = {
    total: metrics.total,
    passed: metrics.passed,
    safetyPassRate: metrics.safetyPassRate ?? undefined,
    safetyFromProxy: metrics.safetyFromProxy,
    traceCoverageRate: metrics.traceCoverageRate ?? undefined,
    judgeAvg: metrics.judgeAvg ?? undefined,
    avgLatencyMs: metrics.avgLatencyMs ?? undefined,
    avgCostUsd: metrics.avgCostUsd ?? undefined,
  };

  const result = computeQualityScore(inputs);

  // Persist to quality_scores table
  await db.insert(qualityScores).values({
    evaluationRunId,
    evaluationId,
    organizationId,
    score: result.score,
    total: metrics.total,
    traceCoverageRate: metrics.traceCoverageRate != null ? String(metrics.traceCoverageRate) : null,
    breakdown: JSON.stringify(result.breakdown),
    flags: JSON.stringify(result.flags),
    evidenceLevel: result.evidenceLevel,
    scoringVersion: 'v1',
    model: model ?? null,
    createdAt: new Date().toISOString(),
  });

  logger.info('Quality score computed', {
    evaluationRunId,
    evaluationId,
    score: result.score,
    flags: result.flags,
  });

  return result;
}

/**
 * Compute Wilson-score confidence interval for a proportion.
 * Returns 95% confidence bounds [lower, upper] for the true pass rate.
 */
export function wilsonConfidence(passed: number, total: number): ConfidenceBand {
  if (total === 0) return { lower: 0, upper: 1, sampleSize: 0 };

  const z = 1.96; // 95% CI
  const p = passed / total;
  const n = total;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  return {
    lower: Math.max(0, (centre - margin) / denom),
    upper: Math.min(1, (centre + margin) / denom),
    sampleSize: total,
  };
}

/**
 * Augment a trend series with confidence bands based on sample sizes.
 */
export function addConfidenceBands(
  trendData: Array<{ score: number; passRate: number; total: number }>,
): Array<{ score: number; passRate: number; total: number; confidence: ConfidenceBand }> {
  return trendData.map((d) => ({
    ...d,
    confidence: wilsonConfidence(Math.round(d.passRate * d.total), d.total),
  }));
}
