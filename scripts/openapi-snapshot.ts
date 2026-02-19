#!/usr/bin/env npx tsx
/**
 * OpenAPI Spec Snapshot
 *
 * Updates scripts/.openapi-spec-hash.json with the current spec hash and version.
 * Run after changing docs/openapi.json (and bumping info.version).
 *
 * Run: pnpm openapi:snapshot
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OPENAPI_JSON = path.resolve(process.cwd(), "docs/openapi.json");
const HASH_FILE = path.resolve(process.cwd(), "scripts/.openapi-spec-hash.json");
const SDK_VERSION_FILE = path.resolve(process.cwd(), "src/packages/sdk/src/version.ts");

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
  const version = openApi?.info?.version ?? "1.0.0";
  const currentHash = stableHash(openApi);

  // Verify SDK SPEC_VERSION matches
  const sdkVersionContent = readFileSync(SDK_VERSION_FILE, "utf-8");
  const specMatch = sdkVersionContent.match(/SPEC_VERSION\s*=\s*["']([^"']+)["']/);
  const sdkSpecVersion = specMatch?.[1];
  if (sdkSpecVersion && sdkSpecVersion !== version) {
    console.warn(
      `Warning: docs/openapi.json info.version (${version}) != SDK SPEC_VERSION (${sdkSpecVersion})`,
    );
    console.warn("Update src/packages/sdk/src/version.ts to match.");
  }

  const payload = { hash: currentHash, version };
  writeFileSync(HASH_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Updated ${HASH_FILE} (version: ${version}, hash: ${currentHash})`);
  return 0;
}

process.exit(main());
