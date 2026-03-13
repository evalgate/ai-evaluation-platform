"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePassRateBasis = resolvePassRateBasis;
exports.resolvePassRateBasisFromRuns = resolvePassRateBasisFromRuns;
exports.computeObjectiveReductionRatio = computeObjectiveReductionRatio;
exports.buildUtilityInput = buildUtilityInput;
exports.computeUtility = computeUtility;
exports.evaluateHardVetoes = evaluateHardVetoes;
exports.decideAutoUtilityOutcome = decideAutoUtilityOutcome;
const AUTO_UTILITY_METRICS = [
    "objectiveReductionRatio",
    "regressions",
    "improvements",
    "holdoutRegressions",
    "passRateDeltaRatio",
    "correctedPassRateDeltaRatio",
    "latencyDeltaRatio",
    "costDeltaRatio",
];
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function assertFiniteNumber(value, fieldName) {
    if (!isFiniteNumber(value)) {
        throw new Error(`${fieldName} must be a finite number`);
    }
}
function resolvePassRateBasis(baselineSummary, candidateSummary) {
    assertFiniteNumber(baselineSummary.passRate, "baselineSummary.passRate");
    assertFiniteNumber(candidateSummary.passRate, "candidateSummary.passRate");
    const canUseCorrected = isFiniteNumber(baselineSummary.correctedPassRate) &&
        isFiniteNumber(candidateSummary.correctedPassRate);
    const passRateBasis = canUseCorrected
        ? "corrected"
        : "raw";
    const baselinePassRate = canUseCorrected
        ? baselineSummary.correctedPassRate
        : baselineSummary.passRate;
    const candidatePassRate = canUseCorrected
        ? candidateSummary.correctedPassRate
        : candidateSummary.passRate;
    return {
        passRateBasis,
        baselinePassRate,
        candidatePassRate,
        deltaRatio: candidatePassRate - baselinePassRate,
    };
}
function resolvePassRateBasisFromRuns(baselineRun, candidateRun) {
    return resolvePassRateBasis(baselineRun.summary, candidateRun.summary);
}
function computeObjectiveReductionRatio(baselineObjectiveRate, candidateObjectiveRate) {
    assertFiniteNumber(baselineObjectiveRate, "baselineObjectiveRate");
    assertFiniteNumber(candidateObjectiveRate, "candidateObjectiveRate");
    if (baselineObjectiveRate < 0) {
        throw new Error("baselineObjectiveRate must be greater than or equal to 0");
    }
    if (candidateObjectiveRate < 0) {
        throw new Error("candidateObjectiveRate must be greater than or equal to 0");
    }
    if (baselineObjectiveRate === 0) {
        return candidateObjectiveRate === 0 ? 0 : -candidateObjectiveRate;
    }
    return ((baselineObjectiveRate - candidateObjectiveRate) / baselineObjectiveRate);
}
function buildUtilityInput(options) {
    const objectiveReductionRatio = computeObjectiveReductionRatio(options.baselineObjectiveRate, options.candidateObjectiveRate);
    const input = {
        objectiveReductionRatio,
        regressions: options.regressions,
        improvements: options.improvements,
        holdoutRegressions: options.holdoutRegressions,
        passRateDeltaRatio: options.passRateDeltaRatio,
        correctedPassRateDeltaRatio: options.correctedPassRateDeltaRatio,
        latencyDeltaRatio: options.latencyDeltaRatio,
        costDeltaRatio: options.costDeltaRatio,
    };
    for (const metric of AUTO_UTILITY_METRICS) {
        assertFiniteNumber(input[metric], `utilityInput.${metric}`);
    }
    return input;
}
function computeUtility(input, weights) {
    const contributions = AUTO_UTILITY_METRICS.map((metric) => {
        const value = input[metric];
        const weight = weights[metric];
        assertFiniteNumber(value, `utilityInput.${metric}`);
        assertFiniteNumber(weight, `utilityWeights.${metric}`);
        return {
            metric,
            value,
            weight,
            contribution: value * weight,
        };
    });
    return {
        score: contributions.reduce((total, contribution) => total + contribution.contribution, 0),
        contributions,
    };
}
function evaluateHardVetoes(input, config = {}) {
    assertFiniteNumber(input.holdoutRegressions, "hardVetoInput.holdoutRegressions");
    assertFiniteNumber(input.criticalFailureModeIncrease, "hardVetoInput.criticalFailureModeIncrease");
    assertFiniteNumber(input.latencyDeltaRatio, "hardVetoInput.latencyDeltaRatio");
    assertFiniteNumber(input.costUsd, "hardVetoInput.costUsd");
    const evaluatedRules = [
        "holdout_regressions",
        "critical_failure_mode_increase",
        "latency_ceiling",
        "cost_ceiling",
    ];
    const maxHoldoutRegressions = config.maxHoldoutRegressions ?? 0;
    if (input.holdoutRegressions > maxHoldoutRegressions) {
        return {
            vetoed: true,
            reason: "holdout_regressions",
            evaluatedRules,
            matchedRule: "holdout_regressions",
        };
    }
    const maxCriticalFailureModeIncrease = config.maxCriticalFailureModeIncrease ?? 0;
    if (input.criticalFailureModeIncrease > maxCriticalFailureModeIncrease) {
        return {
            vetoed: true,
            reason: "critical_failure_mode_increase",
            evaluatedRules,
            matchedRule: "critical_failure_mode_increase",
        };
    }
    if (config.latencyCeiling !== undefined &&
        input.latencyDeltaRatio > config.latencyCeiling) {
        return {
            vetoed: true,
            reason: "latency_ceiling",
            evaluatedRules,
            matchedRule: "latency_ceiling",
        };
    }
    if (config.costCeiling !== undefined && input.costUsd > config.costCeiling) {
        return {
            vetoed: true,
            reason: "cost_ceiling",
            evaluatedRules,
            matchedRule: "cost_ceiling",
        };
    }
    return {
        vetoed: false,
        reason: null,
        evaluatedRules,
        matchedRule: null,
    };
}
function decideAutoUtilityOutcome(input, config = {}) {
    const keepThreshold = config.keepThreshold ?? 0;
    const discardThreshold = config.discardThreshold ?? 0;
    const rationale = [];
    if (input.veto.vetoed) {
        rationale.push(`Hard veto matched: ${input.veto.reason}.`);
        return {
            decision: "vetoed",
            rationale,
        };
    }
    if (input.utilityScore === null) {
        rationale.push("Utility score is unavailable, so the result requires human review.");
        return {
            decision: "investigate",
            rationale,
        };
    }
    assertFiniteNumber(input.utilityScore, "utilityScore");
    assertFiniteNumber(input.objectiveReductionRatio, "objectiveReductionRatio");
    assertFiniteNumber(input.regressions, "regressions");
    assertFiniteNumber(input.improvements, "improvements");
    assertFiniteNumber(input.holdoutRegressions, "holdoutRegressions");
    if (input.objectiveReductionRatio < 0) {
        rationale.push("The candidate moved the objective in the wrong direction.");
        return {
            decision: "discard",
            rationale,
        };
    }
    if (input.utilityScore >= keepThreshold &&
        input.regressions === 0 &&
        input.holdoutRegressions === 0 &&
        input.objectiveReductionRatio >= 0) {
        rationale.push("Utility is positive and no regressions were detected.");
        return {
            decision: "keep",
            rationale,
        };
    }
    if (input.utilityScore < discardThreshold ||
        (input.regressions > input.improvements && input.regressions > 0)) {
        rationale.push("Utility is not competitive or regressions outweigh improvements.");
        return {
            decision: "discard",
            rationale,
        };
    }
    rationale.push("The candidate is directionally interesting but still needs review.");
    return {
        decision: "investigate",
        rationale,
    };
}
