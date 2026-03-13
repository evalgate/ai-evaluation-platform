import type { AutoLedgerEntry } from "./auto-ledger";
export interface MutationFamily {
    id: string;
    description: string;
    defaultPriority: number;
    targetedFailureModes: string[];
    estimatedCost: "low" | "medium" | "high";
    patchTemplate: string | null;
}
export interface FamilyPrior {
    familyId: string;
    failureMode: string;
    attempts: number;
    wins: number;
    winRate: number;
    avgUtilityOnWin: number;
    lastAttemptedAt: string;
    vetoed: number;
}
export declare const BUILT_IN_FAMILIES: MutationFamily[];
export declare function listMutationFamilies(): MutationFamily[];
export declare function getMutationFamily(familyId: string): MutationFamily | null;
export declare function computeFamilyPriors(ledgerEntries: AutoLedgerEntry[], targetFailureMode: string): FamilyPrior[];
export declare function resolveFamilyPriorityScore(familyId: string, familyPriors: FamilyPrior[], families?: MutationFamily[]): number;
export declare function rankMutationFamilies(allowedFamilies: string[], familyPriors: FamilyPrior[], families?: MutationFamily[]): string[];
