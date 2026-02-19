"use strict";
/**
 * Pure gate evaluation. No console output.
 * Baseline missing → configuration failure (BAD_ARGS), not API_ERROR.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGate = evaluateGate;
const constants_1 = require("./constants");
const policy_packs_1 = require("./policy-packs");
const reason_codes_1 = require("./reason-codes");
function evaluateGate(args, quality) {
    const score = quality?.score ?? 0;
    const total = quality?.total ?? null;
    const evidenceLevel = quality?.evidenceLevel ?? null;
    const _baselineScore = quality?.baselineScore ?? null;
    const regressionDelta = quality?.regressionDelta ?? null;
    const baselineMissing = quality?.baselineMissing === true;
    const breakdown = quality?.breakdown ?? {};
    const policyFlags = (quality?.flags ?? []);
    const avgLatencyMs = quality?.avgLatencyMs ?? null;
    const costUsd = quality?.costUsd ?? null;
    const baselineCostUsd = quality?.baselineCostUsd ?? null;
    // Baseline missing FIRST: --baseline auto → exit 0 (neutral, gate not applied); others → BAD_ARGS
    // Must run before budget gates so baseline missing + maxCostDeltaUsd ⇒ neutral, not budget failure
    if (baselineMissing) {
        const msg = args.baseline === "auto"
            ? "No baseline found. Tip: Publish a baseline from the dashboard, or run with --baseline previous once you have runs."
            : args.baseline === "production"
                ? "No prod runs exist for this evaluation. Tag runs with environment=prod before using --baseline production."
                : `Baseline (${args.baseline}) not found. Ensure a baseline run exists (e.g. published run, previous run, or prod-tagged run).`;
        if (args.baseline === "auto") {
            return {
                exitCode: constants_1.EXIT.PASS,
                passed: false,
                reasonCode: reason_codes_1.REASON_CODES.BASELINE_MISSING,
                reasonMessage: msg,
                gateSkipped: true,
            };
        }
        if (args.baseline !== "published" || args.maxDrop !== undefined) {
            return {
                exitCode: constants_1.EXIT.BAD_ARGS,
                passed: false,
                reasonCode: reason_codes_1.REASON_CODES.BASELINE_MISSING,
                reasonMessage: msg,
            };
        }
    }
    // Budget gates (after baseline check)
    if (args.maxCostUsd != null && costUsd != null && costUsd > args.maxCostUsd) {
        return {
            exitCode: constants_1.EXIT.SCORE_BELOW,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.COST_BUDGET_EXCEEDED,
            reasonMessage: `cost $${costUsd.toFixed(4)} exceeds maxCostUsd $${args.maxCostUsd.toFixed(4)}`,
        };
    }
    if (args.maxLatencyMs != null && avgLatencyMs != null && avgLatencyMs > args.maxLatencyMs) {
        return {
            exitCode: constants_1.EXIT.SCORE_BELOW,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.LATENCY_BUDGET_EXCEEDED,
            reasonMessage: `avg latency ${avgLatencyMs}ms exceeds maxLatencyMs ${args.maxLatencyMs}`,
        };
    }
    if (args.maxCostDeltaUsd != null &&
        costUsd != null &&
        baselineCostUsd != null &&
        costUsd - baselineCostUsd > args.maxCostDeltaUsd) {
        return {
            exitCode: constants_1.EXIT.SCORE_BELOW,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.COST_BUDGET_EXCEEDED,
            reasonMessage: `cost delta $${(costUsd - baselineCostUsd).toFixed(4)} exceeds maxCostDeltaUsd $${args.maxCostDeltaUsd.toFixed(4)}`,
        };
    }
    // minN gate
    if (args.minN !== undefined && total !== null && total < args.minN) {
        return {
            exitCode: constants_1.EXIT.LOW_N,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.LOW_SAMPLE_SIZE,
            reasonMessage: `total test cases (${total}) < minN (${args.minN})`,
        };
    }
    // allowWeakEvidence gate
    if (!args.allowWeakEvidence && evidenceLevel === "weak") {
        return {
            exitCode: constants_1.EXIT.WEAK_EVIDENCE,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.LOW_SAMPLE_SIZE,
            reasonMessage: "evidence level is 'weak' (use --allowWeakEvidence to permit)",
        };
    }
    // Compute gate result
    if (args.minScore > 0 && score < args.minScore) {
        return {
            exitCode: constants_1.EXIT.SCORE_BELOW,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.SCORE_TOO_LOW,
            reasonMessage: `score ${score} < minScore ${args.minScore}`,
        };
    }
    // warnDrop: soft warning band; maxDrop: hard fail
    if (args.maxDrop !== undefined && regressionDelta !== null && regressionDelta < -args.maxDrop) {
        return {
            exitCode: constants_1.EXIT.REGRESSION,
            passed: false,
            reasonCode: reason_codes_1.REASON_CODES.DELTA_TOO_HIGH,
            reasonMessage: `score dropped ${Math.abs(regressionDelta)} pts from baseline (max allowed: ${args.maxDrop})`,
        };
    }
    if (args.warnDrop !== undefined &&
        regressionDelta !== null &&
        regressionDelta < -args.warnDrop &&
        (args.maxDrop === undefined || regressionDelta >= -args.maxDrop)) {
        return {
            exitCode: constants_1.EXIT.WARN_REGRESSION,
            passed: true, // gate passes but with warning
            reasonCode: reason_codes_1.REASON_CODES.WARN_REGRESSION,
            reasonMessage: `score dropped ${Math.abs(regressionDelta)} pts from baseline (warn threshold: ${args.warnDrop}${args.maxDrop != null ? `, fail at ${args.maxDrop}` : ""})`,
        };
    }
    if (args.policy) {
        const pack = (0, policy_packs_1.resolvePolicyPack)(args.policy);
        if (!pack) {
            const valid = (0, policy_packs_1.getValidPolicyVersions)().join(", ");
            return {
                exitCode: constants_1.EXIT.BAD_ARGS,
                passed: false,
                reasonCode: reason_codes_1.REASON_CODES.UNKNOWN,
                reasonMessage: `Unknown policy or version: ${args.policy}. Valid: ${valid}`,
            };
        }
        const { requiredSafetyRate, maxFlags } = pack.thresholds;
        const safetyRate = breakdown?.safety ?? 0;
        if (safetyRate < requiredSafetyRate) {
            return {
                exitCode: constants_1.EXIT.POLICY_VIOLATION,
                passed: false,
                reasonCode: reason_codes_1.REASON_CODES.POLICY_FAILED,
                reasonMessage: `policy ${pack.policyId}@${pack.version}: safety ${Math.round(safetyRate * 100)}% < required ${Math.round(requiredSafetyRate * 100)}%`,
                policyEvidence: {
                    failedCheck: "safety_rate",
                    remediation: `Increase safety pass rate to at least ${Math.round(requiredSafetyRate * 100)}%. Review failing test cases for safety-related assertions.`,
                    snapshot: {
                        safety: safetyRate,
                        required: requiredSafetyRate,
                        policy: `${pack.policyId}@${pack.version}`,
                    },
                },
            };
        }
        const violations = policyFlags.filter((f) => maxFlags.includes(f));
        if (violations.length > 0) {
            return {
                exitCode: constants_1.EXIT.POLICY_VIOLATION,
                passed: false,
                reasonCode: reason_codes_1.REASON_CODES.POLICY_FAILED,
                reasonMessage: `policy ${pack.policyId}@${pack.version}: ${violations.join(", ")}`,
                policyEvidence: {
                    failedCheck: "flag_restrictions",
                    remediation: `Resolve flags: ${violations.join(", ")}. These indicate policy violations that must be addressed.`,
                    snapshot: { violations, policy: `${pack.policyId}@${pack.version}` },
                },
            };
        }
    }
    return {
        exitCode: constants_1.EXIT.PASS,
        passed: true,
        reasonCode: reason_codes_1.REASON_CODES.PASS,
        reasonMessage: null,
    };
}
