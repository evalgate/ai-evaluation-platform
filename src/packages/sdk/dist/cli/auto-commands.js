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
exports.runAutoInit = runAutoInit;
exports.runAutoRun = runAutoRun;
exports.runAutoDaemon = runAutoDaemon;
exports.runAutoHistory = runAutoHistory;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const auto_history_1 = require("./auto-history");
const auto_holdout_1 = require("./auto-holdout");
const auto_ledger_1 = require("./auto-ledger");
const auto_program_1 = require("./auto-program");
const auto_runner_1 = require("./auto-runner");
const AUTO_INIT_PROGRAM_MARKDOWN = [
    "```yaml",
    "objective:",
    "  failure_mode: tone_mismatch",
    "mutation:",
    "  target: prompts/support.md",
    "  allowed_families:",
    "    - append_instruction",
    "budget:",
    "  max_experiments: 3",
    "utility:",
    "  weights:",
    "    objective_reduction_ratio: 1",
    "    regressions: -1",
    "hard_vetoes:",
    "  latency_ceiling: 0.2",
    "promotion:",
    "  min_utility: 0.05",
    "holdout:",
    "  selection: deterministic",
    "  locked_after: 1",
    "stop_conditions:",
    "  target_ratio: 0.1",
    "```",
    "",
].join("\n");
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readFlagValue(args, flag) {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : null;
}
function hasFlag(args, flag) {
    return args.includes(flag);
}
function parseAutoDaemonArgs(args) {
    const cycleArgs = [];
    let cycles = 3;
    let intervalMs = 0;
    let format = "human";
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if ((arg === "--cycles" || arg === "--max-cycles") && args[index + 1]) {
            const parsed = Number.parseInt(args[index + 1], 10);
            if (Number.isFinite(parsed) && parsed > 0) {
                cycles = parsed;
            }
            index += 1;
            continue;
        }
        if (arg === "--interval-ms" && args[index + 1]) {
            const parsed = Number.parseInt(args[index + 1], 10);
            if (Number.isFinite(parsed) && parsed >= 0) {
                intervalMs = parsed;
            }
            index += 1;
            continue;
        }
        if (arg === "--format" && args[index + 1]) {
            const next = args[index + 1];
            if (next === "human" || next === "json") {
                format = next;
            }
        }
        cycleArgs.push(arg);
    }
    return {
        cycles,
        intervalMs,
        format,
        cycleArgs,
    };
}
async function sleep(ms) {
    if (ms <= 0) {
        return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
}
function isAutoDecision(value) {
    return (value === "plan" ||
        value === "keep" ||
        value === "discard" ||
        value === "vetoed" ||
        value === "investigate");
}
function getProgramObjective(program) {
    const objective = program.objective;
    for (const key of ["failure_mode", "name", "target", "objective", "text"]) {
        const value = objective[key];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    return null;
}
function getProgramBudget(program) {
    const budget = program.budget;
    const value = budget.max_experiments;
    return typeof value === "number" && Number.isInteger(value) && value > 0
        ? value
        : null;
}
function getProgramMutationTarget(program) {
    const mutation = program.mutation;
    const value = mutation.target;
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function getProgramDaemonDefaults(program) {
    const daemon = isRecord(program.daemon) ? program.daemon : {};
    const intervalSeconds = daemon.interval_seconds;
    const maxExperimentsPerCycle = daemon.max_experiments_per_cycle;
    return {
        intervalMs: typeof intervalSeconds === "number" &&
            Number.isFinite(intervalSeconds) &&
            intervalSeconds >= 0
            ? Math.round(intervalSeconds * 1000)
            : null,
        maxExperimentsPerCycle: typeof maxExperimentsPerCycle === "number" &&
            Number.isInteger(maxExperimentsPerCycle) &&
            maxExperimentsPerCycle > 0
            ? maxExperimentsPerCycle
            : null,
    };
}
function buildAutoRunContext(args, options = {}) {
    const program = options.program ?? (0, auto_program_1.loadAutoProgramOrThrow)();
    (0, auto_holdout_1.parseAutoHoldoutConfig)(program.holdout);
    const enrichedArgs = [...args];
    const objective = getProgramObjective(program);
    if (!hasFlag(enrichedArgs, "--objective") && objective) {
        enrichedArgs.push("--objective", objective);
    }
    const budget = options.budgetOverride ?? getProgramBudget(program);
    if (!hasFlag(enrichedArgs, "--budget") && budget !== null) {
        enrichedArgs.push("--budget", String(budget));
    }
    const promptTarget = getProgramMutationTarget(program);
    if (!hasFlag(enrichedArgs, "--prompt") && promptTarget) {
        enrichedArgs.push("--prompt", promptTarget);
    }
    return {
        enrichedArgs,
        program,
    };
}
function ensureAutoInitScaffold(projectRoot, force) {
    const paths = (0, auto_ledger_1.resolveAutoWorkspacePaths)(projectRoot);
    if (fs.existsSync(paths.programPath) && !force) {
        throw new Error(`Auto program already exists at ${paths.programPath}. Re-run with --force to overwrite it.`);
    }
    fs.mkdirSync(paths.autoDir, { recursive: true });
    fs.mkdirSync(paths.detailsDir, { recursive: true });
    fs.mkdirSync(paths.runsDir, { recursive: true });
    fs.writeFileSync(paths.programPath, AUTO_INIT_PROGRAM_MARKDOWN, "utf8");
    if (!fs.existsSync(paths.ledgerPath)) {
        fs.writeFileSync(paths.ledgerPath, "", "utf8");
    }
    return {
        programPath: paths.programPath,
        ledgerPath: paths.ledgerPath,
    };
}
function runAutoInit(args) {
    const projectRoot = process.cwd();
    const force = hasFlag(args, "--force");
    const format = readFlagValue(args, "--format") === "json" ? "json" : "human";
    try {
        const result = ensureAutoInitScaffold(projectRoot, force);
        console.log(format === "json"
            ? JSON.stringify(result, null, 2)
            : `Initialized EvalGate auto workspace at ${path.relative(projectRoot, result.programPath)}`);
        return 0;
    }
    catch (error) {
        console.error(`EvalGate auto ERROR: ${error instanceof Error ? error.message : String(error)}`);
        return 1;
    }
}
async function runAutoRun(args) {
    try {
        const { enrichedArgs, program } = buildAutoRunContext(args);
        return await (0, auto_runner_1.runLegacyAuto)(enrichedArgs, program);
    }
    catch (error) {
        console.error(`EvalGate auto ERROR: ${error instanceof Error ? error.message : String(error)}`);
        return 2;
    }
}
async function runAutoDaemon(args) {
    const options = parseAutoDaemonArgs(args);
    const intervalWasExplicit = hasFlag(args, "--interval-ms");
    const exitCodes = [];
    let effectiveIntervalMs = options.intervalMs;
    for (let cycle = 0; cycle < options.cycles; cycle++) {
        let cycleArgs = options.cycleArgs;
        try {
            const program = (0, auto_program_1.loadAutoProgramOrThrow)();
            const daemonDefaults = getProgramDaemonDefaults(program);
            if (!intervalWasExplicit && daemonDefaults.intervalMs !== null) {
                effectiveIntervalMs = daemonDefaults.intervalMs;
            }
            const context = buildAutoRunContext(options.cycleArgs, {
                budgetOverride: daemonDefaults.maxExperimentsPerCycle,
                program,
            });
            cycleArgs = context.enrichedArgs;
        }
        catch (error) {
            console.error(`EvalGate auto ERROR: ${error instanceof Error ? error.message : String(error)}`);
            return 2;
        }
        if (options.format === "human") {
            console.log(`EvalGate auto daemon cycle ${cycle + 1}/${options.cycles}`);
        }
        const exitCode = await (0, auto_runner_1.runLegacyAuto)(cycleArgs);
        exitCodes.push(exitCode);
        if (exitCode !== 0) {
            if (options.format === "json") {
                console.log(JSON.stringify({
                    cyclesRequested: options.cycles,
                    cyclesCompleted: cycle + 1,
                    intervalMs: effectiveIntervalMs,
                    exitCodes,
                    stoppedEarly: true,
                }, null, 2));
            }
            return exitCode;
        }
        if (cycle < options.cycles - 1) {
            await sleep(effectiveIntervalMs);
        }
    }
    if (options.format === "json") {
        console.log(JSON.stringify({
            cyclesRequested: options.cycles,
            cyclesCompleted: options.cycles,
            intervalMs: effectiveIntervalMs,
            exitCodes,
            stoppedEarly: false,
        }, null, 2));
    }
    else {
        console.log(`EvalGate auto daemon completed ${options.cycles} cycle(s) successfully.`);
    }
    return 0;
}
function runAutoHistory(args) {
    const format = readFlagValue(args, "--format") === "json" ? "json" : "human";
    const inspectId = readFlagValue(args, "--inspect");
    const limitValue = readFlagValue(args, "--limit");
    const family = readFlagValue(args, "--family");
    const decisionValue = readFlagValue(args, "--decision");
    try {
        const projectRoot = process.cwd();
        const filter = {};
        if (limitValue) {
            filter.limit = Number.parseInt(limitValue, 10);
        }
        if (family) {
            filter.mutationFamily = family;
        }
        if (decisionValue) {
            if (!isAutoDecision(decisionValue)) {
                throw new Error(`Invalid history decision '${decisionValue}'`);
            }
            filter.decision = decisionValue;
        }
        if (inspectId) {
            const result = (0, auto_history_1.inspectAutoExperiment)(inspectId);
            console.log(format === "json"
                ? JSON.stringify(result, null, 2)
                : (0, auto_history_1.formatAutoExperimentInspect)(result));
            return 0;
        }
        const history = (0, auto_history_1.readAutoHistory)(projectRoot, filter);
        console.log(format === "json"
            ? JSON.stringify(history, null, 2)
            : (0, auto_history_1.formatAutoHistory)(history, { projectRoot }));
        return 0;
    }
    catch (error) {
        console.error(`EvalGate auto ERROR: ${error instanceof Error ? error.message : String(error)}`);
        return 1;
    }
}
