#!/usr/bin/env npx tsx
/**
 * Create minimal placeholder PNGs for docs/demo.md.
 * Replace with real screenshots from your CI runs.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

// Minimal 1x1 transparent PNG (68 bytes)
const MINIMAL_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

const IMAGES_DIR = path.resolve(process.cwd(), "docs/images");
const FILES = ["evalai-gate-fail.png", "evalai-gate-pass.png"];

for (const f of FILES) {
	const p = path.join(IMAGES_DIR, f);
	writeFileSync(p, MINIMAL_PNG);
	console.log(`Created ${p}`);
}
