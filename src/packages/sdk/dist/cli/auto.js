"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLegacyAuto = exports.parseAutoArgs = exports.generatePromptCandidates = exports.formatAutoHuman = exports.decideAutoExperiment = exports.DEFAULT_AUTO_REPORT_PATH = exports.buildAutoReport = exports.buildAutoPlan = exports.applyPromptCandidate = void 0;
exports.runAuto = runAuto;
const auto_commands_1 = require("./auto-commands");
const auto_runner_1 = require("./auto-runner");
var auto_runner_2 = require("./auto-runner");
Object.defineProperty(exports, "applyPromptCandidate", { enumerable: true, get: function () { return auto_runner_2.applyPromptCandidate; } });
Object.defineProperty(exports, "buildAutoPlan", { enumerable: true, get: function () { return auto_runner_2.buildAutoPlan; } });
Object.defineProperty(exports, "buildAutoReport", { enumerable: true, get: function () { return auto_runner_2.buildAutoReport; } });
Object.defineProperty(exports, "DEFAULT_AUTO_REPORT_PATH", { enumerable: true, get: function () { return auto_runner_2.DEFAULT_AUTO_REPORT_PATH; } });
Object.defineProperty(exports, "decideAutoExperiment", { enumerable: true, get: function () { return auto_runner_2.decideAutoExperiment; } });
Object.defineProperty(exports, "formatAutoHuman", { enumerable: true, get: function () { return auto_runner_2.formatAutoHuman; } });
Object.defineProperty(exports, "generatePromptCandidates", { enumerable: true, get: function () { return auto_runner_2.generatePromptCandidates; } });
Object.defineProperty(exports, "parseAutoArgs", { enumerable: true, get: function () { return auto_runner_2.parseAutoArgs; } });
Object.defineProperty(exports, "runLegacyAuto", { enumerable: true, get: function () { return auto_runner_2.runLegacyAuto; } });
async function runAuto(args) {
    const subcommand = args[0];
    if (!subcommand || subcommand.startsWith("--")) {
        return (0, auto_runner_1.runLegacyAuto)(args);
    }
    if (subcommand === "init") {
        return (0, auto_commands_1.runAutoInit)(args.slice(1));
    }
    if (subcommand === "run") {
        return (0, auto_commands_1.runAutoRun)(args.slice(1));
    }
    if (subcommand === "daemon") {
        return (0, auto_commands_1.runAutoDaemon)(args.slice(1));
    }
    if (subcommand === "history") {
        return (0, auto_commands_1.runAutoHistory)(args.slice(1));
    }
    console.error(`EvalGate auto ERROR: unknown subcommand '${subcommand}'`);
    return 1;
}
