#!/usr/bin/env npx tsx
/**
 * OpenAPI Spec Hash Audit
 *
 * Ensures the OpenAPI spec has not changed without an explicit snapshot.
 * When you change docs/openapi.json (including breaking changes):
 * 1. Bump info.version in docs/openapi.json
 * 2. Sync SPEC_VERSION in src/packages/sdk/src/version.ts
 * 3. Run: pnpm openapi:snapshot
 * 4. Commit all changes
 *
 * Run: pnpm run audit:openapi (runs after coverage audit)
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const OPENAPI_JSON = path.resolve(process.cwd(), "docs/openapi.json");
const HASH_FILE = path.resolve(process.cwd(), "scripts/.openapi-spec-hash.json");
const OPENAPI_CHANGELOG = path.resolve(process.cwd(), "docs/OPENAPI_CHANGELOG.md");

function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(",")}]`;
  const keys = Object.keys(obj as object).sort();
  return (
    "{" +
    keys
      .map((k) => `${JSON.stringify(k)}:${canonicalize((obj as Record<string, unknown>)[k])}`)
      .join(",") +
    "}"
  );
}

function stableHash(obj: unknown): string {
  return createHash("sha256").update(canonicalize(obj)).digest("hex").slice(0, 16);
}

function main(): number {
  const openApi = JSON.parse(readFileSync(OPENAPI_JSON, "utf-8"));
  const currentHash = stableHash(openApi);

  let stored: { hash: string; version: string };
  try {
    stored = JSON.parse(readFileSync(HASH_FILE, "utf-8"));
  } catch {
    console.error("OpenAPI Spec Hash Audit");
    console.error("======================");
    console.error("Missing scripts/.openapi-spec-hash.json");
    console.error("Run: pnpm openapi:snapshot");
    return 1;
  }

  if (currentHash !== stored.hash) {
    console.error("OpenAPI Spec Hash Audit");
    console.error("======================");
    console.error("OpenAPI spec has changed since last snapshot.");
    console.error("If this is intentional:");
    console.error("  1. Add an entry to docs/OPENAPI_CHANGELOG.md for the new version");
    console.error(
      "  2. Run: pnpm version:spec X.Y.Z  (or bump info.version + SPEC_VERSION manually)",
    );
    console.error("  3. Run: pnpm openapi:snapshot");
    console.error("  4. Commit all changes");
    return 1;
  }

  // Require OPENAPI_CHANGELOG.md entry for the stored version
  let changelogContent: string;
  try {
    changelogContent = readFileSync(OPENAPI_CHANGELOG, "utf-8");
  } catch {
    console.error("OpenAPI Spec Hash Audit");
    console.error("======================");
    console.error("Missing docs/OPENAPI_CHANGELOG.md");
    console.error(`Create it and add an entry for version ${stored.version}`);
    return 1;
  }

  // Match ## X.Y.Z, ## [X.Y.Z], or ### X.Y.Z
  const versionPattern = new RegExp(
    `^#{2,3}\\s*(?:\\[)?${escapeRegex(stored.version)}(?:\\])?`,
    "m",
  );
  if (!versionPattern.test(changelogContent)) {
    console.error("OpenAPI Spec Hash Audit");
    console.error("======================");
    console.error(`docs/OPENAPI_CHANGELOG.md must include an entry for version ${stored.version}`);
    console.error(`Add a line like: ## ${stored.version}`);
    return 1;
  }

  // Verify info.version === SPEC_VERSION (version sync)
  const openApiVersion = openApi?.info?.version ?? "";
  const sdkVersionPath = path.resolve(process.cwd(), "src/packages/sdk/src/version.ts");
  const sdkContent = readFileSync(sdkVersionPath, "utf-8");
  const specMatch = sdkContent.match(/SPEC_VERSION\s*=\s*["']([^"']+)["']/);
  const specVersion = specMatch?.[1] ?? "";
  if (openApiVersion !== specVersion) {
    console.error("OpenAPI Spec Hash Audit");
    console.error("======================");
    console.error(
      `Version mismatch: docs/openapi.json info.version (${openApiVersion}) !== SDK SPEC_VERSION (${specVersion})`,
    );
    console.error(`Run: pnpm version:spec ${openApiVersion}`);
    return 1;
  }

  return 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

process.exit(main());
