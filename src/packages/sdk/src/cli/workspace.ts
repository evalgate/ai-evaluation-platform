/**
 * CORE-402: Centralized .evalai workspace resolution
 *
 * Provides unified workspace path resolution for all EvalAI CLI commands
 */

import * as path from "node:path";

/**
 * EvalAI workspace paths
 */
export interface EvalWorkspace {
  /** Project root directory */
  root: string;
  /** .evalai directory */
  evalaiDir: string;
  /** runs directory */
  runsDir: string;
  /** manifest.json path */
  manifestPath: string;
  /** last-run.json path */
  lastRunPath: string;
  /** runs/index.json path */
  indexPath: string;
  /** baseline-run.json path */
  baselinePath: string;
}

/**
 * Resolve EvalAI workspace paths
 */
export function resolveEvalWorkspace(projectRoot: string = process.cwd()): EvalWorkspace {
  const evalaiDir = path.join(projectRoot, ".evalai");
  const runsDir = path.join(evalaiDir, "runs");

  return {
    root: projectRoot,
    evalaiDir,
    runsDir,
    manifestPath: path.join(evalaiDir, "manifest.json"),
    lastRunPath: path.join(evalaiDir, "last-run.json"),
    indexPath: path.join(runsDir, "index.json"),
    baselinePath: path.join(evalaiDir, "baseline-run.json"),
  };
}
