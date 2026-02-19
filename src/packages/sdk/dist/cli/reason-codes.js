"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REASON_CODES = void 0;
/**
 * Canonical reason codes for gate evaluation.
 * Used by gate.ts and formatters for consistent failure classification.
 */
exports.REASON_CODES = {
    PASS: "PASS",
    WARN_REGRESSION: "WARN_REGRESSION",
    LOW_SAMPLE_SIZE: "LOW_SAMPLE_SIZE",
    BASELINE_MISSING: "BASELINE_MISSING",
    SCORE_TOO_LOW: "SCORE_TOO_LOW",
    DELTA_TOO_HIGH: "DELTA_TOO_HIGH",
    COST_BUDGET_EXCEEDED: "COST_BUDGET_EXCEEDED",
    LATENCY_BUDGET_EXCEEDED: "LATENCY_BUDGET_EXCEEDED",
    POLICY_FAILED: "POLICY_FAILED",
    UNKNOWN: "UNKNOWN",
};
