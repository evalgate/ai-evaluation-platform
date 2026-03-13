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
exports.AUTO_LEDGER_SCHEMA_VERSION = void 0;
exports.resolveAutoWorkspacePaths = resolveAutoWorkspacePaths;
exports.resolveAutoDetailsPath = resolveAutoDetailsPath;
exports.resolveAutoDetailsRelativePath = resolveAutoDetailsRelativePath;
exports.createAutoLedgerEntry = createAutoLedgerEntry;
exports.assertValidAutoLedgerEntry = assertValidAutoLedgerEntry;
exports.appendAutoLedgerEntry = appendAutoLedgerEntry;
exports.readAutoLedgerEntries = readAutoLedgerEntries;
exports.assertValidAutoExperimentDetails = assertValidAutoExperimentDetails;
exports.writeAutoExperimentDetails = writeAutoExperimentDetails;
exports.readAutoExperimentDetails = readAutoExperimentDetails;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const workspace_1 = require("./workspace");
exports.AUTO_LEDGER_SCHEMA_VERSION = 1;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function isIsoTimestamp(value) {
    return !Number.isNaN(Date.parse(value));
}
function assertString(value, fieldName, allowEmpty = false) {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be a string`);
    }
    if (!allowEmpty && value.trim().length === 0) {
        throw new Error(`${fieldName} must be a non-empty string`);
    }
}
function assertNullableString(value, fieldName) {
    if (value !== null && typeof value !== "string") {
        throw new Error(`${fieldName} must be a string or null`);
    }
    if (typeof value === "string" && value.trim().length === 0) {
        throw new Error(`${fieldName} must not be an empty string`);
    }
}
function assertNumber(value, fieldName) {
    if (!isFiniteNumber(value)) {
        throw new Error(`${fieldName} must be a finite number`);
    }
}
function assertNullableNumber(value, fieldName) {
    if (value !== null && !isFiniteNumber(value)) {
        throw new Error(`${fieldName} must be a finite number or null`);
    }
}
function assertStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array of strings`);
    }
    for (const entry of value) {
        assertString(entry, fieldName);
    }
}
function assertDecision(value) {
    if (value !== "plan" &&
        value !== "keep" &&
        value !== "discard" &&
        value !== "vetoed" &&
        value !== "investigate") {
        throw new Error("decision must be one of plan, keep, discard, vetoed, investigate");
    }
}
function assertPassRateBasis(value) {
    if (value !== "raw" && value !== "corrected") {
        throw new Error("passRateBasis must be 'raw' or 'corrected'");
    }
}
function parseJsonlRows(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, index) => {
        try {
            return JSON.parse(line);
        }
        catch {
            throw new Error(`Invalid JSONL at line ${index + 1}: ${line}`);
        }
    });
}
function ensureDirectoryForFile(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}
function assertSpecSummary(value, fieldName) {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    assertStringArray(value.passToFailIds, `${fieldName}.passToFailIds`);
    assertStringArray(value.failToPassIds, `${fieldName}.failToPassIds`);
    assertStringArray(value.unchangedIds, `${fieldName}.unchangedIds`);
}
function resolveAutoWorkspacePaths(projectRoot = process.cwd()) {
    const workspace = (0, workspace_1.resolveEvalWorkspace)(projectRoot);
    const autoDir = path.join(workspace.evalDir, "auto");
    return {
        projectRoot,
        evalDir: workspace.evalDir,
        autoDir,
        ledgerPath: path.join(autoDir, "ledger.jsonl"),
        detailsDir: path.join(autoDir, "details"),
        holdoutPath: path.join(autoDir, "holdout.json"),
        latestPath: path.join(autoDir, "latest.json"),
        runsDir: path.join(autoDir, "runs"),
        programPath: path.join(autoDir, "program.md"),
    };
}
function resolveAutoDetailsPath(experimentId, projectRoot = process.cwd()) {
    assertString(experimentId, "experimentId");
    return path.join(resolveAutoWorkspacePaths(projectRoot).detailsDir, `${experimentId}.json`);
}
function resolveAutoDetailsRelativePath(experimentId, projectRoot = process.cwd()) {
    return path.relative(projectRoot, resolveAutoDetailsPath(experimentId, projectRoot));
}
function createAutoLedgerEntry(input) {
    return {
        schemaVersion: exports.AUTO_LEDGER_SCHEMA_VERSION,
        ...input,
    };
}
function assertValidAutoLedgerEntry(value, fieldName = "entry") {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    assertNumber(value.schemaVersion, `${fieldName}.schemaVersion`);
    if (value.schemaVersion !== exports.AUTO_LEDGER_SCHEMA_VERSION) {
        throw new Error(`${fieldName}.schemaVersion must equal ${exports.AUTO_LEDGER_SCHEMA_VERSION}`);
    }
    assertString(value.experimentId, `${fieldName}.experimentId`);
    assertString(value.sessionId, `${fieldName}.sessionId`);
    assertString(value.timestamp, `${fieldName}.timestamp`);
    if (!isIsoTimestamp(value.timestamp)) {
        throw new Error(`${fieldName}.timestamp must be a valid ISO timestamp`);
    }
    assertString(value.parentExperimentId, `${fieldName}.parentExperimentId`);
    assertString(value.baselineRef, `${fieldName}.baselineRef`);
    assertString(value.candidateRef, `${fieldName}.candidateRef`);
    assertString(value.targetFailureMode, `${fieldName}.targetFailureMode`);
    assertNullableString(value.targetClusterId, `${fieldName}.targetClusterId`);
    assertString(value.mutationTarget, `${fieldName}.mutationTarget`);
    assertString(value.mutationFamily, `${fieldName}.mutationFamily`);
    assertString(value.patchSummary, `${fieldName}.patchSummary`);
    assertString(value.patchHash, `${fieldName}.patchHash`);
    assertStringArray(value.targetedSpecs, `${fieldName}.targetedSpecs`);
    assertStringArray(value.holdoutSpecs, `${fieldName}.holdoutSpecs`);
    assertNullableNumber(value.utilityScore, `${fieldName}.utilityScore`);
    assertNumber(value.objectiveReductionRatio, `${fieldName}.objectiveReductionRatio`);
    assertNumber(value.baselineObjectiveRate, `${fieldName}.baselineObjectiveRate`);
    assertNumber(value.candidateObjectiveRate, `${fieldName}.candidateObjectiveRate`);
    assertNumber(value.regressions, `${fieldName}.regressions`);
    assertNumber(value.improvements, `${fieldName}.improvements`);
    assertNumber(value.holdoutRegressions, `${fieldName}.holdoutRegressions`);
    assertNumber(value.passRateDeltaRatio, `${fieldName}.passRateDeltaRatio`);
    assertNumber(value.correctedPassRateDeltaRatio, `${fieldName}.correctedPassRateDeltaRatio`);
    assertPassRateBasis(value.passRateBasis);
    assertNumber(value.latencyDeltaRatio, `${fieldName}.latencyDeltaRatio`);
    assertNumber(value.costDeltaRatio, `${fieldName}.costDeltaRatio`);
    assertDecision(value.decision);
    assertNullableString(value.hardVetoReason, `${fieldName}.hardVetoReason`);
    assertNumber(value.costUsd, `${fieldName}.costUsd`);
    assertNumber(value.durationMs, `${fieldName}.durationMs`);
    assertString(value.detailsPath, `${fieldName}.detailsPath`);
    assertNullableString(value.reflection, `${fieldName}.reflection`);
}
function appendAutoLedgerEntry(entry, ledgerPath = resolveAutoWorkspacePaths().ledgerPath) {
    assertValidAutoLedgerEntry(entry);
    ensureDirectoryForFile(ledgerPath);
    fs.appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`, "utf8");
}
function readAutoLedgerEntries(ledgerPath = resolveAutoWorkspacePaths().ledgerPath) {
    if (!fs.existsSync(ledgerPath)) {
        return [];
    }
    return parseJsonlRows(ledgerPath).map((row, index) => {
        assertValidAutoLedgerEntry(row, `ledger[${index}]`);
        return row;
    });
}
function assertValidAutoExperimentDetails(value, fieldName = "details") {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    assertString(value.experimentId, `${fieldName}.experimentId`);
    assertString(value.sessionId, `${fieldName}.sessionId`);
    assertString(value.baselineRef, `${fieldName}.baselineRef`);
    assertString(value.candidateRef, `${fieldName}.candidateRef`);
    if (!isRecord(value.mutation)) {
        throw new Error(`${fieldName}.mutation must be an object`);
    }
    assertString(value.mutation.target, `${fieldName}.mutation.target`);
    assertString(value.mutation.family, `${fieldName}.mutation.family`);
    assertString(value.mutation.summary, `${fieldName}.mutation.summary`);
    if (!isRecord(value.utility)) {
        throw new Error(`${fieldName}.utility must be an object`);
    }
    if (!isRecord(value.utility.inputMetrics)) {
        throw new Error(`${fieldName}.utility.inputMetrics must be an object`);
    }
    if (!isRecord(value.utility.weights)) {
        throw new Error(`${fieldName}.utility.weights must be an object`);
    }
    assertNullableNumber(value.utility.computedScore, `${fieldName}.utility.computedScore`);
    if (!isRecord(value.veto)) {
        throw new Error(`${fieldName}.veto must be an object`);
    }
    assertStringArray(value.veto.evaluatedRules, `${fieldName}.veto.evaluatedRules`);
    assertNullableString(value.veto.matchedRule, `${fieldName}.veto.matchedRule`);
    assertSpecSummary(value.targetedSpecSummary, `${fieldName}.targetedSpecSummary`);
    assertSpecSummary(value.holdoutSpecSummary, `${fieldName}.holdoutSpecSummary`);
    if (!isRecord(value.anomalies)) {
        throw new Error(`${fieldName}.anomalies must be an object`);
    }
    assertStringArray(value.anomalies.latencySpikes, `${fieldName}.anomalies.latencySpikes`);
    assertStringArray(value.anomalies.unexpectedFlips, `${fieldName}.anomalies.unexpectedFlips`);
    assertStringArray(value.anomalies.missingFailureModeMapping, `${fieldName}.anomalies.missingFailureModeMapping`);
    if (!isRecord(value.reportPaths)) {
        throw new Error(`${fieldName}.reportPaths must be an object`);
    }
    assertString(value.reportPaths.baseline, `${fieldName}.reportPaths.baseline`);
    assertString(value.reportPaths.candidate, `${fieldName}.reportPaths.candidate`);
    if (value.reportPaths.targeted !== undefined) {
        assertString(value.reportPaths.targeted, `${fieldName}.reportPaths.targeted`);
    }
    if (value.reportPaths.holdout !== undefined) {
        assertString(value.reportPaths.holdout, `${fieldName}.reportPaths.holdout`);
    }
    assertNullableString(value.reflection, `${fieldName}.reflection`);
}
function writeAutoExperimentDetails(details, detailsPath = resolveAutoDetailsPath(details.experimentId)) {
    assertValidAutoExperimentDetails(details);
    ensureDirectoryForFile(detailsPath);
    fs.writeFileSync(detailsPath, JSON.stringify(details, null, 2), "utf8");
}
function readAutoExperimentDetails(detailsPath) {
    const parsed = JSON.parse(fs.readFileSync(detailsPath, "utf8"));
    assertValidAutoExperimentDetails(parsed);
    return parsed;
}
