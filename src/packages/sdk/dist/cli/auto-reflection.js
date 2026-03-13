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
exports.AUTO_REFLECTION_SCHEMA_VERSION = void 0;
exports.resolveAutoReflectionPath = resolveAutoReflectionPath;
exports.resolveAutoReflectionRelativePath = resolveAutoReflectionRelativePath;
exports.assertValidAutoReflection = assertValidAutoReflection;
exports.writeAutoReflection = writeAutoReflection;
exports.readAutoReflection = readAutoReflection;
exports.generateAutoReflection = generateAutoReflection;
exports.generateAndWriteAutoReflection = generateAndWriteAutoReflection;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const auto_ledger_1 = require("./auto-ledger");
exports.AUTO_REFLECTION_SCHEMA_VERSION = "1";
const DEFAULT_REFLECTION_MAX_TOKENS = 500;
const DEFAULT_REFLECTION_TIMEOUT_MS = 30000;
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
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
function assertDecision(value) {
    if (value !== "plan" &&
        value !== "keep" &&
        value !== "discard" &&
        value !== "vetoed" &&
        value !== "investigate") {
        throw new Error("decision must be one of plan, keep, discard, vetoed, investigate");
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
function resolveMaxTokens(maxTokens) {
    if (typeof maxTokens !== "number" || !Number.isFinite(maxTokens)) {
        return DEFAULT_REFLECTION_MAX_TOKENS;
    }
    return Math.max(1, Math.min(DEFAULT_REFLECTION_MAX_TOKENS, Math.round(maxTokens)));
}
function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const deduped = new Set();
    for (const item of value) {
        if (typeof item !== "string") {
            continue;
        }
        const trimmed = item.trim();
        if (trimmed.length > 0) {
            deduped.add(trimmed);
        }
    }
    return [...deduped];
}
function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
}
function deriveWhatChanged(entry, details) {
    const summary = details.mutation.summary.trim();
    if (summary.length > 0) {
        return summary;
    }
    return entry.patchSummary;
}
function deriveWhyItLikelyHelped(entry) {
    if (entry.decision === "discard" || entry.decision === "vetoed") {
        return null;
    }
    if (entry.candidateObjectiveRate < entry.baselineObjectiveRate) {
        return `The candidate reduced the target failure rate from ${formatPercent(entry.baselineObjectiveRate)} to ${formatPercent(entry.candidateObjectiveRate)}.`;
    }
    if (entry.improvements > 0) {
        return `The candidate improved ${entry.improvements} targeted spec${entry.improvements === 1 ? "" : "s"}.`;
    }
    return null;
}
function deriveWhatRegressed(entry) {
    const parts = [];
    if (entry.regressions > 0) {
        parts.push(`Observed ${entry.regressions} regression${entry.regressions === 1 ? "" : "s"}.`);
    }
    if (entry.hardVetoReason) {
        parts.push(`Hard veto reason: ${entry.hardVetoReason}.`);
    }
    return parts.length > 0 ? parts.join(" ") : null;
}
function buildReflectionPrompt(entry, details) {
    return [
        "You are summarizing an EvalGate auto experiment iteration.",
        "Return JSON only with this exact shape:",
        '{"whyItLikelyHelped":string|null,"whatRegressed":string|null,"whatToTryNext":string[],"whatNotToRetry":string[]}',
        "Rules:",
        "- Do not include markdown or code fences.",
        "- Keep each string concise and specific.",
        "- If the decision is discard or vetoed, set whyItLikelyHelped to null.",
        "- If there were no regressions and no hard veto, set whatRegressed to null.",
        "- whatToTryNext should be ordered next-step suggestions.",
        "- whatNotToRetry should contain explicit exclusions when the experiment clearly failed.",
        "Experiment ledger context:",
        JSON.stringify({
            experimentId: entry.experimentId,
            sessionId: entry.sessionId,
            targetFailureMode: entry.targetFailureMode,
            mutationFamily: entry.mutationFamily,
            decision: entry.decision,
            patchSummary: entry.patchSummary,
            utilityScore: entry.utilityScore,
            objectiveRateBefore: entry.baselineObjectiveRate,
            objectiveRateAfter: entry.candidateObjectiveRate,
            regressions: entry.regressions,
            improvements: entry.improvements,
            hardVetoReason: entry.hardVetoReason,
            targetedSpecs: entry.targetedSpecs,
        }, null, 2),
        "Experiment detail artifact:",
        JSON.stringify(details, null, 2),
    ].join("\n\n");
}
async function callReflectionLLM(prompt, config, maxTokens) {
    const timeoutMs = config.timeoutMs ?? DEFAULT_REFLECTION_TIMEOUT_MS;
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const fetchWithSignal = (url, init) => fetch(url, ac ? { ...init, signal: ac.signal } : init);
    const llmCall = async () => {
        if (config.provider === "anthropic") {
            const baseUrl = config.baseUrl ?? "https://api.anthropic.com";
            const model = config.model ?? DEFAULT_ANTHROPIC_MODEL;
            const response = await fetchWithSignal(`${baseUrl}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model,
                    max_tokens: maxTokens,
                    temperature: 0,
                    messages: [{ role: "user", content: prompt }],
                }),
            });
            if (!response.ok) {
                throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
            }
            const data = (await response.json());
            return data.content?.[0]?.text?.trim() ?? "";
        }
        if (config.provider === "openai") {
            const baseUrl = config.baseUrl ?? "https://api.openai.com";
            const model = config.model ?? DEFAULT_OPENAI_MODEL;
            const response = await fetchWithSignal(`${baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: maxTokens,
                    temperature: 0,
                }),
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
            }
            const data = (await response.json());
            return data.choices?.[0]?.message?.content?.trim() ?? "";
        }
        throw new Error(`Unsupported provider: ${config.provider}`);
    };
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            ac?.abort();
            reject(new Error(`Auto reflection LLM call timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([llmCall(), timeoutPromise]);
    }
    finally {
        clearTimeout(timer);
    }
}
function parseReflectionResponse(text) {
    const trimmed = text.trim();
    const parseCandidate = (candidate) => {
        const parsed = JSON.parse(candidate);
        if (!isRecord(parsed)) {
            throw new Error("Reflection response must be a JSON object");
        }
        return parsed;
    };
    try {
        return parseCandidate(trimmed);
    }
    catch {
        const firstBrace = trimmed.indexOf("{");
        const lastBrace = trimmed.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return parseCandidate(trimmed.slice(firstBrace, lastBrace + 1));
        }
        throw new Error("Reflection response was not valid JSON");
    }
}
function buildFallbackAutoReflection(input) {
    const { entry, details } = input;
    return {
        schemaVersion: exports.AUTO_REFLECTION_SCHEMA_VERSION,
        experimentId: entry.experimentId,
        sessionId: entry.sessionId,
        generatedAt: new Date().toISOString(),
        targetFailureMode: entry.targetFailureMode,
        mutationFamily: entry.mutationFamily,
        decision: entry.decision,
        whatChanged: deriveWhatChanged(entry, details),
        whyItLikelyHelped: deriveWhyItLikelyHelped(entry),
        whatRegressed: deriveWhatRegressed(entry),
        whatToTryNext: [],
        whatNotToRetry: entry.decision === "discard" || entry.decision === "vetoed"
            ? [entry.mutationFamily]
            : [],
        clusterId: entry.targetClusterId,
        utilityScore: entry.utilityScore ?? 0,
        objectiveRateBefore: entry.baselineObjectiveRate,
        objectiveRateAfter: entry.candidateObjectiveRate,
        regressions: entry.regressions,
        hardVetoReason: entry.hardVetoReason,
    };
}
function normalizeReflection(input, response) {
    const fallback = buildFallbackAutoReflection(input);
    const whyItLikelyHelped = fallback.decision === "discard" || fallback.decision === "vetoed"
        ? null
        : typeof response.whyItLikelyHelped === "string" &&
            response.whyItLikelyHelped.trim().length > 0
            ? response.whyItLikelyHelped.trim()
            : fallback.whyItLikelyHelped;
    const whatRegressed = fallback.regressions === 0 && fallback.hardVetoReason === null
        ? null
        : typeof response.whatRegressed === "string" &&
            response.whatRegressed.trim().length > 0
            ? response.whatRegressed.trim()
            : fallback.whatRegressed;
    return {
        ...fallback,
        whyItLikelyHelped,
        whatRegressed,
        whatToTryNext: normalizeStringArray(response.whatToTryNext),
        whatNotToRetry: normalizeStringArray(response.whatNotToRetry),
    };
}
function resolveAutoReflectionPath(experimentId, projectRoot = process.cwd()) {
    assertString(experimentId, "experimentId");
    return path.join((0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot).autoDir, "reflections", `${experimentId}.json`);
}
function resolveAutoReflectionRelativePath(experimentId, projectRoot = process.cwd()) {
    return path.relative(projectRoot, resolveAutoReflectionPath(experimentId, projectRoot));
}
function assertValidAutoReflection(value, fieldName = "reflection") {
    if (!isRecord(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
    assertString(value.schemaVersion, `${fieldName}.schemaVersion`);
    if (value.schemaVersion !== exports.AUTO_REFLECTION_SCHEMA_VERSION) {
        throw new Error(`${fieldName}.schemaVersion must equal ${exports.AUTO_REFLECTION_SCHEMA_VERSION}`);
    }
    assertString(value.experimentId, `${fieldName}.experimentId`);
    assertString(value.sessionId, `${fieldName}.sessionId`);
    assertString(value.generatedAt, `${fieldName}.generatedAt`);
    if (!isIsoTimestamp(value.generatedAt)) {
        throw new Error(`${fieldName}.generatedAt must be a valid ISO timestamp`);
    }
    assertString(value.targetFailureMode, `${fieldName}.targetFailureMode`);
    assertString(value.mutationFamily, `${fieldName}.mutationFamily`);
    assertDecision(value.decision);
    assertString(value.whatChanged, `${fieldName}.whatChanged`);
    assertNullableString(value.whyItLikelyHelped, `${fieldName}.whyItLikelyHelped`);
    assertNullableString(value.whatRegressed, `${fieldName}.whatRegressed`);
    assertStringArray(value.whatToTryNext, `${fieldName}.whatToTryNext`);
    assertStringArray(value.whatNotToRetry, `${fieldName}.whatNotToRetry`);
    assertNullableString(value.clusterId, `${fieldName}.clusterId`);
    assertNumber(value.utilityScore, `${fieldName}.utilityScore`);
    assertNumber(value.objectiveRateBefore, `${fieldName}.objectiveRateBefore`);
    assertNumber(value.objectiveRateAfter, `${fieldName}.objectiveRateAfter`);
    assertNumber(value.regressions, `${fieldName}.regressions`);
    assertNullableString(value.hardVetoReason, `${fieldName}.hardVetoReason`);
}
function writeAutoReflection(reflection, reflectionPath = resolveAutoReflectionPath(reflection.experimentId)) {
    assertValidAutoReflection(reflection);
    ensureDirectoryForFile(reflectionPath);
    fs.writeFileSync(reflectionPath, JSON.stringify(reflection, null, 2), "utf8");
}
function readAutoReflection(reflectionPath) {
    const parsed = JSON.parse(fs.readFileSync(reflectionPath, "utf8"));
    assertValidAutoReflection(parsed);
    return parsed;
}
async function generateAutoReflection(input) {
    const logger = input.logger ?? console;
    if (!input.llmConfig) {
        logger.warn(`EvalGate auto WARNING: reflection generation skipped for ${input.entry.experimentId} because no LLM config was provided.`);
        return buildFallbackAutoReflection(input);
    }
    try {
        const responseText = await callReflectionLLM(buildReflectionPrompt(input.entry, input.details), input.llmConfig, resolveMaxTokens(input.maxTokens));
        return normalizeReflection(input, parseReflectionResponse(responseText));
    }
    catch (error) {
        logger.warn(`EvalGate auto WARNING: reflection generation failed for ${input.entry.experimentId}: ${error instanceof Error ? error.message : String(error)}`);
        return buildFallbackAutoReflection(input);
    }
}
async function generateAndWriteAutoReflection(input) {
    const reflection = await generateAutoReflection(input);
    writeAutoReflection(reflection, resolveAutoReflectionPath(reflection.experimentId, input.projectRoot));
    return reflection;
}
