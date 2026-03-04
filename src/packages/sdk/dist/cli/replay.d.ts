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
export interface ReplayArgs {
    candidateId?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    format?: "human" | "json";
}
export declare function parseReplayArgs(args: string[]): ReplayArgs;
export declare function runReplay(args: string[]): Promise<number>;
