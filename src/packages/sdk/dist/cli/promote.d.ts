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
export interface PromoteArgs {
    candidateId?: string;
    auto?: boolean;
    list?: boolean;
    evaluationId?: string;
    apiKey?: string;
    baseUrl?: string;
}
export declare function parsePromoteArgs(args: string[]): PromoteArgs;
export declare function runPromote(args: string[]): Promise<number>;
