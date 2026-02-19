#!/usr/bin/env npx tsx
/**
 * Demo Assets Audit
 *
 * Verifies docs/images/evalai-gate-fail.png and evalai-gate-pass.png exist and
 * are non-empty. docs/demo.md references these; CI fails if they're missing.
 *
 * Run: pnpm audit:demo-assets
 */

import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const DEMO_MD = path.resolve(process.cwd(), "docs/demo.md");
const IMAGES_DIR = path.resolve(process.cwd(), "docs/images");
const REQUIRED = ["evalai-gate-fail.png", "evalai-gate-pass.png"];

function main(): number {
  // Check demo.md references these images
  let demoContent: string;
  try {
    demoContent = readFileSync(DEMO_MD, "utf-8");
  } catch {
    console.error("audit:demo-assets — docs/demo.md not found");
    return 1;
  }

  // Only require images that demo.md references
  const toCheck = REQUIRED.filter((f) => demoContent.includes(f));
  if (toCheck.length === 0) return 0;

  const missing: string[] = [];
  const empty: string[] = [];

  for (const file of toCheck) {
    const filePath = path.join(IMAGES_DIR, file);
    try {
      const st = statSync(filePath);
      if (!st.isFile()) {
        missing.push(file);
      } else if (st.size === 0) {
        empty.push(file);
      }
    } catch {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error("audit:demo-assets — Missing required images (docs/demo.md references them):");
    missing.forEach((f) => console.error(`  - docs/images/${f}`));
    console.error("Add screenshots to docs/images/ (see docs/demo.md for instructions)");
    return 1;
  }

  if (empty.length > 0) {
    console.error("audit:demo-assets — Empty image files:");
    empty.forEach((f) => console.error(`  - docs/images/${f}`));
    return 1;
  }

  return 0;
}

process.exit(main());
