"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAutoHistoryEntries = filterAutoHistoryEntries;
exports.sortAutoHistoryEntries = sortAutoHistoryEntries;
exports.buildAutoHistoryRows = buildAutoHistoryRows;
exports.summarizeAutoHistory = summarizeAutoHistory;
exports.readAutoHistory = readAutoHistory;
exports.inspectAutoExperiment = inspectAutoExperiment;
exports.formatAutoHistory = formatAutoHistory;
exports.formatAutoExperimentInspect = formatAutoExperimentInspect;
const path = __importStar(require("node:path"));
const auto_ledger_1 = require("./auto-ledger");
const auto_program_1 = require("./auto-program");
function compareNullableNumber(left, right, direction) {
    if (left === null && right === null) {
        return 0;
    }
    if (left === null) {
        return 1;
    }
    if (right === null) {
        return -1;
    }
    return direction === "asc" ? left - right : right - left;
}
function compareNumber(left, right, direction) {
    return direction === "asc" ? left - right : right - left;
}
function compareString(left, right, direction) {
    return direction === "asc"
        ? left.localeCompare(right)
        : right.localeCompare(left);
}
function formatRatioAsPercent(ratio) {
    return `${(ratio * 100).toFixed(1)}%`;
}
function formatWholeFriendlyPercent(ratio) {
    const percent = ratio * 100;
    return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}
function formatSignedRatioAsPercent(ratio) {
    const normalized = Object.is(ratio, -0) || Math.abs(ratio) < 0.0000001 ? 0 : ratio;
    const sign = normalized > 0 ? "+" : "";
    return `${sign}${(normalized * 100).toFixed(1)}%`;
}
function formatNullableScore(value) {
    if (value === null) {
        return "n/a";
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
function formatUsd(value) {
    return `$${value.toFixed(2)}`;
}
function formatDecisionLabel(decision) {
    if (decision === "keep") {
        return "kept";
    }
    if (decision === "discard") {
        return "discarded";
    }
    return decision;
}
function formatRegressionLabel(entry) {
    if (entry.holdoutRegressions > 0 && entry.regressions === 0) {
        return `${entry.holdoutRegressions} (holdout)`;
    }
    if (entry.holdoutRegressions > 0) {
        return `${entry.regressions + entry.holdoutRegressions} (${entry.holdoutRegressions} holdout)`;
    }
    return String(entry.regressions);
}
function padCell(value, width) {
    return value.length >= width ? value : value.padEnd(width, " ");
}
function getTargetLabel(entries) {
    const targets = new Set(entries.map((entry) => entry.targetFailureMode));
    if (targets.size === 1) {
        return entries[0]?.targetFailureMode ?? "unknown";
    }
    return "multiple";
}
function shouldCountFamilyAttempt(decision) {
    return decision === "keep" || decision === "discard" || decision === "vetoed";
}
function buildFamilyWinRates(entries) {
    const familyCounts = new Map();
    for (const entry of entries) {
        const current = familyCounts.get(entry.mutationFamily) ?? {
            wins: 0,
            attempts: 0,
        };
        if (entry.decision === "keep") {
            current.wins += 1;
        }
        if (shouldCountFamilyAttempt(entry.decision)) {
            current.attempts += 1;
        }
        familyCounts.set(entry.mutationFamily, current);
    }
    return [...familyCounts.entries()]
        .map(([mutationFamily, counts]) => ({
        mutationFamily,
        wins: counts.wins,
        attempts: counts.attempts,
        winRate: counts.attempts === 0 ? null : counts.wins / counts.attempts,
    }))
        .sort((left, right) => {
        if (right.attempts !== left.attempts) {
            return right.attempts - left.attempts;
        }
        if (right.wins !== left.wins) {
            return right.wins - left.wins;
        }
        return left.mutationFamily.localeCompare(right.mutationFamily);
    });
}
function buildVetoReasonCounts(entries) {
    const counts = new Map();
    for (const entry of entries) {
        if (entry.decision !== "vetoed" || entry.hardVetoReason === null) {
            continue;
        }
        counts.set(entry.hardVetoReason, (counts.get(entry.hardVetoReason) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }
        return left.reason.localeCompare(right.reason);
    });
}
function selectBestExperiment(entries) {
    const preferredPool = entries.filter((entry) => entry.decision === "keep" && entry.utilityScore !== null);
    const fallbackPool = entries.filter((entry) => entry.utilityScore !== null);
    const candidates = preferredPool.length > 0 ? preferredPool : fallbackPool;
    let bestEntry = null;
    for (const entry of candidates) {
        if (bestEntry === null ||
            (entry.utilityScore ?? Number.NEGATIVE_INFINITY) >
                (bestEntry.utilityScore ?? Number.NEGATIVE_INFINITY) ||
            ((entry.utilityScore ?? Number.NEGATIVE_INFINITY) ===
                (bestEntry.utilityScore ?? Number.NEGATIVE_INFINITY) &&
                entry.timestamp > bestEntry.timestamp)) {
            bestEntry = entry;
        }
    }
    if (!bestEntry || bestEntry.utilityScore === null) {
        return null;
    }
    return {
        experimentId: bestEntry.experimentId,
        utilityScore: bestEntry.utilityScore,
        targetFailureMode: bestEntry.targetFailureMode,
        baselineObjectiveRate: bestEntry.baselineObjectiveRate,
        candidateObjectiveRate: bestEntry.candidateObjectiveRate,
        objectiveRateDelta: bestEntry.candidateObjectiveRate - bestEntry.baselineObjectiveRate,
    };
}
function readBudgetNumber(budget, keys) {
    for (const key of keys) {
        const value = budget[key];
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
    }
    return null;
}
function summarizeBudget(entries, projectRoot) {
    const usedCostUsd = entries.reduce((sum, entry) => sum + entry.costUsd, 0);
    const usedIterations = entries.filter((entry) => entry.decision !== "plan").length;
    let iterationLimit = null;
    let costLimitUsd = null;
    if (projectRoot) {
        const programPath = (0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot).programPath;
        const programResult = (0, auto_program_1.readAutoProgram)(programPath, {
            strictTopLevel: false,
        });
        if (programResult.program) {
            const budget = programResult.program.budget;
            const parsedIterationLimit = readBudgetNumber(budget, [
                "max_experiments",
                "max_iterations",
                "maxIterations",
            ]);
            if (parsedIterationLimit !== null &&
                Number.isInteger(parsedIterationLimit) &&
                parsedIterationLimit > 0) {
                iterationLimit = parsedIterationLimit;
            }
            const parsedCostLimitUsd = readBudgetNumber(budget, [
                "max_cost_usd",
                "maxCostUsd",
                "cost_usd",
                "costUsd",
                "max_usd",
            ]);
            if (parsedCostLimitUsd !== null && parsedCostLimitUsd >= 0) {
                costLimitUsd = parsedCostLimitUsd;
            }
        }
    }
    return {
        usedCostUsd,
        costLimitUsd,
        usedIterations,
        iterationLimit,
        remainingCostUsd: costLimitUsd === null ? null : Math.max(costLimitUsd - usedCostUsd, 0),
        remainingIterations: iterationLimit === null
            ? null
            : Math.max(iterationLimit - usedIterations, 0),
    };
}
function filterAutoHistoryEntries(entries, filter = {}) {
    const filtered = entries.filter((entry) => {
        if (filter.decision && entry.decision !== filter.decision) {
            return false;
        }
        if (filter.sessionId && entry.sessionId !== filter.sessionId) {
            return false;
        }
        if (filter.targetFailureMode &&
            entry.targetFailureMode !== filter.targetFailureMode) {
            return false;
        }
        if (filter.mutationFamily &&
            entry.mutationFamily !== filter.mutationFamily) {
            return false;
        }
        return true;
    });
    const limit = filter.limit;
    if (limit === undefined) {
        return filtered;
    }
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("history.limit must be a positive integer when provided");
    }
    return filtered.slice(0, limit);
}
function sortAutoHistoryEntries(entries, sort = {}) {
    const by = sort.by ?? "timestamp";
    const direction = sort.direction ?? "desc";
    return [...entries].sort((left, right) => {
        let comparison = 0;
        if (by === "timestamp") {
            comparison = compareString(left.timestamp, right.timestamp, direction);
        }
        else if (by === "utility") {
            comparison = compareNullableNumber(left.utilityScore, right.utilityScore, direction);
        }
        else if (by === "objectiveReductionRatio") {
            comparison = compareNumber(left.objectiveReductionRatio, right.objectiveReductionRatio, direction);
        }
        else if (by === "passRateDeltaRatio") {
            comparison = compareNumber(left.passRateDeltaRatio, right.passRateDeltaRatio, direction);
        }
        else {
            comparison = compareNumber(left.durationMs, right.durationMs, direction);
        }
        if (comparison !== 0) {
            return comparison;
        }
        return left.experimentId.localeCompare(right.experimentId);
    });
}
function buildAutoHistoryRows(entries) {
    return entries.map((entry) => ({
        experimentId: entry.experimentId,
        timestamp: entry.timestamp,
        sessionId: entry.sessionId,
        decision: entry.decision,
        targetFailureMode: entry.targetFailureMode,
        mutationFamily: entry.mutationFamily,
        utilityScore: entry.utilityScore,
        objectiveReductionRatio: entry.objectiveReductionRatio,
        passRateDeltaRatio: entry.passRateDeltaRatio,
        holdoutRegressions: entry.holdoutRegressions,
        regressions: entry.regressions,
        improvements: entry.improvements,
    }));
}
function summarizeAutoHistory(entries, options = {}) {
    const decisions = {
        plan: 0,
        keep: 0,
        discard: 0,
        vetoed: 0,
        investigate: 0,
    };
    let bestUtilityScore = null;
    for (const entry of entries) {
        decisions[entry.decision] += 1;
        if (entry.utilityScore !== null &&
            (bestUtilityScore === null || entry.utilityScore > bestUtilityScore)) {
            bestUtilityScore = entry.utilityScore;
        }
    }
    return {
        total: entries.length,
        decisions,
        bestUtilityScore,
        kept: decisions.keep,
        vetoed: decisions.vetoed,
        targetLabel: getTargetLabel(entries),
        bestExperiment: selectBestExperiment(entries),
        familyWinRates: buildFamilyWinRates(entries),
        vetoReasons: buildVetoReasonCounts(entries),
        budget: summarizeBudget(entries, options.projectRoot),
    };
}
function readAutoHistory(projectRoot = process.cwd(), filter = {}, sort = {}) {
    const paths = (0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot);
    const entries = (0, auto_ledger_1.readAutoLedgerEntries)(paths.ledgerPath);
    const sorted = sortAutoHistoryEntries(entries, sort);
    return filterAutoHistoryEntries(sorted, filter);
}
function inspectAutoExperiment(experimentId, projectRoot = process.cwd()) {
    if (typeof experimentId !== "string" || experimentId.trim().length === 0) {
        throw new Error("experimentId must be a non-empty string");
    }
    const paths = (0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot);
    const entries = (0, auto_ledger_1.readAutoLedgerEntries)(paths.ledgerPath);
    const entry = entries.find((candidate) => candidate.experimentId === experimentId);
    if (!entry) {
        throw new Error(`No auto experiment found for id '${experimentId}'`);
    }
    const absoluteDetailsPath = path.resolve(projectRoot, entry.detailsPath);
    let details = null;
    try {
        details = (0, auto_ledger_1.readAutoExperimentDetails)(absoluteDetailsPath);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("ENOENT")) {
            throw error;
        }
    }
    return {
        entry,
        details,
        absoluteDetailsPath,
    };
}
function formatAutoHistory(entries, options = {}) {
    if (entries.length === 0) {
        return "No auto experiments found.";
    }
    const summary = summarizeAutoHistory(entries, options);
    const lines = [`Experiment history — target: ${summary.targetLabel}`, ""];
    const rows = entries.map((entry) => ({
        id: entry.experimentId,
        family: entry.mutationFamily,
        utility: formatNullableScore(entry.utilityScore),
        decision: formatDecisionLabel(entry.decision),
        objectiveDelta: formatSignedRatioAsPercent(entry.candidateObjectiveRate - entry.baselineObjectiveRate),
        regressions: formatRegressionLabel(entry),
    }));
    const widths = {
        id: Math.max("ID".length, ...rows.map((row) => row.id.length)),
        family: Math.max("Family".length, ...rows.map((row) => row.family.length)),
        utility: Math.max("Utility".length, ...rows.map((row) => row.utility.length)),
        decision: Math.max("Decision".length, ...rows.map((row) => row.decision.length)),
        objectiveDelta: Math.max("Objective Δ".length, ...rows.map((row) => row.objectiveDelta.length)),
        regressions: Math.max("Regressions".length, ...rows.map((row) => row.regressions.length)),
    };
    lines.push(`  ${padCell("ID", widths.id)}  ${padCell("Family", widths.family)}  ${padCell("Utility", widths.utility)}  ${padCell("Decision", widths.decision)}  ${padCell("Objective Δ", widths.objectiveDelta)}  ${padCell("Regressions", widths.regressions)}`);
    for (const entry of entries) {
        const row = rows.find((candidate) => candidate.id === entry.experimentId);
        if (!row) {
            continue;
        }
        lines.push(`  ${padCell(row.id, widths.id)}  ${padCell(row.family, widths.family)}  ${padCell(row.utility, widths.utility)}  ${padCell(row.decision, widths.decision)}  ${padCell(row.objectiveDelta, widths.objectiveDelta)}  ${padCell(row.regressions, widths.regressions)}`);
    }
    if (summary.bestExperiment) {
        lines.push("");
        lines.push(`  Best so far: ${summary.bestExperiment.experimentId} (utility: ${formatNullableScore(summary.bestExperiment.utilityScore)}, ${summary.bestExperiment.targetFailureMode}: ${formatRatioAsPercent(summary.bestExperiment.baselineObjectiveRate)} → ${formatRatioAsPercent(summary.bestExperiment.candidateObjectiveRate)})`);
    }
    const usedBudgetParts = [];
    if (summary.budget.costLimitUsd !== null) {
        usedBudgetParts.push(`${formatUsd(summary.budget.usedCostUsd)} / ${formatUsd(summary.budget.costLimitUsd)}`);
    }
    else if (summary.budget.usedCostUsd > 0) {
        usedBudgetParts.push(formatUsd(summary.budget.usedCostUsd));
    }
    if (summary.budget.iterationLimit !== null) {
        usedBudgetParts.push(`${summary.budget.usedIterations}/${summary.budget.iterationLimit} iterations`);
    }
    else if (summary.budget.usedIterations > 0) {
        usedBudgetParts.push(`${summary.budget.usedIterations} iteration${summary.budget.usedIterations === 1 ? "" : "s"}`);
    }
    if (usedBudgetParts.length > 0) {
        lines.push(`  Budget used: ${usedBudgetParts.join(" · ")}`);
    }
    const remainingBudgetParts = [];
    if (summary.budget.remainingIterations !== null) {
        remainingBudgetParts.push(`${summary.budget.remainingIterations} iteration${summary.budget.remainingIterations === 1 ? "" : "s"}`);
    }
    if (summary.budget.remainingCostUsd !== null) {
        remainingBudgetParts.push(formatUsd(summary.budget.remainingCostUsd));
    }
    if (remainingBudgetParts.length > 0) {
        lines.push(`  Remaining: ${remainingBudgetParts.join(" · ")}`);
    }
    lines.push("");
    lines.push("  Mutation family win rates:");
    for (const family of summary.familyWinRates) {
        lines.push(`    ${padCell(family.mutationFamily, 28)} ${String(family.wins).padStart(1, " ")}/${String(family.attempts).padEnd(1, " ")}  (${family.winRate === null ? "n/a" : formatWholeFriendlyPercent(family.winRate)})`);
    }
    if (summary.vetoReasons.length > 0) {
        lines.push("");
        lines.push("  Top veto reasons:");
        for (const vetoReason of summary.vetoReasons) {
            lines.push(`    ${padCell(vetoReason.reason, 28)} ×${vetoReason.count}`);
        }
    }
    return lines.join("\n");
}
function formatAutoExperimentInspect(result) {
    const lines = [
        `Experiment ${result.entry.experimentId}`,
        `Decision: ${result.entry.decision}`,
        `Utility: ${formatNullableScore(result.entry.utilityScore)}`,
        `Objective reduction: ${formatRatioAsPercent(result.entry.objectiveReductionRatio)}`,
        `Pass delta: ${formatRatioAsPercent(result.entry.passRateDeltaRatio)} (${result.entry.passRateBasis})`,
        `Mutation: ${result.entry.mutationFamily} → ${result.entry.mutationTarget}`,
        `Failure mode: ${result.entry.targetFailureMode}`,
        `Details: ${result.absoluteDetailsPath}`,
    ];
    if (result.entry.reflection) {
        lines.push(`Reflection: ${result.entry.reflection}`);
    }
    if (result.details) {
        lines.push(`Targeted flips: +${result.details.targetedSpecSummary.failToPassIds.length} / -${result.details.targetedSpecSummary.passToFailIds.length}`);
        lines.push(`Holdout flips: +${result.details.holdoutSpecSummary.failToPassIds.length} / -${result.details.holdoutSpecSummary.passToFailIds.length}`);
        if (result.details.veto.matchedRule) {
            lines.push(`Veto rule: ${result.details.veto.matchedRule}`);
        }
    }
    return lines.join("\n");
}
