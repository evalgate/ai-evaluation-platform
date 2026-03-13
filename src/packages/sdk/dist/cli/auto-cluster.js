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
exports.AUTO_CLUSTER_SCHEMA_VERSION = void 0;
exports.buildAutoClusterId = buildAutoClusterId;
exports.resolveAutoClusterPath = resolveAutoClusterPath;
exports.resolveAutoClusterRelativePath = resolveAutoClusterRelativePath;
exports.assertValidClusterMemory = assertValidClusterMemory;
exports.writeClusterMemory = writeClusterMemory;
exports.readClusterMemory = readClusterMemory;
exports.readClusterMemoryById = readClusterMemoryById;
exports.updateClusterMemoryForIteration = updateClusterMemoryForIteration;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const auto_families_1 = require("./auto-families");
const auto_ledger_1 = require("./auto-ledger");
exports.AUTO_CLUSTER_SCHEMA_VERSION = "1";
const DEFAULT_DOMINANT_PATTERN_LIMIT = 5;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
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
function assertStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array of strings`);
    }
    for (const item of value) {
        assertString(item, fieldName);
    }
}
function assertNumber(value, fieldName) {
    if (!isFiniteNumber(value)) {
        throw new Error(`${fieldName} must be a finite number`);
    }
}
function assertNullableObject(value, fieldName) {
    if (value !== null && !isRecord(value)) {
        throw new Error(`${fieldName} must be an object or null`);
    }
}
function ensureDirectoryForFile(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}
function isIsoTimestamp(value) {
    return !Number.isNaN(Date.parse(value));
}
function normalizePatterns(patterns) {
    const deduped = new Set();
    for (const pattern of patterns) {
        const trimmed = pattern.trim();
        if (trimmed.length > 0) {
            deduped.add(trimmed);
        }
        if (deduped.size >= DEFAULT_DOMINANT_PATTERN_LIMIT) {
            break;
        }
    }
    return [...deduped];
}
function slugify(value) {
    return (value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "cluster");
}
function makeDefaultClusterMemory(clusterId, entry) {
    return {
        schemaVersion: exports.AUTO_CLUSTER_SCHEMA_VERSION,
        clusterId,
        targetFailureMode: entry.targetFailureMode,
        firstSeenAt: entry.timestamp,
        lastUpdatedAt: entry.timestamp,
        traceCount: 0,
        dominantPatterns: [],
        bestIntervention: null,
        failedInterventions: [],
        suggestedNextFamily: null,
        resolvedAt: null,
    };
}
function computeSuggestedNextFamily(allowedFamilies, familyPriors, failedInterventions) {
    const failedFamilies = new Set(failedInterventions.map((item) => item.mutationFamily));
    const remainingFamilies = (0, auto_families_1.rankMutationFamilies)(allowedFamilies.filter((family) => !failedFamilies.has(family)), familyPriors);
    if (remainingFamilies.length > 0) {
        return remainingFamilies[0] ?? null;
    }
    return null;
}
function buildAutoClusterId(targetFailureMode) {
    assertString(targetFailureMode, "targetFailureMode");
    return `cluster-${slugify(targetFailureMode)}`;
}
function resolveAutoClusterPath(clusterId, projectRoot = process.cwd()) {
    assertString(clusterId, "clusterId");
    return path.join((0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot).autoDir, "clusters", `${clusterId}.json`);
}
function resolveAutoClusterRelativePath(clusterId, projectRoot = process.cwd()) {
    return path.relative(projectRoot, resolveAutoClusterPath(clusterId, projectRoot));
}
function assertValidClusterMemory(value, fieldName = "cluster") {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    assertString(value.schemaVersion, `${fieldName}.schemaVersion`);
    if (value.schemaVersion !== exports.AUTO_CLUSTER_SCHEMA_VERSION) {
        throw new Error(`${fieldName}.schemaVersion must equal ${exports.AUTO_CLUSTER_SCHEMA_VERSION}`);
    }
    assertString(value.clusterId, `${fieldName}.clusterId`);
    assertString(value.targetFailureMode, `${fieldName}.targetFailureMode`);
    assertString(value.firstSeenAt, `${fieldName}.firstSeenAt`);
    if (!isIsoTimestamp(value.firstSeenAt)) {
        throw new Error(`${fieldName}.firstSeenAt must be a valid ISO timestamp`);
    }
    assertString(value.lastUpdatedAt, `${fieldName}.lastUpdatedAt`);
    if (!isIsoTimestamp(value.lastUpdatedAt)) {
        throw new Error(`${fieldName}.lastUpdatedAt must be a valid ISO timestamp`);
    }
    assertNumber(value.traceCount, `${fieldName}.traceCount`);
    assertStringArray(value.dominantPatterns, `${fieldName}.dominantPatterns`);
    assertNullableObject(value.bestIntervention, `${fieldName}.bestIntervention`);
    if (value.bestIntervention) {
        assertString(value.bestIntervention.experimentId, `${fieldName}.bestIntervention.experimentId`);
        assertString(value.bestIntervention.mutationFamily, `${fieldName}.bestIntervention.mutationFamily`);
        assertNumber(value.bestIntervention.utilityScore, `${fieldName}.bestIntervention.utilityScore`);
        assertNumber(value.bestIntervention.objectiveReduction, `${fieldName}.bestIntervention.objectiveReduction`);
    }
    if (!Array.isArray(value.failedInterventions)) {
        throw new Error(`${fieldName}.failedInterventions must be an array`);
    }
    for (const [index, item] of value.failedInterventions.entries()) {
        if (!isRecord(item)) {
            throw new Error(`${fieldName}.failedInterventions[${index}] must be an object`);
        }
        assertString(item.experimentId, `${fieldName}.failedInterventions[${index}].experimentId`);
        assertString(item.mutationFamily, `${fieldName}.failedInterventions[${index}].mutationFamily`);
        if (item.reason !== "vetoed" && item.reason !== "discarded") {
            throw new Error(`${fieldName}.failedInterventions[${index}].reason must be vetoed or discarded`);
        }
        assertNullableString(item.hardVetoReason, `${fieldName}.failedInterventions[${index}].hardVetoReason`);
    }
    assertNullableString(value.suggestedNextFamily, `${fieldName}.suggestedNextFamily`);
    assertNullableString(value.resolvedAt, `${fieldName}.resolvedAt`);
    if (value.resolvedAt !== null && !isIsoTimestamp(value.resolvedAt)) {
        throw new Error(`${fieldName}.resolvedAt must be a valid ISO timestamp`);
    }
}
function writeClusterMemory(cluster, clusterPath = resolveAutoClusterPath(cluster.clusterId)) {
    assertValidClusterMemory(cluster);
    ensureDirectoryForFile(clusterPath);
    fs.writeFileSync(clusterPath, JSON.stringify(cluster, null, 2), "utf8");
}
function readClusterMemory(clusterPath) {
    const parsed = JSON.parse(fs.readFileSync(clusterPath, "utf8"));
    assertValidClusterMemory(parsed);
    return parsed;
}
function readClusterMemoryById(clusterId, projectRoot = process.cwd()) {
    const clusterPath = resolveAutoClusterPath(clusterId, projectRoot);
    if (!fs.existsSync(clusterPath)) {
        return null;
    }
    return readClusterMemory(clusterPath);
}
function updateClusterMemoryForIteration(input) {
    assertStringArray(input.allowedFamilies, "allowedFamilies");
    const clusterId = input.clusterId ?? buildAutoClusterId(input.entry.targetFailureMode);
    const existing = readClusterMemoryById(clusterId, input.projectRoot);
    const cluster = existing ?? makeDefaultClusterMemory(clusterId, input.entry);
    const timestamp = input.entry.timestamp;
    cluster.traceCount += 1;
    cluster.lastUpdatedAt = timestamp;
    cluster.dominantPatterns = normalizePatterns([
        ...(input.observedPatterns ?? []),
        ...cluster.dominantPatterns,
    ]);
    if (input.entry.decision === "keep") {
        const candidateUtility = input.entry.utilityScore ?? 0;
        if (cluster.bestIntervention === null ||
            candidateUtility > cluster.bestIntervention.utilityScore) {
            cluster.bestIntervention = {
                experimentId: input.entry.experimentId,
                mutationFamily: input.entry.mutationFamily,
                utilityScore: candidateUtility,
                objectiveReduction: input.entry.objectiveReductionRatio,
            };
        }
    }
    if (input.entry.decision === "discard" || input.entry.decision === "vetoed") {
        const reason = input.entry.decision === "vetoed" ? "vetoed" : "discarded";
        const alreadyRecorded = cluster.failedInterventions.some((item) => item.experimentId === input.entry.experimentId);
        if (!alreadyRecorded) {
            cluster.failedInterventions.push({
                experimentId: input.entry.experimentId,
                mutationFamily: input.entry.mutationFamily,
                reason,
                hardVetoReason: input.entry.hardVetoReason,
            });
        }
    }
    if (typeof input.resolvedThreshold === "number" &&
        Number.isFinite(input.resolvedThreshold) &&
        input.entry.candidateObjectiveRate <= input.resolvedThreshold) {
        cluster.resolvedAt = cluster.resolvedAt ?? timestamp;
    }
    cluster.suggestedNextFamily = computeSuggestedNextFamily(input.allowedFamilies, input.familyPriors.filter((prior) => prior.failureMode === input.entry.targetFailureMode), cluster.failedInterventions);
    writeClusterMemory(cluster, resolveAutoClusterPath(clusterId, input.projectRoot));
    return cluster;
}
