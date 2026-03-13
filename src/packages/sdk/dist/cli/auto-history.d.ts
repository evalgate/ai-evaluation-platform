import { type AutoDecision, type AutoExperimentDetails, type AutoLedgerEntry } from "./auto-ledger";
export type AutoHistorySortKey = "timestamp" | "utility" | "objectiveReductionRatio" | "passRateDeltaRatio" | "durationMs";
export type AutoHistorySortDirection = "asc" | "desc";
export interface AutoHistoryFilter {
    decision?: AutoDecision;
    sessionId?: string;
    targetFailureMode?: string;
    mutationFamily?: string;
    limit?: number;
}
export interface AutoHistorySort {
    by?: AutoHistorySortKey;
    direction?: AutoHistorySortDirection;
}
export interface AutoHistoryRow {
    experimentId: string;
    timestamp: string;
    sessionId: string;
    decision: AutoDecision;
    targetFailureMode: string;
    mutationFamily: string;
    utilityScore: number | null;
    objectiveReductionRatio: number;
    passRateDeltaRatio: number;
    holdoutRegressions: number;
    regressions: number;
    improvements: number;
}
export interface AutoHistoryFamilyWinRate {
    mutationFamily: string;
    wins: number;
    attempts: number;
    winRate: number | null;
}
export interface AutoHistoryVetoReasonCount {
    reason: string;
    count: number;
}
export interface AutoHistoryBestExperiment {
    experimentId: string;
    utilityScore: number;
    targetFailureMode: string;
    baselineObjectiveRate: number;
    candidateObjectiveRate: number;
    objectiveRateDelta: number;
}
export interface AutoHistoryBudgetSummary {
    usedCostUsd: number;
    costLimitUsd: number | null;
    usedIterations: number;
    iterationLimit: number | null;
    remainingCostUsd: number | null;
    remainingIterations: number | null;
}
export interface AutoHistorySummaryOptions {
    projectRoot?: string;
}
export interface FormatAutoHistoryOptions extends AutoHistorySummaryOptions {
}
export interface AutoHistorySummary {
    total: number;
    decisions: Record<AutoDecision, number>;
    bestUtilityScore: number | null;
    kept: number;
    vetoed: number;
    targetLabel: string;
    bestExperiment: AutoHistoryBestExperiment | null;
    familyWinRates: AutoHistoryFamilyWinRate[];
    vetoReasons: AutoHistoryVetoReasonCount[];
    budget: AutoHistoryBudgetSummary;
}
export interface AutoHistoryInspectResult {
    entry: AutoLedgerEntry;
    details: AutoExperimentDetails | null;
    absoluteDetailsPath: string;
}
export declare function filterAutoHistoryEntries(entries: AutoLedgerEntry[], filter?: AutoHistoryFilter): AutoLedgerEntry[];
export declare function sortAutoHistoryEntries(entries: AutoLedgerEntry[], sort?: AutoHistorySort): AutoLedgerEntry[];
export declare function buildAutoHistoryRows(entries: AutoLedgerEntry[]): AutoHistoryRow[];
export declare function summarizeAutoHistory(entries: AutoLedgerEntry[], options?: AutoHistorySummaryOptions): AutoHistorySummary;
export declare function readAutoHistory(projectRoot?: string, filter?: AutoHistoryFilter, sort?: AutoHistorySort): AutoLedgerEntry[];
export declare function inspectAutoExperiment(experimentId: string, projectRoot?: string): AutoHistoryInspectResult;
export declare function formatAutoHistory(entries: AutoLedgerEntry[], options?: FormatAutoHistoryOptions): string;
export declare function formatAutoExperimentInspect(result: AutoHistoryInspectResult): string;
