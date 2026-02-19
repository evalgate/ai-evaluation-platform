"use strict";
/**
 * CI context capture and idempotency key for --onFail import.
 */
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
exports.captureCiContext = captureCiContext;
exports.computeIdempotencyKey = computeIdempotencyKey;
const node_crypto_1 = require("node:crypto");
const fs = __importStar(require("node:fs"));
function readPrFromEventPath() {
    const path = process.env.GITHUB_EVENT_PATH;
    if (!path)
        return undefined;
    try {
        const raw = fs.readFileSync(path, "utf8");
        const event = JSON.parse(raw);
        return event.pull_request?.number;
    }
    catch {
        return undefined;
    }
}
function readPrFromRef() {
    const ref = process.env.GITHUB_REF;
    if (!ref)
        return undefined;
    const m = ref.match(/^refs\/pull\/(\d+)\/merge$/);
    return m ? parseInt(m[1], 10) : undefined;
}
function captureCiContext() {
    const repo = process.env.GITHUB_REPOSITORY;
    const sha = process.env.GITHUB_SHA;
    const ref = process.env.GITHUB_REF;
    const runId = process.env.GITHUB_RUN_ID;
    const _workflow = process.env.GITHUB_WORKFLOW;
    const _job = process.env.GITHUB_JOB;
    const actor = process.env.GITHUB_ACTOR;
    if (!repo && !sha)
        return undefined;
    let provider = "unknown";
    if (process.env.GITHUB_ACTIONS)
        provider = "github";
    else if (process.env.GITLAB_CI)
        provider = "gitlab";
    else if (process.env.CIRCLECI)
        provider = "circle";
    let runUrl;
    if (repo && runId) {
        runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
    }
    let pr;
    if (process.env.GITHUB_EVENT_NAME === "pull_request") {
        pr = readPrFromEventPath() ?? readPrFromRef();
    }
    return {
        provider,
        repo,
        sha,
        branch: ref?.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : ref,
        runUrl,
        actor,
        pr,
    };
}
function computeIdempotencyKey(evaluationId, ci) {
    const repo = ci.repo ?? process.env.GITHUB_REPOSITORY;
    const workflow = process.env.GITHUB_WORKFLOW ?? "";
    const job = process.env.GITHUB_JOB ?? "";
    const sha = ci.sha ?? process.env.GITHUB_SHA ?? "";
    if (!repo || !sha)
        return undefined;
    const input = `${repo}.${workflow}.${job}.${sha}.${evaluationId}`;
    return hashSha256(input);
}
function hashSha256(input) {
    return (0, node_crypto_1.createHash)("sha256").update(input, "utf8").digest("hex");
}
