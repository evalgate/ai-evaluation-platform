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
exports.AUTO_HOLDOUT_SCHEMA_VERSION = void 0;
exports.parseAutoHoldoutConfig = parseAutoHoldoutConfig;
exports.selectAutoHoldoutSpecs = selectAutoHoldoutSpecs;
exports.createAutoHoldoutArtifact = createAutoHoldoutArtifact;
exports.assertValidAutoHoldoutArtifact = assertValidAutoHoldoutArtifact;
exports.writeAutoHoldoutArtifact = writeAutoHoldoutArtifact;
exports.readAutoHoldoutArtifact = readAutoHoldoutArtifact;
exports.loadOrCreateAutoHoldout = loadOrCreateAutoHoldout;
const crypto = __importStar(require("node:crypto"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const auto_ledger_1 = require("./auto-ledger");
exports.AUTO_HOLDOUT_SCHEMA_VERSION = 1;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function assertString(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${fieldName} must be a non-empty string`);
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
function stableRank(seed, specId) {
    return crypto
        .createHash("sha256")
        .update(`${seed}\0${specId}`, "utf8")
        .digest("hex");
}
function sortSpecsDeterministically(specs, seed) {
    return [...specs].sort((left, right) => {
        const leftRank = stableRank(seed, left.id);
        const rightRank = stableRank(seed, right.id);
        if (leftRank < rightRank)
            return -1;
        if (leftRank > rightRank)
            return 1;
        return left.id.localeCompare(right.id);
    });
}
function resolveStratum(spec) {
    if (spec.suitePath.length > 0 && spec.suitePath[0]?.trim()) {
        return spec.suitePath[0];
    }
    if (spec.tags.length > 0 && spec.tags[0]?.trim()) {
        return spec.tags[0];
    }
    const fileParts = spec.filePath.split("/");
    return fileParts.length > 1 ? fileParts[0] : "general";
}
function resolveHoldoutCount(totalCandidates, config) {
    if (totalCandidates <= 1) {
        return Math.max(0, totalCandidates);
    }
    if (config.count !== null) {
        return Math.min(totalCandidates - 1, Math.max(1, config.count));
    }
    const ratio = config.ratio ?? 0.2;
    const requested = Math.ceil(totalCandidates * ratio);
    return Math.min(totalCandidates - 1, Math.max(1, requested));
}
function allocateStratifiedCounts(groups, targetCount) {
    const allocations = new Map();
    const total = groups.reduce((sum, group) => sum + group.specs.length, 0);
    let assigned = 0;
    const remainders = [];
    for (const group of groups) {
        const raw = (group.specs.length / total) * targetCount;
        const base = Math.min(group.specs.length, Math.floor(raw));
        allocations.set(group.key, base);
        assigned += base;
        remainders.push({
            key: group.key,
            remainder: raw - base,
            capacity: group.specs.length,
        });
    }
    for (const group of groups) {
        if (assigned >= targetCount) {
            break;
        }
        const current = allocations.get(group.key) ?? 0;
        if (current === 0 && group.specs.length > 0) {
            allocations.set(group.key, 1);
            assigned += 1;
        }
    }
    const rankedRemainders = remainders.sort((left, right) => {
        if (right.remainder !== left.remainder) {
            return right.remainder - left.remainder;
        }
        return left.key.localeCompare(right.key);
    });
    while (assigned < targetCount) {
        let progressed = false;
        for (const group of rankedRemainders) {
            if (assigned >= targetCount) {
                break;
            }
            const current = allocations.get(group.key) ?? 0;
            if (current < group.capacity) {
                allocations.set(group.key, current + 1);
                assigned += 1;
                progressed = true;
            }
        }
        if (!progressed) {
            break;
        }
    }
    for (const group of groups) {
        const current = allocations.get(group.key) ?? 0;
        allocations.set(group.key, Math.min(current, group.specs.length));
    }
    return allocations;
}
function parseAutoHoldoutConfig(value) {
    if (!isRecord(value)) {
        throw new Error("holdout config must be an object");
    }
    const selectionValue = value.selection;
    const selection = selectionValue === undefined
        ? "deterministic"
        : selectionValue === "deterministic" || selectionValue === "stratified"
            ? selectionValue
            : (() => {
                throw new Error("holdout.selection must be 'deterministic' or 'stratified'");
            })();
    const lockedAfterValue = value.locked_after;
    let lockedAfter = null;
    if (lockedAfterValue !== undefined && lockedAfterValue !== null) {
        if (!isFiniteNumber(lockedAfterValue) ||
            !Number.isInteger(lockedAfterValue) ||
            lockedAfterValue < 1) {
            throw new Error("holdout.locked_after must be a positive integer when provided");
        }
        lockedAfter = lockedAfterValue;
    }
    const countValue = value.count;
    let count = null;
    if (countValue !== undefined && countValue !== null) {
        if (!isFiniteNumber(countValue) ||
            !Number.isInteger(countValue) ||
            countValue < 1) {
            throw new Error("holdout.count must be a positive integer when provided");
        }
        count = countValue;
    }
    const ratioValue = value.ratio;
    let ratio = null;
    if (ratioValue !== undefined && ratioValue !== null) {
        if (!isFiniteNumber(ratioValue) || ratioValue <= 0 || ratioValue >= 1) {
            throw new Error("holdout.ratio must be a number between 0 and 1 when provided");
        }
        ratio = ratioValue;
    }
    const seedValue = value.seed;
    const seed = seedValue === undefined || seedValue === null
        ? "evalgate-auto-holdout-v1"
        : (() => {
            assertString(seedValue, "holdout.seed");
            return seedValue;
        })();
    const excludedSpecIdsValue = value.excluded_spec_ids;
    const excludedSpecIds = excludedSpecIdsValue === undefined || excludedSpecIdsValue === null
        ? []
        : (() => {
            assertStringArray(excludedSpecIdsValue, "holdout.excluded_spec_ids");
            return [...new Set(excludedSpecIdsValue)].sort((left, right) => left.localeCompare(right));
        })();
    return {
        selection,
        lockedAfter,
        count,
        ratio,
        seed,
        excludedSpecIds,
    };
}
function selectAutoHoldoutSpecs(manifest, config) {
    const excludedIds = new Set(config.excludedSpecIds);
    const candidates = manifest.specs.filter((spec) => !excludedIds.has(spec.id));
    const targetCount = resolveHoldoutCount(candidates.length, config);
    if (targetCount === 0) {
        return {
            selectionRequested: config.selection,
            selectionUsed: "deterministic",
            specIds: [],
            strata: {},
            candidateSpecIds: candidates
                .map((spec) => spec.id)
                .sort((left, right) => left.localeCompare(right)),
        };
    }
    const grouped = new Map();
    for (const spec of candidates) {
        const key = resolveStratum(spec);
        const group = grouped.get(key);
        if (group) {
            group.push(spec);
        }
        else {
            grouped.set(key, [spec]);
        }
    }
    const groups = [...grouped.entries()]
        .map(([key, specs]) => ({
        key,
        specs: sortSpecsDeterministically(specs, config.seed),
    }))
        .sort((left, right) => left.key.localeCompare(right.key));
    const canStratify = config.selection === "stratified" && groups.length > 1;
    if (!canStratify) {
        const selected = sortSpecsDeterministically(candidates, config.seed).slice(0, targetCount);
        return {
            selectionRequested: config.selection,
            selectionUsed: "deterministic",
            specIds: selected.map((spec) => spec.id),
            strata: {},
            candidateSpecIds: candidates
                .map((spec) => spec.id)
                .sort((left, right) => left.localeCompare(right)),
        };
    }
    const allocations = allocateStratifiedCounts(groups, targetCount);
    const selectedSpecs = [];
    const strata = {};
    for (const group of groups) {
        const allocation = allocations.get(group.key) ?? 0;
        if (allocation <= 0) {
            continue;
        }
        strata[group.key] = allocation;
        selectedSpecs.push(...group.specs.slice(0, allocation));
    }
    const selected = sortSpecsDeterministically(selectedSpecs, config.seed).slice(0, targetCount);
    return {
        selectionRequested: config.selection,
        selectionUsed: "stratified",
        specIds: selected.map((spec) => spec.id),
        strata,
        candidateSpecIds: candidates
            .map((spec) => spec.id)
            .sort((left, right) => left.localeCompare(right)),
    };
}
function createAutoHoldoutArtifact(manifest, config) {
    const selection = selectAutoHoldoutSpecs(manifest, config);
    return {
        schemaVersion: exports.AUTO_HOLDOUT_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        selectionRequested: selection.selectionRequested,
        selectionUsed: selection.selectionUsed,
        lockedAfter: config.lockedAfter,
        seed: config.seed,
        manifestGeneratedAt: manifest.generatedAt ?? null,
        manifestSpecCount: manifest.specs.length,
        excludedSpecIds: [...config.excludedSpecIds],
        specIds: selection.specIds,
        strata: selection.strata,
    };
}
function assertValidAutoHoldoutArtifact(value, fieldName = "holdout") {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    if (value.schemaVersion !== exports.AUTO_HOLDOUT_SCHEMA_VERSION) {
        throw new Error(`${fieldName}.schemaVersion must equal ${exports.AUTO_HOLDOUT_SCHEMA_VERSION}`);
    }
    assertString(value.createdAt, `${fieldName}.createdAt`);
    if (value.selectionRequested !== "deterministic" &&
        value.selectionRequested !== "stratified") {
        throw new Error(`${fieldName}.selectionRequested must be 'deterministic' or 'stratified'`);
    }
    if (value.selectionUsed !== "deterministic" &&
        value.selectionUsed !== "stratified") {
        throw new Error(`${fieldName}.selectionUsed must be 'deterministic' or 'stratified'`);
    }
    if (value.lockedAfter !== null && value.lockedAfter !== undefined) {
        if (!isFiniteNumber(value.lockedAfter) ||
            !Number.isInteger(value.lockedAfter) ||
            value.lockedAfter < 1) {
            throw new Error(`${fieldName}.lockedAfter must be a positive integer or null`);
        }
    }
    assertString(value.seed, `${fieldName}.seed`);
    if (value.manifestGeneratedAt !== null &&
        value.manifestGeneratedAt !== undefined &&
        !isFiniteNumber(value.manifestGeneratedAt)) {
        throw new Error(`${fieldName}.manifestGeneratedAt must be a number or null`);
    }
    if (!isFiniteNumber(value.manifestSpecCount) || value.manifestSpecCount < 0) {
        throw new Error(`${fieldName}.manifestSpecCount must be a non-negative number`);
    }
    assertStringArray(value.excludedSpecIds, `${fieldName}.excludedSpecIds`);
    assertStringArray(value.specIds, `${fieldName}.specIds`);
    if (!isRecord(value.strata)) {
        throw new Error(`${fieldName}.strata must be an object`);
    }
    for (const [key, count] of Object.entries(value.strata)) {
        assertString(key, `${fieldName}.strata key`);
        if (!isFiniteNumber(count) || count < 0) {
            throw new Error(`${fieldName}.strata.${key} must be a non-negative number`);
        }
    }
}
function writeAutoHoldoutArtifact(artifact, holdoutPath = (0, auto_ledger_1.resolveAutoWorkspacePaths)().holdoutPath) {
    assertValidAutoHoldoutArtifact(artifact);
    fs.mkdirSync(path.dirname(holdoutPath), { recursive: true });
    fs.writeFileSync(holdoutPath, JSON.stringify(artifact, null, 2), "utf8");
}
function readAutoHoldoutArtifact(holdoutPath = (0, auto_ledger_1.resolveAutoWorkspacePaths)().holdoutPath) {
    if (!fs.existsSync(holdoutPath)) {
        return null;
    }
    const parsed = JSON.parse(fs.readFileSync(holdoutPath, "utf8"));
    assertValidAutoHoldoutArtifact(parsed);
    return parsed;
}
function loadOrCreateAutoHoldout(manifest, config, holdoutPath = (0, auto_ledger_1.resolveAutoWorkspacePaths)().holdoutPath) {
    const existing = readAutoHoldoutArtifact(holdoutPath);
    if (existing) {
        return existing;
    }
    const created = createAutoHoldoutArtifact(manifest, config);
    writeAutoHoldoutArtifact(created, holdoutPath);
    return created;
}
