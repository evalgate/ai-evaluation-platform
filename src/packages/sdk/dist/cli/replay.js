"use strict";
/**
 * evalgate replay — Re-run a candidate eval case against the current model.
 *
 * Usage:
 *   evalgate replay <candidate-id>
 *
 * Options:
 *   --model <model>      Override model (default: from minimized_input metadata)
 *   --apiKey <key>       API key (or EVALGATE_API_KEY env)
 *   --baseUrl <url>      API base URL
 *   --format <fmt>       Output format: human (default), json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReplayArgs = parseReplayArgs;
exports.runReplay = runReplay;
const api_1 = require("./api");
const config_1 = require("./config");
function parseReplayArgs(args) {
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--model" && args[i + 1]) {
            result.model = args[++i];
        }
        else if (arg === "--apiKey" && args[i + 1]) {
            result.apiKey = args[++i];
        }
        else if (arg === "--baseUrl" && args[i + 1]) {
            result.baseUrl = args[++i];
        }
        else if (arg === "--format" && args[i + 1]) {
            result.format = args[++i];
        }
        else if (!arg.startsWith("--") && !result.candidateId) {
            result.candidateId = arg;
        }
    }
    return result;
}
async function runReplay(args) {
    const parsed = parseReplayArgs(args);
    const config = (0, config_1.loadConfig)();
    const merged = (0, config_1.mergeConfigWithArgs)(config, {
        apiKey: parsed.apiKey,
        baseUrl: parsed.baseUrl,
    });
    const fetchOpts = {
        apiKey: merged.apiKey ?? process.env.EVALGATE_API_KEY ?? "",
        baseUrl: merged.baseUrl ?? "http://localhost:3000",
    };
    if (!fetchOpts.apiKey) {
        console.error("  ✖ No API key found. Set EVALGATE_API_KEY or pass --apiKey");
        return 1;
    }
    if (!parsed.candidateId) {
        console.error("  ✖ Candidate ID required. Usage: evalgate replay <id>");
        return 1;
    }
    // Fetch candidate detail
    const detail = await (0, api_1.fetchAPI)(`/api/candidates/${parsed.candidateId}`, fetchOpts);
    if (!detail?.candidate) {
        console.error(`  ✖ Candidate ${parsed.candidateId} not found`);
        return 1;
    }
    const candidate = detail.candidate;
    const minimizedInput = (candidate.minimized_input ??
        candidate.minimizedInput);
    if (!minimizedInput) {
        console.error("  ✖ No minimized_input stored for this candidate.");
        console.error("    Replay requires the original prompt to be preserved.");
        return 1;
    }
    // Display the reconstructed prompt
    if (parsed.format === "json") {
        console.log(JSON.stringify({
            candidate_id: candidate.id,
            title: candidate.title,
            minimized_input: minimizedInput,
            model_override: parsed.model ?? null,
            expected_constraints: (candidate.expected_constraints ??
                candidate.expectedConstraints),
        }, null, 2));
    }
    else {
        console.log(`\n  Replay: Candidate #${candidate.id}`);
        console.log(`  Title:  ${candidate.title}`);
        console.log(`  ─────────────────────────────────────`);
        console.log(`  System: ${minimizedInput.systemPrompt ?? "(none)"}`);
        console.log(`  User:   ${minimizedInput.userPrompt}`);
        const activeTools = minimizedInput.activeTools;
        if (activeTools && activeTools.length > 0) {
            console.log(`  Tools:  ${activeTools.join(", ")}`);
        }
        const conversationContext = minimizedInput.conversationContext;
        if (conversationContext && conversationContext.length > 0) {
            console.log(`  Context: ${conversationContext.length} prior turns`);
        }
        console.log(`  ─────────────────────────────────────`);
        if (parsed.model) {
            console.log(`  Model override: ${parsed.model}`);
        }
        const constraints = (candidate.expected_constraints ??
            candidate.expectedConstraints) ?? [];
        if (constraints.length > 0) {
            console.log(`\n  Expected constraints:`);
            for (const c of constraints) {
                console.log(`    • [${c.type}] ${c.description ?? c.value}`);
            }
        }
        console.log(`\n  ⚠ Replay execution requires a configured model endpoint.`);
        console.log(`  Use the minimized input above to manually re-run against your model.`);
    }
    return 0;
}
