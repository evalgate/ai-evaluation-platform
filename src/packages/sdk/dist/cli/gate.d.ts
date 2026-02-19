/**
 * Pure gate evaluation. No console output.
 * Baseline missing → configuration failure (BAD_ARGS), not API_ERROR.
 */
import type { QualityLatestData } from "./api";
import type { CheckArgs } from "./check";
export type GateResult = {
    exitCode: number;
    passed: boolean;
    reasonCode: string;
    reasonMessage: string | null;
    /** true when gate was skipped (e.g. baseline missing + auto) */
    gateSkipped?: boolean;
    /** When policy failed: sub-check, remediation, snapshot for explain */
    policyEvidence?: {
        failedCheck: string;
        remediation: string;
        snapshot?: Record<string, unknown>;
    };
};
export declare function evaluateGate(args: CheckArgs, quality: QualityLatestData): GateResult;
