import type { AssertionLLMConfig } from "../assertions";
import { type AutoDecision, type AutoExperimentDetails, type AutoLedgerEntry } from "./auto-ledger";
export declare const AUTO_REFLECTION_SCHEMA_VERSION = "1";
export interface AutoReflection {
    schemaVersion: "1";
    experimentId: string;
    sessionId: string;
    generatedAt: string;
    targetFailureMode: string;
    mutationFamily: string;
    decision: AutoDecision;
    whatChanged: string;
    whyItLikelyHelped: string | null;
    whatRegressed: string | null;
    whatToTryNext: string[];
    whatNotToRetry: string[];
    clusterId: string | null;
    utilityScore: number;
    objectiveRateBefore: number;
    objectiveRateAfter: number;
    regressions: number;
    hardVetoReason: string | null;
}
export interface GenerateAutoReflectionInput {
    entry: AutoLedgerEntry;
    details: AutoExperimentDetails;
    projectRoot?: string;
    llmConfig?: AssertionLLMConfig;
    maxTokens?: number;
    logger?: Pick<Console, "warn">;
}
export declare function resolveAutoReflectionPath(experimentId: string, projectRoot?: string): string;
export declare function resolveAutoReflectionRelativePath(experimentId: string, projectRoot?: string): string;
export declare function assertValidAutoReflection(value: unknown, fieldName?: string): asserts value is AutoReflection;
export declare function writeAutoReflection(reflection: AutoReflection, reflectionPath?: string): void;
export declare function readAutoReflection(reflectionPath: string): AutoReflection;
export declare function generateAutoReflection(input: GenerateAutoReflectionInput): Promise<AutoReflection>;
export declare function generateAndWriteAutoReflection(input: GenerateAutoReflectionInput): Promise<AutoReflection>;
