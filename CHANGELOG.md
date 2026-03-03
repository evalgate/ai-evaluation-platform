# Changelog

Platform and SDK releases. For detailed SDK changes, see [src/packages/sdk/CHANGELOG.md](src/packages/sdk/CHANGELOG.md).

## [2.2.3] - 2026-03-03

### Fixed

- **`RequestCache` default TTL** — cache entries stored without an explicit TTL were immediately stale, causing every read to miss. Default is now `CacheTTL.MEDIUM`.
- **`EvalGateError` subclass names and prototype chain** — `ValidationError.name` surfaced as `"EvalGateError"` in stack traces; `RateLimitError.retryAfter` was not a direct property. All four subclasses now correctly set `this.name` and call `Object.setPrototypeOf` after `super()`.
- **`autoPaginate` returns a flat array** — was resolving to an unexhausted `AsyncGenerator`. Now returns `Promise<T[]>`. Streaming callers should use the new `autoPaginateGenerator` export.
- **`createEvalRuntime` config object overload** — passing `{ projectRoot }` was silently ignored. Now accepts `string | { name?, projectRoot? }`.
- **`defaultLocalExecutor` is now a callable factory** — was a pre-constructed instance; now re-exported as `createLocalExecutor` so each call site gets a fresh executor.
- **`SnapshotManager.save` crash on `undefined`/`null`** — both values now serialize to the strings `"undefined"` and `"null"` instead of throwing.
- **`compareSnapshots` loads both snapshots from disk** — the old alias passed raw content as the second argument. The new `compareSnapshots(nameA, nameB)` resolves both names from disk before diffing.
- **`AIEvalClient` default `baseUrl`** — now `https://api.evalgate.com` (was `http://localhost:3000`).
- **`importData` guards on `client.traces` / `client.evaluations`** — both accesses now use optional chaining to prevent crashes with partial or undefined clients.
- **`toContainCode` detects raw code** — raw `function`, `const`, `class`, arrow, `import`, `export`, and `return` patterns now satisfy the assertion without a fenced code block.
- **`hasReadabilityScore` unwraps `{min, max}` object** — passing `{ min: 40 }` was coerced to `NaN`, making every call return `true`.

### Added

- **`autoPaginateGenerator`** — streaming `AsyncGenerator<T[]>` alternative to `autoPaginate`.
- **`compareSnapshots(nameA, nameB, dir?)`** — named snapshot comparison that loads both sides from disk.
- **141 new regression tests** — covering all fixes in this release across `RequestCache`, error classes, pagination, snapshot handling, client config, `importData`, and assertions.
- **`upgrade --full` baseline reminder** — post-upgrade CLI warning to run `npx evalgate baseline update`.
- **OpenAI/Anthropic integration safety** — `evalClient.traces?.create` optional chaining prevents crashes on minimal client configs.

---

## [2.2.2] - 2026-03-03

### Fixed

- **8 stub assertions replaced** — `hasSentiment`, `hasNoHallucinations`, `hasFactualAccuracy` (case-insensitive), `containsLanguage` (12 languages + BCP-47), `hasValidCodeSyntax` (real bracket/brace/paren balance with string & comment awareness), `hasNoToxicity` (~80 terms, 9 categories), `hasReadabilityScore` (per-word syllable counting), `matchesSchema` (handles JSON Schema `required` array and `properties` object, not just key-presence)
- **`importData` crash** — `options` parameter now defaults to `{}` to prevent `Cannot read properties of undefined (reading 'dryRun')`
- **`compareWithSnapshot` object coercion** — both `SnapshotManager.compare` and the `compareWithSnapshot` convenience function now accept `unknown`; objects are coerced via `JSON.stringify` before comparison
- **`WorkflowTracer` constructor crash** — defensive `typeof client?.getOrganizationId === "function"` guard prevents crash when using partial/mock clients or calling without an API key

### Added

- **LLM-backed async assertion variants** — `hasSentimentAsync`, `hasNoToxicityAsync`, `containsLanguageAsync`, `hasValidCodeSyntaxAsync`, `hasFactualAccuracyAsync`, `hasNoHallucinationsAsync` — use OpenAI or Anthropic for context-aware, semantic evaluation
- **`configureAssertions(config)` / `getAssertionConfig()`** — set a global `AssertionLLMConfig` (provider, apiKey, model, baseUrl) once; all `*Async` functions pick it up automatically, or accept a per-call override
- **JSDoc fast/slow markers** — every sync assertion is marked `**Fast and approximate**` with `{@link xAsync}` cross-reference; every async variant is marked `**Slow and accurate**` — visible in IDE tooltips
- **115 new assertion tests** — full coverage for all improved sync assertions, JSON Schema `matchesSchema` formats, and all 6 async variants (mocked OpenAI + Anthropic paths, error cases)

---

## [2.2.1] - 2026-03-03

### Fixed

- **`snapshot` object input** — `snapshot('name', { score: 92 })` now works; objects auto-serialized via `JSON.stringify`

---

## [2.2.0] - 2026-03-03

### Breaking

- **`snapshot(output, name)` → `snapshot(name, output)`** (SDK) — parameter order swapped. Update call sites.

### Added

- **`expect().not`** — negated assertion modifier now works (`expect(x).not.toContain(y)`)
- **`hasPII(text)`** — clear semantic alias for PII detection; exported from `@evalgate/sdk`
- **`defineSuite` object form** — accepts `{ name, specs }` object in addition to positional args

### Fixed

- **`specId` collision** — all specs in `eval/` shared one ID; SHA-256 fix in `discover.ts`
- **`explain` UNKNOWN verdict** — now correctly reads `last-run.json` (RunResult format) and shows PASS/FAIL
- **`print-config` baseUrl** — default changed from `localhost:3000` → `https://api.evalgate.com`
- **`baseline update`** — self-contained; no longer requires custom npm script
- **`impact-analysis` git error** — clean error messages instead of raw git help output
- **README quickstart** — `defineEval` examples now include executor function

---

## [2.1.3] - 2026-03-02

### Fixed

- **Critical:** Multi-`defineEval` calls per file — only first was discovered (silent data loss)
- **High:** First-run gate false regression on fresh init when no test script exists  
- **High:** Doctor defaults baseUrl to localhost:3000 instead of production API
- **Critical:** Simulated executeSpec replaced with real spec execution
- **High:** Run scores now include scoring model context for clarity
- **Low:** Explain no longer shows "unnamed" for builtin gate failures
- **Docs:** Added missing `discover --manifest` step to local quickstart
- **Platform:** Updated stability docs, OpenAPI changelog, and version synchronization

## [2.1.2] - 2026-03-02

### Fixed

- **Type safety** — resolved 150+ type errors across API routes, services, and components; codebase now compiles with zero TypeScript errors
- **Test suite** — all three test lanes green (unit, DB, DOM); updated fixtures to align with corrected data handling
- **CI gate** — lint, build, regression gate, and all audits passing locally

## [2.1.1] - 2026-03-02

### Fixed

- **Variable name mismatch** in trace processing pipeline
- **CI contract payload validation** - Fixed ruff errors in Python SDK test suite
- **SDK-Server integration** - Fixed 3 critical validation mismatches between SDK and server
- **Test database regression** - Resolved DB test failures after recent schema changes

### Added

- **Comprehensive test coverage** across core modules:
  - Evaluation templates: 15 unit tests
  - Export templates: 18 unit tests  
  - Scoring algorithms: 35 unit tests
  - Run assertions: 15 unit tests
  - HMAC signing: 13 unit tests
  - SDK mapper/transformer: 55 unit tests

- **Golden path demo** - Single-command script demonstrating end-to-end evaluation workflow
- **Feature extraction caching** - Performance optimization for embedding-based coverage models
- **Contract payload suite** - Cross-language test matrix (TypeScript + Python SDK)
- **Version resolution APIs** - `resolveAtVersion`, `resolveAtTime`, `buildVersionHistory`
- **Test case lifecycle** - Quarantine → promote workflow for generated test cases
- **Redaction pipeline** - PII redaction integrated into trace freezing

### Changed

- **Implementation Summary** updated with accurate test counts and gap resolutions
- **Documentation** added for golden path workflow and architecture decisions

## [2.1.0] - 2026-03-02

### Added — EvalGate Intelligence Layer

**Backend modules** (505 unit tests, 32 new source files):
- **Phase 0 — Foundation:** `reliability-object`, `lineage`, `version-resolver`, `compat`; `redaction`, `secret-scanner`
- **Phase 1.1 — Trace Intelligence:** `trace-schema` (Zod v1 + version compatibility), `trace-validator`, `trace-freezer` (structural immutability)
- **Phase 1.2 — Failure Detection:** `taxonomy` (8 failure categories), `confidence` (weighted multi-detector aggregation), `detectors/rule-based`
- **Phase 1.3 — Test Generation:** `trace-minimizer`, `generator` (EvalCase generation from traces), `deduplicator` (Jaccard similarity clustering), `test-quality-evaluator`; `testcases/spec` (EvalCase v1 canonical format)
- **Phase 2A — Dataset Coverage:** `coverage-model` with configurable `seedPhrases`, gap detection, cluster coverage ratio
- **Phase 3 — Three-Layer Scoring:** `trace-feature-extractor`, `reasoning-layer`, `action-layer`, `outcome-layer`
- **Phase 4 — Multi-Judge:** `aggregation` (median/mean/weighted/majority/min/max strategies), `transparency` (per-judge audit trail)
- **Phase 5B — Metric DAG Safety:** `dag-safety` (cycle detection, missing finalScore, max depth, reachability)
- **Phase 7 — Drift Intelligence:** `behavioral-drift` (6 signal types), `drift-explainer`
- **Phase 8B/8C — Replay + Attribution:** `replay/determinism`, `regression/attribution`

**UX components** (40 DOM tests, 5 new React components):
- `score-layer-breakdown` — reasoning/action/outcome score bars with evidence flags
- `judge-vote-panel` — per-judge votes, agreement %, strategy label, confidence badge
- `drift-severity-badge` — color-coded severity (none → critical) with signal list
- `coverage-gap-list` — gap list with importance progress bars and coverage ratio
- `failure-confidence-badge` — failure category + confidence % + detector agreement

### Changed

- **EvalCase ID** upgraded from 32-bit FNV-1a (8 hex chars) to 64-bit FNV-1a (16 hex chars) — format: `ec_<16 hex>`. Negligible collision probability at any realistic test registry size.
- **`sdk/package.json`**: `test` script changed from `vitest` (watch) to `vitest run` (CI-safe); `test:watch` added for developer use.
- **`run-platform-ci.ts`**: Added `--skip-db` flag for local runs without PostgreSQL; coverage audit now skipped automatically when `--skip-db` is active.

### Fixed

- Refusal constraint regex: replaced PCRE-only `(?i)` inline flag with `[Ii]`/`[Aa]` character classes — was throwing `SyntaxError` in any JS runtime calling `new RegExp(value)`
- `majority_vote` aggregation tie: pass == fail now returns `finalScore: 0.5` instead of silently returning 1.0
- `secret-scanner.ts`: extracted assignment from `while` condition to satisfy `noAssignInExpressions` (was valid JS but lint error)
- `drift-severity-badge.tsx`: replaced array index key with `${type}-${description}` composite key
- Biome `organizeImports`: auto-fixed 61 test files with unsorted import blocks

## [2.0.0] - 2026-03-01

### Breaking — EvalGate Rebrand

- **Package names:** `@pauly4010/evalai-sdk` → `@evalgate/sdk`, `pauly4010-evalai-sdk` → `pauly4010-evalgate-sdk`
- **CLI:** `evalai` → `evalgate`
- **Config dir:** `.evalai/` → `.evalgate/` (legacy still read with deprecation warning)
- **Env vars:** `EVALAI_*` → `EVALGATE_*` (legacy still work with deprecation warning)
- **Error class:** `EvalAIError` → `EvalGateError`

### Added

- Deprecation warnings when using legacy env vars, config paths, or `.evalai/`

### Deprecated

- `@pauly4010/evalai-sdk` and `pauly4010-evalai-sdk` — use `@evalgate/sdk` and `pauly4010-evalgate-sdk` instead

## [1.9.1] - 2026-03-01

### Fixed
- Fix 7 cross-tenant IDOR vulnerabilities across API routes
- Fix SSE server killing all clients after 30s (lastPing never updated)
- Fix SSE stream TDZ crash on response variable
- Fix Redis outage taking down all endpoints (add in-memory fallback)
- Fix shared reports .run() crash (SQLite method on PostgreSQL)
- Fix raw error message disclosure in 500 responses
- Fix SameSite=None cookie weakening CSRF protection
- Fix OAuth provider crash when credentials not configured
- Fix logger crash on circular references
- Fix report-card metadata overwrite making totalCost always 0
- Align TypeScript SDK types with actual API response shapes (12+ fixes)
- Fix Python SDK CLI init template, run output, credential resolution
- Add rate limiting to demo playground, onboarding, billing-portal
- Add NaN guards to parseInt across API routes
- Fix DB connection pool config for serverless (max: 1 on Vercel)

## [1.9.0] - 2026-02-27

### Added

- **SDK 1.9.0** — `evalai ci` one-command CI loop, durable run history & diff system, centralized architecture, CI friendliness improvements. See [SDK CHANGELOG](src/packages/sdk/CHANGELOG.md) for details.

## [1.8.0] - 2026-02-26

### Added

- **SDK 1.8.0** — `evalai doctor` rewrite (9-check checklist), `evalai explain` (offline report explainer), `evalai print-config`, guided failure flow, minimal green example. See [SDK CHANGELOG](src/packages/sdk/CHANGELOG.md) for details.

## [1.7.0] - 2026-02-26

### Added

- **`evalai upgrade --full`** — One command to upgrade from Tier 1 (built-in gate) to Tier 2 (full metric gate with golden eval, confidence tests, latency, cost).
- **`detectRunner()`** — Auto-detect CI environment (GitHub Actions, GitLab CI, CircleCI, etc.) for smarter gate defaults.
- **Machine-readable gate output** — `--format json|github|human` for all gate commands.
- **Init test matrix** — Scaffolder now validates across npm/yarn/pnpm before generating workflows.
- **SDK dist files** updated for full CJS/ESM dual-package compatibility.

### Fixed

- **DB test failures** — Fixed 3 test failures: `provider-keys` Date vs String assertion (timestamp migration), `evaluation-service` beforeAll timeout (missing eval-executor mock), `redis-cache` not-configured test (unmocked @upstash/redis).
- **E2E smoke tests** — Switched `toBeVisible()` → `toBeAttached()` for headless Chromium CI compatibility.
- **Rollup CVE** — Added `>=4.59.0` override to fix GHSA-mw96-cpmx-2vgc (path traversal).

### Changed

- **Timestamp migration complete** — All 24 tables now use integer timestamps (`integer({ mode: "timestamp" })`). Batch 1 (5 hot-path tables) and Batch 2 (19 remaining tables) fully migrated.
- **Lint baseline** — Reduced from 302 → 215 warnings (88 `noExplicitAny` fixes).
- **Website docs updated** — Changelog, quick-start, SDK page, CI/CD guide, and documentation hub all reflect v1.7.0 CLI features.
- **llms.txt / llms-full.txt** — Fixed stale version (1.3→1.7), added CLI commands section, corrected wording.

## [1.6.0] - 2026-02-19

### Security

- **Cookie-first authentication** — Removed all `localStorage` bearer token usage across 15+ pages/components. Browser-authenticated requests now use `credentials: "include"` with HttpOnly session cookies exclusively.
- **Webhook secret encryption** — Webhook secrets are now encrypted at rest using AES-256-GCM with per-organization key derivation. Plaintext is returned only once at creation. Migration `0033` adds encrypted columns with backward-compatible lazy encryption.
- **CSP tightened** — Removed `unsafe-eval` in production; kept dev-only for HMR. Added Supabase to script-src allowlist.
- **postMessage origin restricted** — `data-target-origin="*"` replaced with config-driven `NEXT_PUBLIC_SITE_URL`.

### Fixed

- **useSession infinite loop** — Wrapped `fetchSession` in `useCallback` to prevent re-render loop affecting all 28+ authenticated pages.
- **Rate-limit tier mapping** — Added `deriveRateLimitTier()` based on auth type and role. Removed dead `getUserPlanFromRequest` function.
- **Evaluation schema dedup** — Removed duplicate `createEvaluationSchema` from service layer; canonical types now imported from `@/lib/validation`.
- **getStats O(n) query** — Replaced full-table fetch with `COUNT(*)` + `ORDER BY LIMIT 1`.
- **Rate-limit test timeouts** — Fixed 4 test failures caused by unmocked `@sentry/nextjs` initialization in happy-dom.

### Changed

- **Coverage thresholds** — Raised from 5% to 20% (lines, functions, branches, statements).
- **Linting** — Enabled `useExhaustiveDependencies` and `a11y` rules as warnings in Biome.
- **SDK** — Added CJS `require` entries for all subpath exports; bumped to 1.5.6.

### Added

- Cookie-first auth regression test (static analysis — fails CI if `localStorage` bearer tokens reappear).
- Webhook encryption migration safety invariant documented in `docs/migration-safety.md`.
- `NEXT_PUBLIC_SITE_URL` and `PROVIDER_KEY_ENCRYPTION_KEY` added to `.env.example`.

### Removed

- Committed `.tgz` build artifacts from git tracking.

## [1.5.0] - 2026-02-18

- SDK 1.5.0: `--format github`, `--onFail import`, `evalai doctor`, pinned CLI invocation
