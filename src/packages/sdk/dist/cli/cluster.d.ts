import { type RunResult, type SpecResult } from "./run";
export type ClusterFormat = "human" | "json";
export interface ClusterFlags {
    runPath: string | null;
    outputPath: string | null;
    format: ClusterFormat;
    clusters: number | null;
    includePassed: boolean;
}
export interface ClusterSample {
    caseId: string;
    name: string;
}
export interface ClusterCase {
    caseId: string;
    name: string;
    filePath: string;
    status: SpecResult["result"]["status"];
    input: string;
    expected: string;
    actual: string;
}
export interface TraceCluster {
    id: string;
    clusterLabel: string;
    dominantPattern: string;
    suggestedFailureMode: string | null;
    similarityThreshold: number;
    traceIds: string[];
    traceCount: number;
    keywords: string[];
    memberIds: string[];
    memberCount: number;
    density: number;
    statusCounts: {
        passed: number;
        failed: number;
        skipped: number;
    };
    samples: ClusterSample[];
    cases: ClusterCase[];
}
export interface ClusterSummary {
    runId: string;
    totalRunResults: number;
    clusteredCases: number;
    skippedCases: number;
    requestedClusters: number | null;
    includePassed: boolean;
    clusters: TraceCluster[];
}
export declare function parseClusterArgs(args: string[]): ClusterFlags;
export declare function clusterRunResult(runResult: RunResult, options?: {
    clusters?: number | null;
    includePassed?: boolean;
}): Promise<ClusterSummary>;
export declare function formatClusterHuman(summary: ClusterSummary): string;
export declare function runCluster(args: string[]): Promise<number>;
