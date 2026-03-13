import * as fs from "node:fs";
import * as path from "node:path";

import { getMutationFamily } from "./auto-families";

export const AUTO_PROGRAM_RELATIVE_PATH = path.join(
	".evalgate",
	"auto",
	"program.md",
);

export const REQUIRED_AUTO_PROGRAM_SECTIONS = [
	"objective",
	"mutation",
	"budget",
	"utility",
	"hard_vetoes",
	"promotion",
	"holdout",
	"stop_conditions",
] as const;

export const ALLOWED_AUTO_PROGRAM_SECTIONS = [
	...REQUIRED_AUTO_PROGRAM_SECTIONS,
	"adaptive_loop",
	"daemon",
] as const;

const YAML_FENCE_RE = /^```(?:yaml|yml)\s*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm;

export interface AutoProgramIssue {
	severity: "error" | "warn";
	code: string;
	fieldPath: string;
	message: string;
}

export interface AutoProgramMutation extends Record<string, unknown> {
	target: string;
	allowed_families: string[];
}

export interface AutoProgramAdaptiveLoopLLM extends Record<string, unknown> {
	provider?: string;
	api_key_env?: string;
	model?: string;
	base_url?: string;
	timeout_ms?: number;
	max_tokens?: number;
}

export interface AutoProgramAdaptiveLoop extends Record<string, unknown> {
	cluster_resolved_threshold?: number;
	family_retry_after_iterations?: number;
	recent_reflections_limit?: number;
	reflection?: AutoProgramAdaptiveLoopLLM;
	planner?: AutoProgramAdaptiveLoopLLM;
}

export interface AutoProgramDaemon extends Record<string, unknown> {
	enabled?: boolean;
	interval_seconds?: number;
	max_experiments_per_cycle?: number;
	pr_on_win?: boolean;
	min_utility_for_pr?: number;
}

export interface AutoProgram extends Record<string, unknown> {
	objective: Record<string, unknown>;
	mutation: AutoProgramMutation;
	budget: Record<string, unknown>;
	utility: Record<string, unknown>;
	hard_vetoes: Record<string, unknown>;
	promotion: Record<string, unknown>;
	holdout: Record<string, unknown>;
	stop_conditions: Record<string, unknown>;
	adaptive_loop?: AutoProgramAdaptiveLoop;
	daemon?: AutoProgramDaemon;
}

export interface ExtractYamlBlockResult {
	yaml: string | null;
	issues: AutoProgramIssue[];
}

export interface AutoProgramParseOptions {
	strictTopLevel?: boolean;
	filePath?: string;
}

export interface AutoProgramParseResult {
	filePath: string;
	markdown: string;
	yaml: string | null;
	program: AutoProgram | null;
	issues: AutoProgramIssue[];
	passed: boolean;
}

export class AutoProgramValidationError extends Error {
	readonly issues: AutoProgramIssue[];
	readonly filePath: string;

	constructor(filePath: string, issues: AutoProgramIssue[]) {
		super(formatAutoProgramIssues(issues, filePath));
		this.name = "AutoProgramValidationError";
		this.filePath = filePath;
		this.issues = issues;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function makeIssue(
	code: string,
	fieldPath: string,
	message: string,
	severity: AutoProgramIssue["severity"] = "error",
): AutoProgramIssue {
	return {
		severity,
		code,
		fieldPath,
		message,
	};
}

function requiresNumericValue(key: string): boolean {
	const normalizedKey = key.toLowerCase();
	return (
		normalizedKey.includes("ratio") ||
		normalizedKey.includes("threshold") ||
		normalizedKey.endsWith("ceiling") ||
		normalizedKey.endsWith("timeout_ms") ||
		normalizedKey.endsWith("max_tokens")
	);
}

function validateNumericLeaves(
	value: unknown,
	fieldPath: string,
	issues: AutoProgramIssue[],
): void {
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
		issues.push(
			makeIssue(
				"NON_NUMERIC_FIELD",
				fieldPath,
				"Ratio, threshold, and ceiling fields must use numeric machine-readable values.",
			),
		);
	}
}

function validateUtilityWeights(
	utility: Record<string, unknown>,
	issues: AutoProgramIssue[],
): void {
	const weights = utility.weights;
	if (weights === undefined) {
		return;
	}

	if (!isRecord(weights)) {
		issues.push(
			makeIssue(
				"INVALID_UTILITY_WEIGHTS",
				"utility.weights",
				"utility.weights must be an object of numeric weights.",
			),
		);
		return;
	}

	for (const [key, value] of Object.entries(weights)) {
		if (!isFiniteNumber(value)) {
			issues.push(
				makeIssue(
					"NON_NUMERIC_WEIGHT",
					`utility.weights.${key}`,
					"Utility weight values must be finite numbers.",
				),
			);
		}
	}
}

interface ParsedYamlLine {
	indent: number;
	lineNumber: number;
	text: string;
}

class AutoProgramYamlParseError extends Error {
	readonly lineNumber: number;

	constructor(lineNumber: number, message: string) {
		super(`line ${lineNumber}: ${message}`);
		this.name = "AutoProgramYamlParseError";
		this.lineNumber = lineNumber;
	}
}

function parseYamlScalar(value: string, lineNumber: number): unknown {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return "";
	}
	if (
		(trimmed.startsWith('"') && !trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && !trimmed.endsWith("'"))
	) {
		throw new AutoProgramYamlParseError(
			lineNumber,
			"unterminated quoted scalar",
		);
	}
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed === "null") return null;
	if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
		return Number(trimmed);
	}
	if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
		throw new AutoProgramYamlParseError(
			lineNumber,
			"inline collections are not supported in evalgate auto program YAML",
		);
	}
	return trimmed;
}

function normalizeYamlLines(yaml: string): ParsedYamlLine[] {
	const parsedLines: ParsedYamlLine[] = [];
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
			throw new AutoProgramYamlParseError(
				index + 1,
				"tabs are not allowed for indentation",
			);
		}
		parsedLines.push({
			indent: indentText.length,
			lineNumber: index + 1,
			text: rawLine.slice(indentText.length),
		});
	}
	return parsedLines;
}

function parseYamlBlock(
	lines: ParsedYamlLine[],
	startIndex: number,
	indent: number,
): {
	nextIndex: number;
	value: unknown;
} {
	if (startIndex >= lines.length) {
		return { nextIndex: startIndex, value: {} };
	}

	const firstLine = lines[startIndex];
	if (firstLine.indent !== indent) {
		throw new AutoProgramYamlParseError(
			firstLine.lineNumber,
			`unexpected indentation; expected ${indent} spaces and found ${firstLine.indent}`,
		);
	}

	if (firstLine.text.startsWith("-")) {
		const values: unknown[] = [];
		let index = startIndex;
		while (index < lines.length) {
			const line = lines[index];
			if (line.indent < indent) {
				break;
			}
			if (line.indent > indent) {
				throw new AutoProgramYamlParseError(
					line.lineNumber,
					`unexpected indentation inside sequence; expected ${indent} spaces and found ${line.indent}`,
				);
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

	const record: Record<string, unknown> = {};
	let index = startIndex;
	while (index < lines.length) {
		const line = lines[index];
		if (line.indent < indent) {
			break;
		}
		if (line.indent > indent) {
			throw new AutoProgramYamlParseError(
				line.lineNumber,
				`unexpected indentation inside mapping; expected ${indent} spaces and found ${line.indent}`,
			);
		}
		if (line.text.startsWith("-")) {
			throw new AutoProgramYamlParseError(
				line.lineNumber,
				"sequence item found where mapping entry was expected",
			);
		}
		const separatorIndex = line.text.indexOf(":");
		if (separatorIndex <= 0) {
			throw new AutoProgramYamlParseError(
				line.lineNumber,
				"mapping entries must use 'key: value' syntax",
			);
		}
		const key = line.text.slice(0, separatorIndex).trim();
		const remainder = line.text.slice(separatorIndex + 1).trim();
		if (record[key] !== undefined) {
			throw new AutoProgramYamlParseError(
				line.lineNumber,
				`duplicate key '${key}' is not allowed`,
			);
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

function parseAutoProgramYaml(yaml: string): {
	issues: AutoProgramIssue[];
	value: unknown | null;
} {
	try {
		const lines = normalizeYamlLines(yaml);
		if (lines.length === 0) {
			return {
				issues: [makeIssue("EMPTY_YAML_BLOCK", "$", "YAML block is empty.")],
				value: null,
			};
		}
		const parsed = parseYamlBlock(lines, 0, lines[0]!.indent);
		if (parsed.nextIndex !== lines.length) {
			const nextLine = lines[parsed.nextIndex]!;
			throw new AutoProgramYamlParseError(
				nextLine.lineNumber,
				"unexpected trailing content",
			);
		}
		return {
			issues: [],
			value: parsed.value,
		};
	} catch (error) {
		return {
			issues: [
				makeIssue(
					"YAML_PARSE_ERROR",
					"$",
					error instanceof Error ? error.message : String(error),
				),
			],
			value: null,
		};
	}
}

export function resolveAutoProgramPath(
	projectRoot: string = process.cwd(),
): string {
	return path.join(projectRoot, AUTO_PROGRAM_RELATIVE_PATH);
}

export function extractAutoProgramYamlBlock(
	markdown: string,
): ExtractYamlBlockResult {
	const matches = [...markdown.matchAll(YAML_FENCE_RE)];
	if (matches.length === 0) {
		return {
			yaml: null,
			issues: [
				makeIssue(
					"MISSING_YAML_BLOCK",
					"$",
					"Expected exactly one fenced ```yaml``` block in the auto program markdown.",
				),
			],
		};
	}
	if (matches.length > 1) {
		return {
			yaml: null,
			issues: [
				makeIssue(
					"MULTIPLE_YAML_BLOCKS",
					"$",
					"Expected exactly one fenced ```yaml``` block in the auto program markdown.",
				),
			],
		};
	}
	return {
		yaml: matches[0]?.[1] ?? null,
		issues: [],
	};
}

export function validateAutoProgram(
	programValue: unknown,
	options: AutoProgramParseOptions = {},
): {
	program: AutoProgram | null;
	issues: AutoProgramIssue[];
	passed: boolean;
} {
	const issues: AutoProgramIssue[] = [];
	const strictTopLevel = options.strictTopLevel ?? true;

	if (!isRecord(programValue)) {
		issues.push(
			makeIssue(
				"INVALID_PROGRAM_ROOT",
				"$",
				"The YAML block must parse to a top-level mapping/object.",
			),
		);
		return { program: null, issues, passed: false };
	}

	for (const section of REQUIRED_AUTO_PROGRAM_SECTIONS) {
		const value = programValue[section];
		if (value === undefined) {
			issues.push(
				makeIssue(
					"MISSING_SECTION",
					section,
					`Missing required top-level section '${section}'.`,
				),
			);
			continue;
		}
		if (!isRecord(value)) {
			issues.push(
				makeIssue(
					"INVALID_SECTION_TYPE",
					section,
					`Top-level section '${section}' must be an object.`,
				),
			);
		}
	}

	for (const key of Object.keys(programValue)) {
		if (!(ALLOWED_AUTO_PROGRAM_SECTIONS as readonly string[]).includes(key)) {
			issues.push(
				makeIssue(
					"UNKNOWN_TOP_LEVEL_SECTION",
					key,
					`Unknown top-level section '${key}'.`,
					strictTopLevel ? "error" : "warn",
				),
			);
		}
	}

	const mutationValue = programValue.mutation;
	if (isRecord(mutationValue)) {
		if (Array.isArray(mutationValue.target)) {
			issues.push(
				makeIssue(
					"INVALID_MUTATION_TARGET",
					"mutation.target",
					"mutation.target must be exactly one path string, not an array.",
				),
			);
		} else if (
			typeof mutationValue.target !== "string" ||
			mutationValue.target.trim().length === 0
		) {
			issues.push(
				makeIssue(
					"INVALID_MUTATION_TARGET",
					"mutation.target",
					"mutation.target must be a non-empty string path.",
				),
			);
		}

		const allowedFamilies = mutationValue.allowed_families;
		if (!Array.isArray(allowedFamilies) || allowedFamilies.length === 0) {
			issues.push(
				makeIssue(
					"INVALID_ALLOWED_FAMILIES",
					"mutation.allowed_families",
					"mutation.allowed_families must be a non-empty array of strings.",
				),
			);
		} else if (
			allowedFamilies.some(
				(entry) => typeof entry !== "string" || entry.trim().length === 0,
			)
		) {
			issues.push(
				makeIssue(
					"INVALID_ALLOWED_FAMILIES",
					"mutation.allowed_families",
					"mutation.allowed_families must only contain non-empty strings.",
				),
			);
		} else {
			for (const familyId of allowedFamilies) {
				if (!getMutationFamily(familyId)) {
					issues.push(
						makeIssue(
							"UNKNOWN_MUTATION_FAMILY",
							"mutation.allowed_families",
							`mutation.allowed_families contains unknown family '${familyId}'.`,
						),
					);
				}
			}
		}
	}

	const adaptiveLoop = programValue.adaptive_loop;
	if (adaptiveLoop !== undefined && !isRecord(adaptiveLoop)) {
		issues.push(
			makeIssue(
				"INVALID_SECTION_TYPE",
				"adaptive_loop",
				"Top-level section 'adaptive_loop' must be an object.",
			),
		);
	}

	const daemon = programValue.daemon;
	if (daemon !== undefined && !isRecord(daemon)) {
		issues.push(
			makeIssue(
				"INVALID_SECTION_TYPE",
				"daemon",
				"Top-level section 'daemon' must be an object.",
			),
		);
	}

	validateNumericLeaves(programValue, "$", issues);
	if (isRecord(programValue.utility)) {
		validateUtilityWeights(programValue.utility, issues);
	}

	const passed = issues.every((issue) => issue.severity !== "error");
	return {
		program: passed ? (programValue as AutoProgram) : null,
		issues,
		passed,
	};
}

export function parseAutoProgramMarkdown(
	markdown: string,
	options: AutoProgramParseOptions = {},
): AutoProgramParseResult {
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
		passed:
			issues.every((issue) => issue.severity !== "error") && validation.passed,
	};
}

export function readAutoProgram(
	programPath: string = resolveAutoProgramPath(),
	options: Omit<AutoProgramParseOptions, "filePath"> = {},
): AutoProgramParseResult {
	let markdown = "";
	try {
		markdown = fs.readFileSync(programPath, "utf8");
	} catch (error) {
		return {
			filePath: programPath,
			markdown,
			yaml: null,
			program: null,
			issues: [
				makeIssue(
					"PROGRAM_READ_ERROR",
					"$",
					`Unable to read auto program file: ${error instanceof Error ? error.message : String(error)}`,
				),
			],
			passed: false,
		};
	}

	return parseAutoProgramMarkdown(markdown, {
		...options,
		filePath: programPath,
	});
}

export function loadAutoProgramOrThrow(
	programPath: string = resolveAutoProgramPath(),
	options: Omit<AutoProgramParseOptions, "filePath"> = {},
): AutoProgram {
	const result = readAutoProgram(programPath, options);
	if (!result.passed || !result.program) {
		throw new AutoProgramValidationError(programPath, result.issues);
	}
	return result.program;
}

export function formatAutoProgramIssues(
	issues: AutoProgramIssue[],
	filePath?: string,
): string {
	const heading = filePath
		? `EvalGate auto program validation failed for ${filePath}`
		: "EvalGate auto program validation failed";
	return [
		heading,
		...issues.map(
			(issue) =>
				`- [${issue.severity.toUpperCase()}] ${issue.fieldPath} (${issue.code}) ${issue.message}`,
		),
	].join("\n");
}
