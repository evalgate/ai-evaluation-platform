#!/usr/bin/env npx tsx
/**
 * Extract changelog snippet for a given version from SDK CHANGELOG.md.
 * Exits 1 with clear message if version header missing or duplicated.
 *
 * Usage: npx tsx scripts/release-changelog-snippet.ts 1.5.0
 * Output: snippet to stdout (or error to stderr, exit 1)
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const CHANGELOG = path.resolve(process.cwd(), "src/packages/sdk/CHANGELOG.md");

function main(): number {
  const version = process.argv[2];
  if (!version) {
    console.error("Usage: npx tsx scripts/release-changelog-snippet.ts X.Y.Z");
    return 1;
  }

  let content: string;
  try {
    content = readFileSync(CHANGELOG, "utf-8");
  } catch {
    console.error(`Release failed: ${CHANGELOG} not found`);
    return 1;
  }

  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headerPattern = new RegExp(`^## \\[${escaped}\\](?: - .*)?$`, "m");
  const matches = content.match(new RegExp(headerPattern.source, "gm"));

  if (!matches || matches.length === 0) {
    console.error(
      `Release failed: version [${version}] not found in src/packages/sdk/CHANGELOG.md`,
    );
    console.error(`Add a ## [${version}] section before releasing.`);
    return 1;
  }

  if (matches.length > 1) {
    console.error(
      `Release failed: version [${version}] appears ${matches.length} times in src/packages/sdk/CHANGELOG.md`,
    );
    console.error("Changelog must have exactly one header per version.");
    return 1;
  }

  // Extract content between this ## [version] and the next ## [
  const lines = content.split(/\r?\n/);
  let inSection = false;
  const snippetLines: string[] = [];
  const sectionStart = new RegExp(`^## \\[${escaped}\\](?: - .*)?$`);

  for (const line of lines) {
    if (sectionStart.test(line.trim())) {
      if (inSection) break;
      inSection = true;
      continue;
    }
    if (inSection && /^## \[/.test(line)) break;
    if (inSection) snippetLines.push(line);
  }

  const snippet = snippetLines.join("\n").trim();
  if (!snippet) {
    console.error(`Release failed: changelog section for [${version}] is empty`);
    return 1;
  }

  console.log(snippet.slice(0, 2000)); // Reasonable limit
  return 0;
}

process.exit(main());
