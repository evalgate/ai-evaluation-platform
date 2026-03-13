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
exports.AutoProgramValidationError = exports.ALLOWED_AUTO_PROGRAM_SECTIONS = exports.REQUIRED_AUTO_PROGRAM_SECTIONS = exports.AUTO_PROGRAM_RELATIVE_PATH = void 0;
exports.resolveAutoProgramPath = resolveAutoProgramPath;
exports.extractAutoProgramYamlBlock = extractAutoProgramYamlBlock;
exports.validateAutoProgram = validateAutoProgram;
exports.parseAutoProgramMarkdown = parseAutoProgramMarkdown;
exports.readAutoProgram = readAutoProgram;
exports.loadAutoProgramOrThrow = loadAutoProgramOrThrow;
exports.formatAutoProgramIssues = formatAutoProgramIssues;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const auto_families_1 = require("./auto-families");
exports.AUTO_PROGRAM_RELATIVE_PATH = path.join(".evalgate", "auto", "program.md");
exports.REQUIRED_AUTO_PROGRAM_SECTIONS = [
    "objective",
    "mutation",
    "budget",
    "utility",
    "hard_vetoes",
    "promotion",
    "holdout",
    "stop_conditions",
];
exports.ALLOWED_AUTO_PROGRAM_SECTIONS = [
    ...exports.REQUIRED_AUTO_PROGRAM_SECTIONS,
    "adaptive_loop",
    "daemon",
];
const YAML_FENCE_RE = /^```(?:yaml|yml)\s*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm;
class AutoProgramValidationError extends Error {
    constructor(filePath, issues) {
        super(formatAutoProgramIssues(issues, filePath));
        this.name = "AutoProgramValidationError";
        this.filePath = filePath;
        this.issues = issues;
    }
}
exports.AutoProgramValidationError = AutoProgramValidationError;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function makeIssue(code, fieldPath, message, severity = "error") {
    return {
        severity,
        code,
        fieldPath,
        message,
    };
}
function requiresNumericValue(key) {
    const normalizedKey = key.toLowerCase();
    return (normalizedKey.includes("ratio") ||
        normalizedKey.includes("threshold") ||
        normalizedKey.endsWith("ceiling") ||
        normalizedKey.endsWith("timeout_ms") ||
        normalizedKey.endsWith("max_tokens"));
}
function validateNumericLeaves(value, fieldPath, issues) {
    if (Array.isArray(value)) {
        for (const [index, item] of value.entries()) {
            validateNumericLeaves(item, `${fieldPath}[${index}]`, issues);
        }
        return;
    }
    if (isRecord(value)) {
        for (const [key, child] of Object.entries(value)) {
            const childPath = fieldPath === "$" ? key : `${fieldPath}.${key}`;
            validateNumericLeaves(child, childPath, issues);
        }
        return;
    }
    const lastSegment = fieldPath.split(".").at(-1) ?? fieldPath;
    if (requiresNumericValue(lastSegment) && !isFiniteNumber(value)) {
        issues.push(makeIssue("NON_NUMERIC_FIELD", fieldPath, "Ratio, threshold, and ceiling fields must use numeric machine-readable values."));
    }
}
function validateUtilityWeights(utility, issues) {
    const weights = utility.weights;
    if (weights === undefined) {
        return;
    }
    if (!isRecord(weights)) {
        issues.push(makeIssue("INVALID_UTILITY_WEIGHTS", "utility.weights", "utility.weights must be an object of numeric weights."));
        return;
    }
    for (const [key, value] of Object.entries(weights)) {
        if (!isFiniteNumber(value)) {
            issues.push(makeIssue("NON_NUMERIC_WEIGHT", `utility.weights.${key}`, "Utility weight values must be finite numbers."));
        }
    }
}
class AutoProgramYamlParseError extends Error {
    constructor(lineNumber, message) {
        super(`line ${lineNumber}: ${message}`);
        this.name = "AutoProgramYamlParseError";
        this.lineNumber = lineNumber;
    }
}
function parseYamlScalar(value, lineNumber) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return "";
    }
    if ((trimmed.startsWith('"') && !trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && !trimmed.endsWith("'"))) {
        throw new AutoProgramYamlParseError(lineNumber, "unterminated quoted scalar");
    }
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    if (trimmed === "true")
        return true;
    if (trimmed === "false")
        return false;
    if (trimmed === "null")
        return null;
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        throw new AutoProgramYamlParseError(lineNumber, "inline collections are not supported in evalgate auto program YAML");
    }
    return trimmed;
}
function normalizeYamlLines(yaml) {
    const parsedLines = [];
    for (const [index, rawLine] of yaml
        .replace(/\r/g, "")
        .split("\n")
        .entries()) {
        if (/^\s*#/.test(rawLine) || rawLine.trim().length === 0) {
            continue;
        }
        const indentMatch = rawLine.match(/^(\s*)/);
        const indentText = indentMatch?.[1] ?? "";
        if (indentText.includes("\t")) {
            throw new AutoProgramYamlParseError(index + 1, "tabs are not allowed for indentation");
        }
        parsedLines.push({
            indent: indentText.length,
            lineNumber: index + 1,
            text: rawLine.slice(indentText.length),
        });
    }
    return parsedLines;
}
function parseYamlBlock(lines, startIndex, indent) {
    if (startIndex >= lines.length) {
        return { nextIndex: startIndex, value: {} };
    }
    const firstLine = lines[startIndex];
    if (firstLine.indent !== indent) {
        throw new AutoProgramYamlParseError(firstLine.lineNumber, `unexpected indentation; expected ${indent} spaces and found ${firstLine.indent}`);
    }
    if (firstLine.text.startsWith("-")) {
        const values = [];
        let index = startIndex;
        while (index < lines.length) {
            const line = lines[index];
            if (line.indent < indent) {
                break;
            }
            if (line.indent > indent) {
                throw new AutoProgramYamlParseError(line.lineNumber, `unexpected indentation inside sequence; expected ${indent} spaces and found ${line.indent}`);
            }
            if (!line.text.startsWith("-")) {
                break;
            }
            const remainder = line.text.slice(1).trim();
            if (remainder.length > 0) {
                values.push(parseYamlScalar(remainder, line.lineNumber));
                index += 1;
                continue;
            }
            const nextLine = lines[index + 1];
            if (!nextLine || nextLine.indent <= indent) {
                values.push("");
                index += 1;
                continue;
            }
            const nested = parseYamlBlock(lines, index + 1, nextLine.indent);
            values.push(nested.value);
            index = nested.nextIndex;
        }
        return { nextIndex: index, value: values };
    }
    const record = {};
    let index = startIndex;
    while (index < lines.length) {
        const line = lines[index];
        if (line.indent < indent) {
            break;
        }
        if (line.indent > indent) {
            throw new AutoProgramYamlParseError(line.lineNumber, `unexpected indentation inside mapping; expected ${indent} spaces and found ${line.indent}`);
        }
        if (line.text.startsWith("-")) {
            throw new AutoProgramYamlParseError(line.lineNumber, "sequence item found where mapping entry was expected");
        }
        const separatorIndex = line.text.indexOf(":");
        if (separatorIndex <= 0) {
            throw new AutoProgramYamlParseError(line.lineNumber, "mapping entries must use 'key: value' syntax");
        }
        const key = line.text.slice(0, separatorIndex).trim();
        const remainder = line.text.slice(separatorIndex + 1).trim();
        if (record[key] !== undefined) {
            throw new AutoProgramYamlParseError(line.lineNumber, `duplicate key '${key}' is not allowed`);
        }
        if (remainder.length > 0) {
            record[key] = parseYamlScalar(remainder, line.lineNumber);
            index += 1;
            continue;
        }
        const nextLine = lines[index + 1];
        if (!nextLine || nextLine.indent <= indent) {
            record[key] = {};
            index += 1;
            continue;
        }
        const nested = parseYamlBlock(lines, index + 1, nextLine.indent);
        record[key] = nested.value;
        index = nested.nextIndex;
    }
    return { nextIndex: index, value: record };
}
function parseAutoProgramYaml(yaml) {
    try {
        const lines = normalizeYamlLines(yaml);
        if (lines.length === 0) {
            return {
                issues: [makeIssue("EMPTY_YAML_BLOCK", "$", "YAML block is empty.")],
                value: null,
            };
        }
        const parsed = parseYamlBlock(lines, 0, lines[0].indent);
        if (parsed.nextIndex !== lines.length) {
            const nextLine = lines[parsed.nextIndex];
            throw new AutoProgramYamlParseError(nextLine.lineNumber, "unexpected trailing content");
        }
        return {
            issues: [],
            value: parsed.value,
        };
    }
    catch (error) {
        return {
            issues: [
                makeIssue("YAML_PARSE_ERROR", "$", error instanceof Error ? error.message : String(error)),
            ],
            value: null,
        };
    }
}
function resolveAutoProgramPath(projectRoot = process.cwd()) {
    return path.join(projectRoot, exports.AUTO_PROGRAM_RELATIVE_PATH);
}
function extractAutoProgramYamlBlock(markdown) {
    const matches = [...markdown.matchAll(YAML_FENCE_RE)];
    if (matches.length === 0) {
        return {
            yaml: null,
            issues: [
                makeIssue("MISSING_YAML_BLOCK", "$", "Expected exactly one fenced ```yaml``` block in the auto program markdown."),
            ],
        };
    }
    if (matches.length > 1) {
        return {
            yaml: null,
            issues: [
                makeIssue("MULTIPLE_YAML_BLOCKS", "$", "Expected exactly one fenced ```yaml``` block in the auto program markdown."),
            ],
        };
    }
    return {
        yaml: matches[0]?.[1] ?? null,
        issues: [],
    };
}
function validateAutoProgram(programValue, options = {}) {
    const issues = [];
    const strictTopLevel = options.strictTopLevel ?? true;
    if (!isRecord(programValue)) {
        issues.push(makeIssue("INVALID_PROGRAM_ROOT", "$", "The YAML block must parse to a top-level mapping/object."));
        return { program: null, issues, passed: false };
    }
    for (const section of exports.REQUIRED_AUTO_PROGRAM_SECTIONS) {
        const value = programValue[section];
        if (value === undefined) {
            issues.push(makeIssue("MISSING_SECTION", section, `Missing required top-level section '${section}'.`));
            continue;
        }
        if (!isRecord(value)) {
            issues.push(makeIssue("INVALID_SECTION_TYPE", section, `Top-level section '${section}' must be an object.`));
        }
    }
    for (const key of Object.keys(programValue)) {
        if (!exports.ALLOWED_AUTO_PROGRAM_SECTIONS.includes(key)) {
            issues.push(makeIssue("UNKNOWN_TOP_LEVEL_SECTION", key, `Unknown top-level section '${key}'.`, strictTopLevel ? "error" : "warn"));
        }
    }
    const mutationValue = programValue.mutation;
    if (isRecord(mutationValue)) {
        if (Array.isArray(mutationValue.target)) {
            issues.push(makeIssue("INVALID_MUTATION_TARGET", "mutation.target", "mutation.target must be exactly one path string, not an array."));
        }
        else if (typeof mutationValue.target !== "string" ||
            mutationValue.target.trim().length === 0) {
            issues.push(makeIssue("INVALID_MUTATION_TARGET", "mutation.target", "mutation.target must be a non-empty string path."));
        }
        const allowedFamilies = mutationValue.allowed_families;
        if (!Array.isArray(allowedFamilies) || allowedFamilies.length === 0) {
            issues.push(makeIssue("INVALID_ALLOWED_FAMILIES", "mutation.allowed_families", "mutation.allowed_families must be a non-empty array of strings."));
        }
        else if (allowedFamilies.some((entry) => typeof entry !== "string" || entry.trim().length === 0)) {
            issues.push(makeIssue("INVALID_ALLOWED_FAMILIES", "mutation.allowed_families", "mutation.allowed_families must only contain non-empty strings."));
        }
        else {
            for (const familyId of allowedFamilies) {
                if (!(0, auto_families_1.getMutationFamily)(familyId)) {
                    issues.push(makeIssue("UNKNOWN_MUTATION_FAMILY", "mutation.allowed_families", `mutation.allowed_families contains unknown family '${familyId}'.`));
                }
            }
        }
    }
    const adaptiveLoop = programValue.adaptive_loop;
    if (adaptiveLoop !== undefined && !isRecord(adaptiveLoop)) {
        issues.push(makeIssue("INVALID_SECTION_TYPE", "adaptive_loop", "Top-level section 'adaptive_loop' must be an object."));
    }
    const daemon = programValue.daemon;
    if (daemon !== undefined && !isRecord(daemon)) {
        issues.push(makeIssue("INVALID_SECTION_TYPE", "daemon", "Top-level section 'daemon' must be an object."));
    }
    validateNumericLeaves(programValue, "$", issues);
    if (isRecord(programValue.utility)) {
        validateUtilityWeights(programValue.utility, issues);
    }
    const passed = issues.every((issue) => issue.severity !== "error");
    return {
        program: passed ? programValue : null,
        issues,
        passed,
    };
}
function parseAutoProgramMarkdown(markdown, options = {}) {
    const filePath = options.filePath ?? resolveAutoProgramPath();
    const blockResult = extractAutoProgramYamlBlock(markdown);
    if (!blockResult.yaml) {
        return {
            filePath,
            markdown,
            yaml: null,
            program: null,
            issues: blockResult.issues,
            passed: false,
        };
    }
    const parsedYaml = parseAutoProgramYaml(blockResult.yaml);
    const issues = [...blockResult.issues, ...parsedYaml.issues];
    if (!parsedYaml.value) {
        return {
            filePath,
            markdown,
            yaml: blockResult.yaml,
            program: null,
            issues,
            passed: false,
        };
    }
    const validation = validateAutoProgram(parsedYaml.value, options);
    return {
        filePath,
        markdown,
        yaml: blockResult.yaml,
        program: validation.program,
        issues: [...issues, ...validation.issues],
        passed: issues.every((issue) => issue.severity !== "error") && validation.passed,
    };
}
function readAutoProgram(programPath = resolveAutoProgramPath(), options = {}) {
    let markdown = "";
    try {
        markdown = fs.readFileSync(programPath, "utf8");
    }
    catch (error) {
        return {
            filePath: programPath,
            markdown,
            yaml: null,
            program: null,
            issues: [
                makeIssue("PROGRAM_READ_ERROR", "$", `Unable to read auto program file: ${error instanceof Error ? error.message : String(error)}`),
            ],
            passed: false,
        };
    }
    return parseAutoProgramMarkdown(markdown, {
        ...options,
        filePath: programPath,
    });
}
function loadAutoProgramOrThrow(programPath = resolveAutoProgramPath(), options = {}) {
    const result = readAutoProgram(programPath, options);
    if (!result.passed || !result.program) {
        throw new AutoProgramValidationError(programPath, result.issues);
    }
    return result.program;
}
function formatAutoProgramIssues(issues, filePath) {
    const heading = filePath
        ? `EvalGate auto program validation failed for ${filePath}`
        : "EvalGate auto program validation failed";
    return [
        heading,
        ...issues.map((issue) => `- [${issue.severity.toUpperCase()}] ${issue.fieldPath} (${issue.code}) ${issue.message}`),
    ].join("\n");
}
