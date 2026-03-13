export declare const AUTO_LEDGER_SCHEMA_VERSION = 1;
export type AutoDecision = "plan" | "keep" | "discard" | "vetoed" | "investigate";
export type AutoPassRateBasis = "raw" | "corrected";
export interface AutoWorkspacePaths {
    projectRoot: string;
    evalDir: string;
    autoDir: string;
    ledgerPath: string;
    detailsDir: string;
    holdoutPath: string;
    latestPath: string;
    runsDir: string;
    programPath: string;
}
export interface AutoLedgerEntry {
    schemaVersion: number;
    experimentId: string;
    sessionId: string;
    timestamp: string;
    parentExperimentId: string;
    baselineRef: string;
    candidateRef: string;
    targetFailureMode: string;
    targetClusterId: string | null;
    mutationTarget: string;
    mutationFamily: string;
    patchSummary: string;
    patchHash: string;
    targetedSpecs: string[];
    holdoutSpecs: string[];
    utilityScore: number | null;
    objectiveReductionRatio: number;
    baselineObjectiveRate: number;
    candidateObjectiveRate: number;
    regressions: number;
    improvements: number;
    holdoutRegressions: number;
    passRateDeltaRatio: number;
    correctedPassRateDeltaRatio: number;
    passRateBasis: AutoPassRateBasis;
    latencyDeltaRatio: number;
    costDeltaRatio: number;
    decision: AutoDecision;
    hardVetoReason: string | null;
    costUsd: number;
    durationMs: number;
    detailsPath: string;
    reflection: string | null;
}
export type AutoLedgerEntryInput = Omit<AutoLedgerEntry, "schemaVersion">;
export interface AutoSpecSummary {
    passToFailIds: string[];
    failToPassIds: string[];
    unchangedIds: string[];
}
export interface AutoMutationDetails {
    target: string;
    family: string;
    summary: string;
}
export interface AutoUtilityDetails {
    inputMetrics: Record<string, unknown>;
    weights: Record<string, unknown>;
    computedScore: number | null;
}
export interface AutoVetoDetails {
    evaluatedRules: string[];
    matchedRule: string | null;
}
export interface AutoAnomalyDetails {
    latencySpikes: string[];
    unexpectedFlips: string[];
    missingFailureModeMapping: string[];
}
export interface AutoReportPaths {
    baseline: string;
    candidate: string;
    targeted?: string;
    holdout?: string;
}
export interface AutoExperimentDetails {
    experimentId: string;
    sessionId: string;
    baselineRef: string;
    candidateRef: string;
    mutation: AutoMutationDetails;
    utility: AutoUtilityDetails;
    veto: AutoVetoDetails;
    targetedSpecSummary: AutoSpecSummary;
    holdoutSpecSummary: AutoSpecSummary;
    anomalies: AutoAnomalyDetails;
    reportPaths: AutoReportPaths;
    reflection: string | null;
}
export declare function resolveAutoWorkspacePaths(projectRoot?: string): AutoWorkspacePaths;
export declare function resolveAutoDetailsPath(experimentId: string, projectRoot?: string): string;
export declare function resolveAutoDetailsRelativePath(experimentId: string, projectRoot?: string): string;
export declare function createAutoLedgerEntry(input: AutoLedgerEntryInput): AutoLedgerEntry;
export declare function assertValidAutoLedgerEntry(value: unknown, fieldName?: string): asserts value is AutoLedgerEntry;
export declare function appendAutoLedgerEntry(entry: AutoLedgerEntry, ledgerPath?: string): void;
export declare function readAutoLedgerEntries(ledgerPath?: string): AutoLedgerEntry[];
export declare function assertValidAutoExperimentDetails(value: unknown, fieldName?: string): asserts value is AutoExperimentDetails;
export declare function writeAutoExperimentDetails(details: AutoExperimentDetails, detailsPath?: string): void;
export declare function readAutoExperimentDetails(detailsPath: string): AutoExperimentDetails;
