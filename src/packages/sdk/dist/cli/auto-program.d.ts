export declare const AUTO_PROGRAM_RELATIVE_PATH: string;
export declare const REQUIRED_AUTO_PROGRAM_SECTIONS: readonly ["objective", "mutation", "budget", "utility", "hard_vetoes", "promotion", "holdout", "stop_conditions"];
export declare const ALLOWED_AUTO_PROGRAM_SECTIONS: readonly ["objective", "mutation", "budget", "utility", "hard_vetoes", "promotion", "holdout", "stop_conditions", "adaptive_loop", "daemon"];
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
export declare class AutoProgramValidationError extends Error {
    readonly issues: AutoProgramIssue[];
    readonly filePath: string;
    constructor(filePath: string, issues: AutoProgramIssue[]);
}
export declare function resolveAutoProgramPath(projectRoot?: string): string;
export declare function extractAutoProgramYamlBlock(markdown: string): ExtractYamlBlockResult;
export declare function validateAutoProgram(programValue: unknown, options?: AutoProgramParseOptions): {
    program: AutoProgram | null;
    issues: AutoProgramIssue[];
    passed: boolean;
};
export declare function parseAutoProgramMarkdown(markdown: string, options?: AutoProgramParseOptions): AutoProgramParseResult;
export declare function readAutoProgram(programPath?: string, options?: Omit<AutoProgramParseOptions, "filePath">): AutoProgramParseResult;
export declare function loadAutoProgramOrThrow(programPath?: string, options?: Omit<AutoProgramParseOptions, "filePath">): AutoProgram;
export declare function formatAutoProgramIssues(issues: AutoProgramIssue[], filePath?: string): string;
