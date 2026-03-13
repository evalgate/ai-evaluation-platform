import type { EvaluationManifest } from "./manifest";
export declare const AUTO_HOLDOUT_SCHEMA_VERSION = 1;
export type AutoHoldoutSelectionMode = "deterministic" | "stratified";
export interface AutoHoldoutConfig {
    selection: AutoHoldoutSelectionMode;
    lockedAfter: number | null;
    count: number | null;
    ratio: number | null;
    seed: string;
    excludedSpecIds: string[];
}
export interface AutoHoldoutSelectionResult {
    selectionRequested: AutoHoldoutSelectionMode;
    selectionUsed: AutoHoldoutSelectionMode;
    specIds: string[];
    strata: Record<string, number>;
    candidateSpecIds: string[];
}
export interface AutoHoldoutArtifact {
    schemaVersion: number;
    createdAt: string;
    selectionRequested: AutoHoldoutSelectionMode;
    selectionUsed: AutoHoldoutSelectionMode;
    lockedAfter: number | null;
    seed: string;
    manifestGeneratedAt: number | null;
    manifestSpecCount: number;
    excludedSpecIds: string[];
    specIds: string[];
    strata: Record<string, number>;
}
export declare function parseAutoHoldoutConfig(value: unknown): AutoHoldoutConfig;
export declare function selectAutoHoldoutSpecs(manifest: EvaluationManifest, config: AutoHoldoutConfig): AutoHoldoutSelectionResult;
export declare function createAutoHoldoutArtifact(manifest: EvaluationManifest, config: AutoHoldoutConfig): AutoHoldoutArtifact;
export declare function assertValidAutoHoldoutArtifact(value: unknown, fieldName?: string): asserts value is AutoHoldoutArtifact;
export declare function writeAutoHoldoutArtifact(artifact: AutoHoldoutArtifact, holdoutPath?: string): void;
export declare function readAutoHoldoutArtifact(holdoutPath?: string): AutoHoldoutArtifact | null;
export declare function loadOrCreateAutoHoldout(manifest: EvaluationManifest, config: AutoHoldoutConfig, holdoutPath?: string): AutoHoldoutArtifact;
