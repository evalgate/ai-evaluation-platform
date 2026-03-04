"use strict";
/**
 * evalgate promote — Promote candidate eval cases to the golden regression suite.
 *
 * Usage:
 *   evalgate promote <candidate-id>            Promote a specific candidate
 *   evalgate promote --auto                    Auto-promote all eligible candidates
 *   evalgate promote --list                    List promotable candidates
 *
 * Options:
 *   --apiKey <key>       API key (or EVALGATE_API_KEY env)
 *   --baseUrl <url>      API base URL
 *   --evaluation-id <id> Target evaluation (default: golden regression)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePromoteArgs = parsePromoteArgs;
exports.runPromote = runPromote;
const api_1 = require("./api");
const config_1 = require("./config");
function parsePromoteArgs(args) {
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--auto") {
            result.auto = true;
        }
        else if (arg === "--list") {
            result.list = true;
        }
        else if (arg === "--evaluation-id" && args[i + 1]) {
            result.evaluationId = args[++i];
        }
        else if (arg === "--apiKey" && args[i + 1]) {
            result.apiKey = args[++i];
        }
        else if (arg === "--baseUrl" && args[i + 1]) {
            result.baseUrl = args[++i];
        }
        else if (!arg.startsWith("--") && !result.candidateId) {
            result.candidateId = arg;
        }
    }
    return result;
}
async function runPromote(args) {
    const parsed = parsePromoteArgs(args);
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
    // List mode
    if (parsed.list) {
        const data = await (0, api_1.fetchAPI)("/api/candidates?status=quarantined&auto_promote_eligible=true", fetchOpts);
        const candidates = (data.candidates ?? []);
        if (candidates.length === 0) {
            console.log("  No auto-promotable candidates found.");
            return 0;
        }
        console.log(`  ${candidates.length} auto-promotable candidate(s):\n`);
        for (const c of candidates) {
            console.log(`  [${c.id}] ${c.title} (quality: ${c.qualityScore ?? "?"})`);
        }
        return 0;
    }
    // Auto-promote mode
    if (parsed.auto) {
        const data = await (0, api_1.fetchAPI)("/api/candidates?status=quarantined&auto_promote_eligible=true", fetchOpts);
        const candidates = (data.candidates ?? []);
        if (candidates.length === 0) {
            console.log("  No auto-promotable candidates found.");
            return 0;
        }
        let promoted = 0;
        for (const c of candidates) {
            try {
                const body = {};
                if (parsed.evaluationId) {
                    body.evaluation_id = parseInt(parsed.evaluationId, 10);
                }
                await (0, api_1.fetchAPI)(`/api/candidates/${c.id}/promote`, {
                    ...fetchOpts,
                    method: "POST",
                    body,
                });
                console.log(`  ✔ Promoted [${c.id}] ${c.title}`);
                promoted++;
            }
            catch (err) {
                console.error(`  ✖ Failed to promote [${c.id}]: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        console.log(`\n  ${promoted}/${candidates.length} candidates promoted.`);
        return promoted === candidates.length ? 0 : 1;
    }
    // Single promote
    if (!parsed.candidateId) {
        console.error("  ✖ Candidate ID required. Usage: evalgate promote <id>");
        console.error("    evalgate promote --auto     Auto-promote eligible");
        console.error("    evalgate promote --list     List promotable candidates");
        return 1;
    }
    const body = {};
    if (parsed.evaluationId) {
        body.evaluation_id = parseInt(parsed.evaluationId, 10);
    }
    const result = await (0, api_1.fetchAPI)(`/api/candidates/${parsed.candidateId}/promote`, {
        ...fetchOpts,
        method: "POST",
        body,
    });
    console.log(`  ✔ Promoted candidate ${parsed.candidateId}`);
    if (result.test_case_id) {
        console.log(`    → Test case #${result.test_case_id} in evaluation #${result.evaluation_id}`);
    }
    return 0;
}
