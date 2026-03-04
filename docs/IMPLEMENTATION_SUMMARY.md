# EvalGate Implementation Summary

Complete record of all modules built, tests written, and features implemented.

---

## Phase 0 — Foundation

### Reliability & Versioning
| File | Description |
|------|-------------|
| `src/lib/reliability/compat.ts` | Spec version compatibility policy — `checkCompat`, `isCompatible`, `getSupportedRange`, `formatCompatMatrix`, `getContractTestVersions` |
| `src/lib/reliability/lineage.ts` | Trace lineage tracking — parent/child span relationships, lineage extraction |
| `src/lib/reliability/reliability-object.ts` | Reliability score computation and tier classification |
| `src/lib/reliability/version-resolver.ts` | SDK version resolution and deprecation handling |

**Tests:** `tests/unit/reliability/compat.test.ts` · `tests/unit/reliability/lineage.test.ts` · `tests/unit/reliability/reliability-object.test.ts` · `tests/unit/reliability/version-resolver.test.ts`

### Security
| File | Description |
|------|-------------|
| `src/lib/security/` | Input sanitization, injection detection, rate-limit wrappers |

**Tests:** `tests/unit/security/`

---

## Phase 1.1 — Trace Schema & Validation

| File | Description |
|------|-------------|
| `src/lib/traces/trace-schema.ts` | Canonical trace schema types — `TraceSpan`, `TraceRecord`, `SpanType` |
| `src/lib/traces/trace-validator.ts` | Schema validation with detailed error reporting |
| `src/lib/traces/trace-freezer.ts` | Immutable snapshot creation for replay — `FrozenTrace`, `ReplayTier` |

**Tests:** `tests/unit/traces/`

---

## Phase 1.2 — Failure Detection

| File | Description |
|------|-------------|
| `src/lib/failures/taxonomy.ts` | Failure category taxonomy — hallucination, refusal, off-topic, formatting, reasoning, tool, compliance, retrieval |
| `src/lib/failures/confidence.ts` | Confidence scoring for detected failure categories |
| `src/lib/failures/detectors/rule-based.ts` | Keyword + pattern-based failure detector across all taxonomy categories |
| `src/lib/failures/detectors/instruction-erosion.ts` | Gradual instruction-adherence drift detector — signal matching, slope computation, erosion reporting |

**Tests:** `tests/unit/failures/rule-based.test.ts` · `tests/unit/failures/instruction-erosion.test.ts`

**UI:** `src/components/failure-confidence-badge.tsx` — failure category + confidence badge

**DOM Tests:** `tests/components/failure-confidence-badge.test.tsx`

---

## Phase 1.3 — Test Generation

| File | Description |
|------|-------------|
| `src/lib/testgen/trace-minimizer.ts` | Extract minimal reproducing input from full production trace — user prompt, system prompt, tool calls, failure output, metadata |
| `src/lib/testgen/generator.ts` | Test case generation from minimized traces |
| `src/lib/testgen/deduplicator.ts` | Jaccard-similarity deduplication of generated test cases |
| `src/lib/testgen/test-quality-evaluator.ts` | Evaluate quality of generated test cases — coverage, specificity, redundancy |
| `src/lib/testcases/spec.ts` | Test case spec DSL — `defineTestCase`, `TestCaseSpec` |

**Tests:** `tests/unit/testgen/generator.test.ts` · `tests/unit/testgen/deduplicator.test.ts` · `tests/unit/testgen/test-quality-evaluator.test.ts` · `tests/unit/testgen/trace-minimizer.test.ts` · `tests/unit/testcases/`

---

## Phase 1.4 — GitHub PR Annotations

| File | Description |
|------|-------------|
| `src/lib/ci/github-pr-annotations.ts` | GitHub Check Run payload builder, PR comment body generator, evaluation diff computation, conclusion derivation |

Key exports:
- `buildCheckRunPayload(run, opts)` — constructs `CheckRunPayload` with annotations
- `buildPRCommentBody(run, opts)` — markdown PR comment with score table
- `computeEvalDiff(baseline, current)` — per-test score deltas, regressions, improvements
- `deriveConclusion(run, opts)` — `success | failure | neutral` based on pass threshold

**Tests:** `tests/unit/ci/github-pr-annotations.test.ts` (35 tests)

---

## Phase 2.1 — Dataset Health Analyzer

| File | Description |
|------|-------------|
| `src/lib/dataset/health-analyzer.ts` | Comprehensive dataset health analysis |

Key exports:
- `detectDuplicates(items)` — Jaccard-similarity duplicate detection with configurable threshold
- `detectOutliers(items)` — length outliers, score outliers, missing expected output
- `detectSchemaDrift(snapshots)` — field presence drift across dataset snapshots
- `computeScoreDistribution(items)` — mean, median, std dev, percentiles
- `analyzeTrend(snapshots)` — score trend direction + magnitude across time
- `computeHealthScore(report)` — single 0–100 health score with recommendations

**Tests:** `tests/unit/dataset/health-analyzer.test.ts`

---

## Phase 2A — Coverage Model

| File | Description |
|------|-------------|
| `src/lib/dataset/coverage-model.ts` | Behavioral coverage estimation — clusters test cases by bag-of-words similarity, identifies untested behavior gaps |

**UI:** `src/components/coverage-gap-list.tsx` — gap list with importance bars

**DOM Tests:** `tests/components/coverage-gap-list.test.tsx`

---

## Phase 3 — Three-Layer Scoring

| File | Description |
|------|-------------|
| `src/lib/scoring/trace-feature-extractor.ts` | Extract structured features from trace spans for scoring |
| `src/lib/scoring/reasoning-layer.ts` | Score reasoning quality — logical chains, contradictions, uncertainty |
| `src/lib/scoring/action-layer.ts` | Score action quality — tool selection, argument validity, sequencing |
| `src/lib/scoring/outcome-layer.ts` | Score outcome quality — goal completion, side-effects, correctness |

**Tests:** `tests/unit/scoring/three-layer.test.ts`

**UI:** `src/components/score-layer-breakdown.tsx` — reasoning/action/outcome score bars

**DOM Tests:** `tests/components/score-layer-breakdown.test.tsx`

---

## Phase 3.2 — Partial Credit Scoring

| File | Description |
|------|-------------|
| `src/lib/scoring/partial-credit.ts` | Rubric-based multi-dimension scoring — binary, scalar, and tiered modes with per-dimension weights |

Key exports:
- `resolveDimensionScore(dim, raw)` — resolve raw value against rubric dimension
- `computePartialCreditScore(rubric, rawScores)` — weighted total with credit counts
- `buildRubric(dims)` / `buildBinaryDimension` / `buildScalarDimension` / `buildTieredDimension`

**Tests:** `tests/unit/scoring/partial-credit.test.ts`

---

## Phase 4 — Multi-Judge Aggregation

| File | Description |
|------|-------------|
| `src/lib/judges/aggregation.ts` | Judge vote aggregation — median, mean, weighted_mean, majority_vote, min, max; `AgreementStats` with outlier detection |
| `src/lib/judges/transparency.ts` | `JudgeTransparencyArtifact` — rubric hashes, raw outputs, aggregation narrative, explain view |
| `src/lib/judges/multi-judge-engine.ts` | Multi-judge execution — parallel, escalation, sequential modes; `escalationStopped` flag |

**Tests:** `tests/unit/judges/aggregation.test.ts` · `tests/unit/judges/transparency.test.ts` · `tests/unit/judges/multi-judge.test.ts`

**UI:** `src/components/judge-vote-panel.tsx` — per-judge votes + agreement stats display

**DOM Tests:** `tests/components/judge-vote-panel.test.tsx`

---

## Phase 4A — Judge Governance & Reliability

| File | Description |
|------|-------------|
| `src/lib/judges/governance.ts` | Trust tier management — `platinum/gold/silver/bronze`; policy enforcement (min judge count, required/prohibited judges); audit trail for tier changes |
| `src/lib/judges/reliability.ts` | Per-judge historical accuracy + bias tracking — `computeJudgeReliability`, `classifyReliabilityTier`, `detectUnstableJudges` |

**Tests:** `tests/unit/judges/governance.test.ts` · `tests/unit/judges/reliability.test.ts`

---

## Phase 5B — DAG Safety

| File | Description |
|------|-------------|
| `src/lib/metrics/dag-safety.ts` | MetricDAG structural validation — cycle detection (DFS), `finalScore` output node requirement, undefined input detection, hard gate ordering |

Key exports: `validateDAG(nodes)` → `{ valid, errors, topologicalOrder }`

**Tests:** `tests/unit/metrics/dag-safety.test.ts`

---

## Phase 5 Full — Metric DAG Engine + Primitives

### Primitives
| File | Description |
|------|-------------|
| `src/lib/metrics/primitives.ts` | 11 built-in metric primitive functions |

| Primitive | What it measures |
|-----------|-----------------|
| `exact_match` | Case-insensitive exact string equality |
| `contains_match` | Substring containment |
| `regex_match` | Pattern match via injected regex |
| `token_f1` | SQuAD-style token-level F1 score |
| `jaccard_similarity` | Token-set Jaccard coefficient |
| `length_ratio` | Response length vs expected ratio |
| `max_length` | Hard character limit |
| `latency_score` | Latency vs target (degrades at 2×) |
| `cost_score` | Cost vs budget (degrades at 2×) |
| `tool_success_rate` | Ratio of successful tool calls |
| `required_tool_used` | Whether a specific tool was called |

Also exports `PRIMITIVE_REGISTRY` and `getPrimitive(name)`.

**Tests:** `tests/unit/metrics/primitives.test.ts` (43 tests)

### DAG Engine
| File | Description |
|------|-------------|
| `src/lib/metrics/dag-engine.ts` | Topological DAG execution engine |

Supported node types:
- **`input`** — fixed value (injected context or override)
- **`metric`** — runs a named primitive against `MetricContext`
- **`aggregator`** — mean / min / max / weighted_mean / product across inputs
- **`gate`** — hard gate that blocks all downstream nodes if threshold not met
- **`output`** — final score aggregation node

Key exports: `executeDAG(dag, context, config)` → `DAGExecutionResult`

**Tests:** `tests/unit/metrics/dag-engine.test.ts` (18 tests)

---

## Phase 6 — Governance Audit Export

| File | Description |
|------|-------------|
| `src/lib/governance/audit-export.ts` | Audit event filtering, sorting, and multi-format export |

Key exports:
- `filterAuditLog(events, filter)` — timestamp range, event type, actor, subject, severity
- `sortAuditLog(events, opts)` — field + direction sorting with limit
- `exportToJson(events)` / `exportToNdjson(events)` / `exportToCsv(events)` / `exportToMarkdown(events)`
- `summarizeAuditLog(events)` — count by type, severity, actor; date range

**Tests:** `tests/unit/governance/audit-export.test.ts`

---

## Phase 7 — Behavioral Drift

| File | Description |
|------|-------------|
| `src/lib/drift/behavioral-drift.ts` | Detect behavioral drift across evaluation runs — score trends, failure pattern shifts, category emergence |
| `src/lib/drift/drift-explainer.ts` | Human-readable drift explanations with contributing factors |
| `src/lib/drift/zscore.ts` | Z-score anomaly detection utilities |

**Tests:** `tests/unit/drift/behavioral-drift.test.ts` · `tests/unit/drift/drift-explainer.test.ts` · `tests/unit/drift/zscore.test.ts`

**UI:** `src/components/drift-severity-badge.tsx` — severity indicator (low/medium/high/critical)

**DOM Tests:** `tests/components/drift-severity-badge.test.tsx`

---

## Phase 8B/8C — Replay Determinism & Attribution

| File | Description |
|------|-------------|
| `src/lib/replay/determinism.ts` | Tier classification (A/B/C) — `classifyDeterminism`, `validateReplayResult`, `formatTierSummary` |
| `src/lib/regression/attribution.ts` | Score regression root-cause attribution |

**Tests:** `tests/unit/replay/determinism.test.ts` · `tests/unit/regression/attribution.test.ts`

---

## Replay CLI Command

| File | Description |
|------|-------------|
| `src/lib/replay/replay-runner.ts` | Full replay orchestration layer |

Key exports:
- `buildReplayPlan(job)` — pre-flight plan with tier classification, tag/tier filtering, blocker detection
- `executeReplayJob(job, evaluatorFn, opts)` — async replay with injected evaluator, error recovery, per-trace results
- `formatReplayPlan(plan)` / `formatReplayResult(result)` — CLI-ready human-readable output

`ReplayStatus` values: `passed | failed_tolerance | failed_eval | skipped | error`

**Tests:** `tests/unit/replay/replay-runner.test.ts` (29 tests)

---

## Scoring Utilities

| File | Tests | Description |
|------|-------|-------------|
| `src/lib/scoring/similarity.ts` | `tests/unit/scoring/similarity.test.ts` (25) | `cosineSimilarity`, `levenshteinSimilarity`, `combinedScore`, `keywordMatchRate` |
| `src/lib/scoring/quality-score.ts` | `tests/unit/scoring/quality-score.test.ts` (33) | `computeQualityScore` — pass rate, safety, judge, schema, latency, cost → 0–100 score + flags + evidence level |
| `src/lib/iaa/index.ts` | `tests/unit/scoring/iaa.test.ts` (24) | `cohensKappa`, `fleissKappa`, `computeIAA` — inter-annotator agreement for 2 and 3+ raters |

---

## Evaluation Assertion Runners

| File | Tests | Description |
|------|-------|-------------|
| `src/lib/eval/assertion-runners/pii.ts` | `tests/unit/eval/assertion-runners.test.ts` | Email, SSN, phone, credit card, IP address heuristic detection |
| `src/lib/eval/assertion-runners/toxicity.ts` | Same file | Keyword-based toxicity detection |
| `src/lib/eval/assertion-runners/json-schema.ts` | Same file | Valid JSON + required-key validation |

**Tests:** `tests/unit/eval/assertion-runners.test.ts` (23 tests)

---

## Crypto Utilities

| File | Description |
|------|-------------|
| `src/lib/crypto/canonical-json.ts` | Deterministic JSON serialization (sorted keys) for hashing |
| `src/lib/crypto/hash.ts` | `sha256Hex(input)` — SHA-256 hex digest |

**Tests:** `tests/unit/crypto/canonical-json.test.ts` · `tests/unit/crypto/hash.test.ts`

---

## Gap Audit Resolutions (Session 2)

### Gap G — Quarantine → Promote Lifecycle
| File | Description |
|------|-------------|
| `src/lib/testcases/quarantine.ts` | Full test-case state machine: `generated → quarantined → promoted / rejected` |

Key exports: `createGeneratedTestCase`, `quarantineTestCase`, `promoteTestCase`, `rejectTestCase`, `getGatingCases`, `getPendingReviewCases`, `summarizeQuarantineStatus`

- All transitions append audited events (actor / reason / ISO timestamp)
- `getGatingCases()` returns only promoted cases — the merge gate filter
- `promoteTestCase()` enforces optional `minQualityScore`

**Tests:** `tests/unit/testcases/quarantine.test.ts` (30 tests)

---

### Gap D — ReliabilityObject Version Resolution
| File | Description |
|------|-------------|
| `src/lib/reliability/reliability-object.ts` | Added `resolveAtVersion`, `resolveAtTime`, `buildVersionHistory` |

- `resolveAtVersion(history, n)` — fetch entity at exact version
- `resolveAtTime(history, iso)` — latest version at or before timestamp (point-in-time audit)
- `buildVersionHistory(objects)` — sort + validate monotonic version sequence

**Tests:** `tests/unit/reliability/reliability-object.test.ts` (23 tests total, +14 new)

---

### Gap C — Trace Redaction Wired Inline
| File | Description |
|------|-------------|
| `src/lib/traces/trace-freezer.ts` | Redaction now on by default in `freezeTrace`; opt out with `applyRedaction: false` |

---

### Gap B — Contract Payload Suite
| File | Description |
|------|-------------|
| `tests/contract/fixtures/trace_v1.json` | Canonical trace payload fixture (shared TS + Python) |
| `tests/contract/fixtures/span_v1.json` | Canonical span payload with full behavioral block |
| `tests/contract/fixture-payload-matrix.test.ts` | Loads fixtures from disk, validates schema + round-trip + cross-fixture consistency |
| `src/packages/sdk-python/tests/test_contract_payloads.py` | Python SDK contract tests consuming the same fixtures |

**Tests:** 15 TS + 28 Python (43 total)

---

### Gap F — Feature Extraction Caching
| File | Description |
|------|-------------|
| `src/lib/scoring/feature-cache.ts` | Caching contract wrapping the feature extractor |

Key exports: `featureCacheKey`, `InMemoryFeatureCache`, `extractOrGetCached`, `extractBatch`, `computeCacheStats`, re-exports `FEATURE_VERSION`

- `extractOrGetCached()` guarantees at-most-one extraction per `(traceId, featureVersion)`
- `InMemoryFeatureCache` for tests and local dev; DB-backed store injected by callers

**Tests:** `tests/unit/scoring/feature-cache.test.ts` (25 tests)

---

### Gap E — Embedding-Based Coverage Model
| File | Description |
|------|-------------|
| `src/lib/dataset/coverage-model.ts` | Optional cosine-similarity clustering behind `useEmbeddings` feature flag |

Key additions:
- `EmbeddingFn` type — caller-injected, no external deps
- `EmbeddingVersionInfo` + `computeEmbeddingVersionHash()` — stable cache keying
- `buildCoverageModel()` now accepts `embeddingFn` + `useEmbeddings`; falls back to BoW Jaccard when flag is false or fn absent

**Tests:** `tests/unit/dataset/embedding-coverage.test.ts` (16 tests)

---

### Gap A — End-to-End Golden Path Demo
| File | Description |
|------|-------------|
| `scripts/golden-path-demo.ts` | 7-step executable demo: `pnpm tsx scripts/golden-path-demo.ts` |
| `docs/GOLDEN_PATH.md` | Step breakdown, ASCII flow diagram, module map, run commands |

**Zero mocks, zero DB, zero network.** Exercises: validate → freeze+redact → detect → quarantine/promote → PR annotation → replay plan → dataset health.

---

## Production → CI Loop (v3.0.0)

The killer feature: **production failures automatically become regression tests.**

### Schema + Migration (T0)

| File | Description |
|------|-------------|
| `src/db/schema.ts` | 3 new tables: `failureReports` (21 cols), `candidateEvalCases` (19 cols), `userFeedback` (8 cols) |
| `src/db/types.ts` | 8 new JSONB column types for the new tables |
| `drizzle/0001_adorable_squadron_sinister.sql` | Migration for 3 new tables + indexes + FKs |

**Tests:** `tests/lib/production-ci-tables.test.ts` (18 DB tests)

### Collector Endpoint (T1)

| File | Description |
|------|-------------|
| `src/app/api/collector/route.ts` | `POST /api/collector` — single-payload trace + spans ingest with rate-limit guardrail |
| `src/lib/collector/collector.service.ts` | `ingestTrace()` — transactional insert with `ON CONFLICT DO NOTHING` for idempotent retries |
| `src/lib/collector/sampling.ts` | Server-side sampling: errors + thumbs-down always, success at 10% default |
| `src/lib/collector/rate-limiter.ts` | Sliding-window rate limiter (200/min per org, configurable via `MAX_ANALYSIS_RATE`) |
| `src/lib/validation.ts` | `collectorBodySchema` Zod schema (LangWatch-compatible) |

**Tests:** `tests/unit/collector/sampling.test.ts` (8) · `tests/unit/collector/collector-schema.test.ts` (18) · `tests/unit/collector/rate-limiter.test.ts` (10)

### Detection Pipeline (T2)

| File | Description |
|------|-------------|
| `src/lib/jobs/types.ts` | Added `trace_failure_analysis` to `JobType` union |
| `src/lib/jobs/payload-schemas.ts` | Added `traceFailureAnalysisSchema` |
| `src/lib/jobs/runner.ts` | Registered `handleTraceFailureAnalysis` handler |
| `src/lib/jobs/handlers/trace-failure-analysis.ts` | Job handler wrapping pipeline orchestrator |
| `src/lib/pipeline/trace-failure-pipeline.ts` | Full pipeline: load → detect → aggregate → group → generate → score → auto-promote. Manages `analysis_status` lifecycle (pending → analyzing → analyzed/failed) |
| `src/lib/pipeline/group-hash.ts` | SHA-256 failure grouping (category + normalized prompt) |
| `src/lib/pipeline/auto-promote.ts` | Heuristic: `quality≥90 AND confidence≥0.8 AND detectors≥2` |
| `src/lib/pipeline/dedup-existing-tests.ts` | Dedup against existing test cases (input hash + title match) |

**Tests:** `tests/unit/pipeline/group-hash.test.ts` (10) · `tests/unit/pipeline/auto-promote.test.ts` (8) · `tests/unit/pipeline/feedback-schema.test.ts` (6)

### Candidate Review API (T3) + Golden Regression (T3A)

| File | Description |
|------|-------------|
| `src/lib/services/candidate.service.ts` | List, getById, updateStatus, promote (with dedup guard) |
| `src/lib/services/golden-regression.service.ts` | `findOrCreate()` idempotent golden regression evaluation per org |
| `src/app/api/candidates/route.ts` | `GET /api/candidates` with status/auto_promote filters |
| `src/app/api/candidates/[id]/route.ts` | `GET` detail + `PATCH` status |
| `src/app/api/candidates/[id]/promote/route.ts` | `POST` promote to evaluation (with dedup 409) |

### User Feedback (T4) + SDK reportTrace (T5)

| File | Description |
|------|-------------|
| `src/app/api/traces/[id]/feedback/route.ts` | `POST` feedback, thumbs-down triggers analysis job |
| `src/packages/sdk/src/collector.ts` | `reportTrace()` with client-side sampling, error/thumbs-down bypass |

### CLI Commands (T6–T8)

| File | Description |
|------|-------------|
| `src/packages/sdk/src/cli/promote.ts` | `evalgate promote <id>`, `--auto`, `--list` |
| `src/packages/sdk/src/cli/replay.ts` | `evalgate replay <id>`, `--model`, `--format` |
| `src/packages/sdk/src/cli/api.ts` | Generic `fetchAPI()` helper for CLI commands |

**Tests:** `tests/unit/cli/promote-args.test.ts` (6) · `tests/unit/cli/replay-args.test.ts` (5)

### Production Hardening

| Safeguard | Implementation |
|-----------|---------------|
| **Collector idempotency** | `ON CONFLICT DO NOTHING` on `traces.traceId` + `spans.spanId` in `collector.service.ts` |
| **Rate-limit guardrail** | `canEnqueueAnalysis()` sliding window in `rate-limiter.ts`, wired into collector route |
| **Job retry + dead letter** | Exponential backoff (1m→4h), `maxAttempts=5`, `dead_letter` status in `runner.ts` |
| **`analysis_status`** | `pending → analyzing → analyzed/failed` lifecycle on `traces` table |
| **`source` + `environment`** | First-class columns on `traces` (sdk/api/cli, production/staging/dev) |
| **Compound unique index** | `idx_traces_org_trace_id` on `(organization_id, trace_id)` |
| **Dedup in promote** | `deduplicateAgainstExistingTests()` checks input hash + title before creating test case |

**Migration:** `drizzle/0002_kind_ego.sql` — 3 columns + 1 unique index

---

## Test Count Summary

| Lane | Files | Tests |
|------|-------|-------|
| Unit (TS) | 56+ files | 1000+ tests |
| DB (TS) | 85+ files | 678+ tests |
| DOM (TS) | 6 files | 21 tests |
| Python SDK | 5 files | 28 contract tests |
| **Total** | **152+ files** | **1727+ tests** |

All tests passing across all lanes.

---

## Key Architectural Decisions

- **Pure modules** — every module in `src/lib/` is DB-free and I/O-free; DB/network is injected by callers
- **Three test lanes** — Unit (no DB), DB (migrations + seeding), DOM (JSDOM) run independently
- **DAG pattern** — metric evaluation uses a validated DAG executed topologically with hard-gate blocking
- **Replay tiers** — A (deterministic), B (semi-deterministic, ±15%), C (best-effort) prevent overpromising replay fidelity
- **Multi-judge escalation** — sequential mode correctly propagates `escalationStopped` from `runSequential`
- **Production → CI loop** — production failures automatically become regression tests via async pipeline + golden dataset
- **Idempotent ingest** — collector uses `ON CONFLICT DO NOTHING` for safe SDK retries
- **Rate-limited analysis** — sliding-window per org prevents traffic spikes from overwhelming the pipeline
