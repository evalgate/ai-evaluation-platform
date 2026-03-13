import type { AssertionLLMConfig } from "../assertions";
import type { ClusterMemory } from "./auto-cluster";
import { type FamilyPrior } from "./auto-families";
import type { AutoLedgerEntry } from "./auto-ledger";
import type { AutoReflection } from "./auto-reflection";
export interface PlannerPromptCandidate {
    id: string;
    label: string;
    instruction: string;
}
export interface PlanNextIterationInput {
    iteration: number;
    objective: string;
    targetPath: string;
    targetContent: string;
    allowedFamilies: string[];
    clusterMemory: ClusterMemory | null;
    familyPriors: FamilyPrior[];
    ledgerEntries: AutoLedgerEntry[];
    recentReflections: AutoReflection[];
    hypothesis?: string | null;
    forbiddenChanges?: string[];
    llmConfig?: AssertionLLMConfig;
    maxTokens?: number;
    retryAfterIterations?: number;
    logger?: Pick<Console, "warn">;
}
export type AutoPlannerStopReason = "cluster_exhausted";
export interface AutoIterationProposal {
    selectedFamily: string | null;
    candidate: PlannerPromptCandidate | null;
    proposedPatch: string | null;
    reason?: AutoPlannerStopReason;
}
export declare function selectNextFamily(allowedFamilies: string[], clusterMemory: ClusterMemory | null, familyPriors: FamilyPrior[], ledgerEntries: AutoLedgerEntry[], _options?: {
    retryAfterIterations?: number;
}): string | null;
export declare function planNextIteration(input: PlanNextIterationInput): Promise<AutoIterationProposal>;
