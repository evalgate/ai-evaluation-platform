export interface AutoDaemonOptions {
    cycles: number;
    intervalMs: number;
    format: "human" | "json";
    cycleArgs: string[];
}
export declare function runAutoInit(args: string[]): number;
export declare function runAutoRun(args: string[]): Promise<number>;
export declare function runAutoDaemon(args: string[]): Promise<number>;
export declare function runAutoHistory(args: string[]): number;
