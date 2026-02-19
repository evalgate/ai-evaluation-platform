#!/usr/bin/env npx tsx
/**
 * Single source of truth for API spec version.
 * Updates docs/openapi.json info.version and src/packages/sdk/src/version.ts SPEC_VERSION.
 * Run openapi:snapshot after to update the hash.
 *
 * Usage: pnpm version:spec 1.1.0
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OPENAPI_JSON = path.resolve(process.cwd(), "docs/openapi.json");
const SDK_VERSION_FILE = path.resolve(process.cwd(), "src/packages/sdk/src/version.ts");

const SEMVER = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;

function main(): number {
  const version = process.argv[2];
  if (!version || !SEMVER.test(version)) {
    console.error("Usage: pnpm version:spec X.Y.Z");
    console.error("Example: pnpm version:spec 1.1.0");
    return 1;
  }

  // Update docs/openapi.json
  const openApi = JSON.parse(readFileSync(OPENAPI_JSON, "utf-8"));
  openApi.info = openApi.info ?? {};
  openApi.info.version = version;
  writeFileSync(OPENAPI_JSON, `${JSON.stringify(openApi, null, 2)}\n`);
  console.log(`Updated docs/openapi.json info.version → ${version}`);

  // Update src/packages/sdk/src/version.ts SPEC_VERSION
  let sdkContent = readFileSync(SDK_VERSION_FILE, "utf-8");
  sdkContent = sdkContent.replace(
    /SPEC_VERSION\s*=\s*["'][^"']+["']/,
    `SPEC_VERSION = "${version}"`,
  );
  writeFileSync(SDK_VERSION_FILE, sdkContent);
  console.log(`Updated src/packages/sdk/src/version.ts SPEC_VERSION → ${version}`);

  console.log("\nNext: pnpm openapi:snapshot");
  return 0;
}

process.exit(main());
