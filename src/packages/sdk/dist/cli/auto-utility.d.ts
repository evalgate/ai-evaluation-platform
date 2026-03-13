import type { AutoDecision, AutoPassRateBasis } from "./auto-ledger";
import type { RunResult } from "./run";
export type AutoNonPlanDecision = Exclude<AutoDecision, "plan">;
export type AutoHardVetoReason = "holdout_regressions" | "critical_failure_mode_increase" | "latency_ceiling" | "cost_ceiling";
export interface AutoRunSummaryLike {
    passRate: number;
    correctedPassRate?: number | null;
}
export interface AutoPassRateResolution {
    passRateBasis: AutoPassRateBasis;
    baselinePassRate: number;
    candidatePassRate: number;
    deltaRatio: number;
}
export interface AutoUtilityInput {
    objectiveReductionRatio: number;
    regressions: number;
    improvements: number;
    holdoutRegressions: number;
    passRateDeltaRatio: number;
    correctedPassRateDeltaRatio: number;
    latencyDeltaRatio: number;
    costDeltaRatio: number;
}
export interface BuildAutoUtilityInputOptions {
    baselineObjectiveRate: number;
    candidateObjectiveRate: number;
    regressions: number;
    improvements: number;
    holdoutRegressions: number;
    passRateDeltaRatio: number;
    correctedPassRateDeltaRatio: number;
    latencyDeltaRatio: number;
    costDeltaRatio: number;
}
export interface AutoUtilityWeights {
    objectiveReductionRatio: number;
    regressions: number;
    improvements: number;
    holdoutRegressions: number;
    passRateDeltaRatio: number;
    correctedPassRateDeltaRatio: number;
    latencyDeltaRatio: number;
    costDeltaRatio: number;
}
export interface AutoUtilityContribution {
    metric: keyof AutoUtilityInput;
    value: number;
    weight: number;
    contribution: number;
}
export interface AutoUtilityResult {
    score: number;
    contributions: AutoUtilityContribution[];
}
export interface AutoHardVetoConfig {
    maxHoldoutRegressions?: number;
    maxCriticalFailureModeIncrease?: number;
    latencyCeiling?: number;
    costCeiling?: number;
}
export interface AutoHardVetoInput {
    holdoutRegressions: number;
    criticalFailureModeIncrease: number;
    latencyDeltaRatio: number;
    costUsd: number;
}
export interface AutoHardVetoResult {
    vetoed: boolean;
    reason: AutoHardVetoReason | null;
    evaluatedRules: AutoHardVetoReason[];
    matchedRule: AutoHardVetoReason | null;
}
export interface AutoUtilityDecisionConfig {
    keepThreshold?: number;
    discardThreshold?: number;
}
export interface AutoUtilityDecisionInput {
    utilityScore: number | null;
    objectiveReductionRatio: number;
    regressions: number;
    improvements: number;
    holdoutRegressions: number;
    veto: AutoHardVetoResult;
}
export interface AutoUtilityDecisionResult {
    decision: AutoNonPlanDecision;
    rationale: string[];
}
export declare function resolvePassRateBasis(baselineSummary: AutoRunSummaryLike, candidateSummary: AutoRunSummaryLike): AutoPassRateResolution;
export declare function resolvePassRateBasisFromRuns(baselineRun: Pick<RunResult, "summary">, candidateRun: Pick<RunResult, "summary">): AutoPassRateResolution;
export declare function computeObjectiveReductionRatio(baselineObjectiveRate: number, candidateObjectiveRate: number): number;
export declare function buildUtilityInput(options: BuildAutoUtilityInputOptions): AutoUtilityInput;
export declare function computeUtility(input: AutoUtilityInput, weights: AutoUtilityWeights): AutoUtilityResult;
export declare function evaluateHardVetoes(input: AutoHardVetoInput, config?: AutoHardVetoConfig): AutoHardVetoResult;
export declare function decideAutoUtilityOutcome(input: AutoUtilityDecisionInput, config?: AutoUtilityDecisionConfig): AutoUtilityDecisionResult;
