/**
 * evalai share — Create a share link for a run.
 * Usage: evalai share --scope run --expires 7d
 */
export type ShareArgs = {
    baseUrl: string;
    apiKey: string;
    evaluationId: string;
    runId: number;
    scope: "run";
    expires: string;
    expiresInDays: number;
};
export declare function parseShareArgs(argv: string[]): ShareArgs | {
    error: string;
};
export declare function runShare(args: ShareArgs): Promise<number>;
