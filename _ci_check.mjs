import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pkg = require("./src/packages/sdk/package.json");
const versionSrc = readFileSync("src/packages/sdk/src/version.ts", "utf8");
const srcV = versionSrc.match(/SDK_VERSION\s*=\s*"([^"]+)"/)[1];
const pkgV = pkg.version;
let ok = true;

function check(label, pass) {
  console.log((pass ? "✓" : "✗"), label);
  if (!pass) ok = false;
}

check(`pkg/version.ts match (${pkgV})`, pkgV === srcV);

const manifest = readFileSync("src/packages/sdk/src/cli/manifest.ts", "utf8");
check("manifest no hardcoded SDK_VERSION", !/SDK_VERSION\s*=\s*"/.test(manifest));
check("manifest imports from ../version", /from\s*["']\.\.\/version["']/.test(manifest));

const stability = readFileSync("docs/stability.md", "utf8");
check(`stability.md references v${pkgV}`, stability.includes(`v${pkgV}`));

const changelog = readFileSync("CHANGELOG.md", "utf8");
check(`CHANGELOG.md has [${pkgV}]`, changelog.includes(`[${pkgV}]`));

const sdkChangelog = readFileSync("src/packages/sdk/CHANGELOG.md", "utf8");
check(`sdk/CHANGELOG.md has [${pkgV}]`, sdkChangelog.includes(`[${pkgV}]`));

const openapiHash = JSON.parse(readFileSync("scripts/.openapi-spec-hash.json", "utf8"));
check(`openapi hash version is ${pkgV}`, openapiHash.version === pkgV);

if (!ok) process.exit(1);
console.log("\nAll consistency checks passed.");
