import { type FamilyPrior } from "./auto-families";
import { type AutoLedgerEntry } from "./auto-ledger";
export declare const AUTO_CLUSTER_SCHEMA_VERSION = "1";
export interface ClusterMemoryBestIntervention {
    experimentId: string;
    mutationFamily: string;
    utilityScore: number;
    objectiveReduction: number;
}
export interface ClusterMemoryFailedIntervention {
    experimentId: string;
    mutationFamily: string;
    reason: "vetoed" | "discarded";
    hardVetoReason: string | null;
}
export interface ClusterMemory {
    schemaVersion: "1";
    clusterId: string;
    targetFailureMode: string;
    firstSeenAt: string;
    lastUpdatedAt: string;
    traceCount: number;
    dominantPatterns: string[];
    bestIntervention: ClusterMemoryBestIntervention | null;
    failedInterventions: ClusterMemoryFailedIntervention[];
    suggestedNextFamily: string | null;
    resolvedAt: string | null;
}
export interface UpdateClusterMemoryInput {
    entry: AutoLedgerEntry;
    allowedFamilies: string[];
    familyPriors: FamilyPrior[];
    projectRoot?: string;
    clusterId?: string;
    observedPatterns?: string[];
    resolvedThreshold?: number | null;
}
export declare function buildAutoClusterId(targetFailureMode: string): string;
export declare function resolveAutoClusterPath(clusterId: string, projectRoot?: string): string;
export declare function resolveAutoClusterRelativePath(clusterId: string, projectRoot?: string): string;
export declare function assertValidClusterMemory(value: unknown, fieldName?: string): asserts value is ClusterMemory;
export declare function writeClusterMemory(cluster: ClusterMemory, clusterPath?: string): void;
export declare function readClusterMemory(clusterPath: string): ClusterMemory;
export declare function readClusterMemoryById(clusterId: string, projectRoot?: string): ClusterMemory | null;
export declare function updateClusterMemoryForIteration(input: UpdateClusterMemoryInput): ClusterMemory;
