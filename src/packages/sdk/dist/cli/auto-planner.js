"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectNextFamily = selectNextFamily;
exports.planNextIteration = planNextIteration;
const auto_families_1 = require("./auto-families");
const DEFAULT_PLANNER_MAX_TOKENS = 1000;
const DEFAULT_PLANNER_TIMEOUT_MS = 30000;
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
function assertNonEmptyFamilies(allowedFamilies) {
    if (allowedFamilies.length === 0) {
        throw new Error("allowedFamilies must include at least one mutation family");
    }
}
function resolveMaxTokens(maxTokens) {
    if (typeof maxTokens !== "number" || !Number.isFinite(maxTokens)) {
        return DEFAULT_PLANNER_MAX_TOKENS;
    }
    return Math.max(1, Math.min(DEFAULT_PLANNER_MAX_TOKENS, Math.round(maxTokens)));
}
function findLastAttemptIndex(ledgerEntries, familyId) {
    for (let index = ledgerEntries.length - 1; index >= 0; index--) {
        if (ledgerEntries[index]?.mutationFamily === familyId) {
            return index;
        }
    }
    return -1;
}
function isFailedFamilyCoolingDown(familyId, clusterMemory, ledgerEntries, retryAfterIterations) {
    if (!clusterMemory) {
        return false;
    }
    const failed = clusterMemory.failedInterventions.some((intervention) => intervention.mutationFamily === familyId);
    if (!failed) {
        return false;
    }
    const lastAttemptIndex = findLastAttemptIndex(ledgerEntries, familyId);
    if (lastAttemptIndex < 0) {
        return true;
    }
    return ledgerEntries.length - lastAttemptIndex - 1 < retryAfterIterations;
}
function wasUsedInLastTwoConsecutiveIterations(familyId, ledgerEntries) {
    const recentFamilies = ledgerEntries
        .slice(-2)
        .map((entry) => entry.mutationFamily);
    return (recentFamilies.filter((candidate) => candidate === familyId).length >= 2);
}
function getAvailableFamilies(allowedFamilies, clusterMemory) {
    if (!clusterMemory) {
        return [...allowedFamilies];
    }
    const failedFamilies = new Set(clusterMemory.failedInterventions.map((intervention) => intervention.mutationFamily));
    return allowedFamilies.filter((familyId) => !failedFamilies.has(familyId));
}
function selectByPriority(candidateFamilies, familyPriors) {
    return [...candidateFamilies].sort((left, right) => {
        const rightPriority = (0, auto_families_1.resolveFamilyPriorityScore)(right, familyPriors);
        const leftPriority = (0, auto_families_1.resolveFamilyPriorityScore)(left, familyPriors);
        if (rightPriority !== leftPriority) {
            return rightPriority - leftPriority;
        }
        return left.localeCompare(right);
    })[0];
}
function normalizePatchResponse(text) {
    const trimmed = text.trim();
    const parseCandidate = (candidate) => {
        const parsed = JSON.parse(candidate);
        if (typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)) {
            throw new Error("Planner response must be a JSON object");
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
        throw new Error("Planner response was not valid JSON");
    }
}
function normalizePatchText(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function buildHeuristicPatch(input) {
    const family = (0, auto_families_1.getMutationFamily)(input.selectedFamily);
    const avoidItems = input.recentReflections
        .flatMap((reflection) => reflection.whatNotToRetry)
        .slice(0, 2);
    const tryNextItems = input.recentReflections
        .flatMap((reflection) => reflection.whatToTryNext)
        .slice(0, 2);
    const segments = [
        `Use the ${family?.description ?? input.selectedFamily} strategy to reduce ${input.objective}.`,
    ];
    if (family?.patchTemplate) {
        segments.push(family.patchTemplate);
    }
    if (input.hypothesis && input.hypothesis.trim().length > 0) {
        segments.push(`Working hypothesis: ${input.hypothesis.trim()}.`);
    }
    if (tryNextItems.length > 0) {
        segments.push(`Prior successful direction: ${tryNextItems.join(" ")}`);
    }
    if (avoidItems.length > 0) {
        segments.push(`Avoid repeating: ${avoidItems.join(" ")}`);
    }
    return segments.join(" ");
}
function buildPlannerPrompt(input) {
    const family = (0, auto_families_1.getMutationFamily)(input.selectedFamily);
    return [
        "You are proposing one focused EvalGate auto prompt mutation.",
        "Return JSON only with this exact shape:",
        '{"patch":string}',
        "Rules:",
        "- patch must be concise natural-language instruction text to place inside the EvalGate auto block.",
        "- Propose exactly one mutation family and keep the change focused.",
        "- Do not emit markdown, code fences, or explanations.",
        "- Respect forbidden changes.",
        `Selected mutation family: ${input.selectedFamily}`,
        `Family description: ${family?.description ?? input.selectedFamily}`,
        `Patch template: ${family?.patchTemplate ?? "none"}`,
        `Objective: ${input.objective}`,
        `Target file: ${input.targetPath}`,
        `Working hypothesis: ${input.hypothesis?.trim() || "none"}`,
        `Forbidden changes: ${input.forbiddenChanges.length > 0 ? input.forbiddenChanges.join("; ") : "none"}`,
        "Recent reflections:",
        JSON.stringify(input.recentReflections.slice(-3).map((reflection) => ({
            mutationFamily: reflection.mutationFamily,
            decision: reflection.decision,
            whatToTryNext: reflection.whatToTryNext,
            whatNotToRetry: reflection.whatNotToRetry,
        })), null, 2),
        "Current target file content:",
        input.targetContent,
    ].join("\n\n");
}
async function callPlannerLLM(prompt, config, maxTokens) {
    const timeoutMs = config.timeoutMs ?? DEFAULT_PLANNER_TIMEOUT_MS;
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const fetchWithSignal = (url, init) => fetch(url, ac ? { ...init, signal: ac.signal } : init);
    const llmCall = async () => {
        if (config.provider === "anthropic") {
            const response = await fetchWithSignal(`${config.baseUrl ?? "https://api.anthropic.com"}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: config.model ?? DEFAULT_ANTHROPIC_MODEL,
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
            const response = await fetchWithSignal(`${config.baseUrl ?? "https://api.openai.com"}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model ?? DEFAULT_OPENAI_MODEL,
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
            reject(new Error(`Auto planner LLM call timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([llmCall(), timeoutPromise]);
    }
    finally {
        clearTimeout(timer);
    }
}
function selectNextFamily(allowedFamilies, clusterMemory, familyPriors, ledgerEntries, _options = {}) {
    assertNonEmptyFamilies(allowedFamilies);
    const availableFamilies = getAvailableFamilies(allowedFamilies, clusterMemory);
    if (availableFamilies.length === 0) {
        return null;
    }
    const candidates = availableFamilies
        .filter((familyId) => !wasUsedInLastTwoConsecutiveIterations(familyId, ledgerEntries))
        .filter((familyId) => !isFailedFamilyCoolingDown(familyId, null, ledgerEntries, 0));
    if (candidates.length === 0) {
        return selectByPriority(availableFamilies, familyPriors);
    }
    return selectByPriority(candidates, familyPriors);
}
async function planNextIteration(input) {
    assertNonEmptyFamilies(input.allowedFamilies);
    const logger = input.logger ?? console;
    const selectedFamily = selectNextFamily(input.allowedFamilies, input.clusterMemory, input.familyPriors.filter((prior) => prior.failureMode === input.objective), input.ledgerEntries, { retryAfterIterations: input.retryAfterIterations });
    if (selectedFamily === null) {
        return {
            selectedFamily: null,
            proposedPatch: null,
            candidate: null,
            reason: "cluster_exhausted",
        };
    }
    const fallbackPatch = buildHeuristicPatch({
        selectedFamily,
        objective: input.objective,
        hypothesis: input.hypothesis,
        recentReflections: input.recentReflections,
    });
    let proposedPatch = fallbackPatch;
    if (input.llmConfig) {
        try {
            const response = await callPlannerLLM(buildPlannerPrompt({
                selectedFamily,
                objective: input.objective,
                targetPath: input.targetPath,
                targetContent: input.targetContent,
                hypothesis: input.hypothesis,
                forbiddenChanges: input.forbiddenChanges ?? [],
                recentReflections: input.recentReflections,
            }), input.llmConfig, resolveMaxTokens(input.maxTokens));
            proposedPatch =
                normalizePatchText(normalizePatchResponse(response).patch) ??
                    fallbackPatch;
        }
        catch (error) {
            logger.warn(`EvalGate auto WARNING: planner patch proposal failed for family ${selectedFamily}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return {
        selectedFamily,
        proposedPatch,
        candidate: {
            id: `planner-${selectedFamily}-${input.iteration}`,
            label: selectedFamily,
            instruction: proposedPatch,
        },
    };
}
