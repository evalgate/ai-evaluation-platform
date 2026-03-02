# EvalGate Golden Path Demo

The canonical end-to-end walkthrough of the full evaluation loop.
**Zero mocks. Zero DB. Zero network.** All 7 steps use real library modules.

## Quick start

```bash
pnpm tsx scripts/golden-path-demo.ts
```

Expected output: 7 step headers, all lines prefixed with `✓`.

---

## The 7-step loop

```
SDK payload
    │
    ▼
[1] Validate (trace-validator)
    │  specVersion check, schema guard
    ▼
[2] Freeze (trace-freezer)
    │  immutable snapshot, redaction ON by default
    │  replayTier assigned (A / B / C)
    ▼
[3] Detect failures (rule-based detector)
    │  refusal · hallucination · off-topic · tool errors
    ▼
[4] Generate test case → Quarantine → Promote
    │  generated → quarantined → promoted (human gate)
    │  only promoted cases gate merges
    ▼
[5] PR annotation payload (GitHub Checks API)
    │  Check Run conclusion: success | failure
    │  PR comment with score delta vs baseline
    ▼
[6] Replay plan (replay-runner)
    │  tier-filtered, pre-flight blockers surfaced
    ▼
[7] Dataset health (health-analyzer)
    │  duplicate detection, outlier scoring, trend
    ▼
    Done
```

---

## Step-by-step breakdown

### Step 1 — SDK payload validation
**Module:** `src/lib/traces/trace-validator.ts`

A raw JSON payload from the SDK is validated against the versioned schema.
- Missing `specVersion` is auto-upgraded to v1 (legacy compatibility)
- `VERSION_TOO_OLD` / `VERSION_TOO_NEW` codes for out-of-range clients

### Step 2 — Freeze with redaction
**Module:** `src/lib/traces/trace-freezer.ts`

The live trace is converted to an immutable `FrozenTraceSnapshot`.
- Redaction is **on by default** (`applyRedaction !== false`)
- Profile `default` masks PII fields and known secret patterns
- Opt out: `freezeTrace(trace, { applyRedaction: false })`
- `replayTier` (A/B/C) is assigned based on tool capture and determinism

### Step 3 — Rule-based failure detection
**Module:** `src/lib/failures/detectors/rule-based.ts`

Keyword/pattern matching emits typed `DetectorSignal[]` for:
`refusal`, `hallucination`, `off_topic`, `formatting`, `incomplete`,
`reasoning_error`, `tool_selection_error`, `compliance_violation`, `retrieval_failure`

### Step 4 — Quarantine lifecycle
**Module:** `src/lib/testcases/quarantine.ts`

Generated test cases follow a strict state machine:
```
generated → quarantined → promoted  (gates merges)
                       → rejected   (excluded permanently)
```
- All transitions are audited (actor + reason + timestamp)
- `getGatingCases()` returns only promoted cases — the merge gate filter
- `promoteTestCase()` enforces optional `minQualityScore`

### Step 5 — GitHub PR annotation
**Module:** `src/lib/ci/github-pr-annotations.ts`

- `buildCheckRunPayload()` → POST to `/repos/{owner}/{repo}/check-runs`
- `buildPRCommentBody()` → POST to `/repos/{owner}/{repo}/issues/{pr}/comments`
- Conclusion: `success` when `overallScore >= passThreshold`, else `failure`
- Score delta vs baseline surfaced in PR comment

### Step 6 — Replay plan
**Module:** `src/lib/replay/replay-runner.ts`

`buildReplayPlan()` pre-flights a set of frozen snapshots:
- Filters by `minTier` (C = all, B = deterministic, A = strict)
- Surfaces blockers before any model calls are made
- `PlannedReplay[]` drives the actual replay execution

### Step 7 — Dataset health
**Module:** `src/lib/dataset/health-analyzer.ts`

`analyzeDatasetHealth()` produces a `DatasetHealthReport` with:
- Duplicate pairs (Jaccard similarity, exact + near-duplicate)
- Statistical outliers (length, score, structural)
- Schema drift detection
- `computeDatasetTrend(prev, curr)` → `scoreTrend: stable | improving | degrading`

---

## Module map

| Gap | Module | Tests |
|-----|--------|-------|
| G — Quarantine lifecycle | `src/lib/testcases/quarantine.ts` | `tests/unit/testcases/quarantine.test.ts` (30) |
| D — ReliabilityObject | `src/lib/reliability/reliability-object.ts` | `tests/unit/reliability/reliability-object.test.ts` (23) |
| C — Trace redaction | `src/lib/security/redaction.ts` + `trace-freezer.ts` | `tests/unit/traces/trace-freezer.test.ts` |
| B — Contract payloads | `tests/contract/fixtures/` | `fixture-payload-matrix.test.ts` (15) + Python (28) |
| F — Feature caching | `src/lib/scoring/feature-cache.ts` | `tests/unit/scoring/feature-cache.test.ts` (25) |
| E — Embedding coverage | `src/lib/dataset/coverage-model.ts` | `tests/unit/dataset/embedding-coverage.test.ts` (16) |
| A — Golden path | `scripts/golden-path-demo.ts` | this doc |

---

## Running the full unit suite

```bash
pnpm vitest run \
  tests/unit/reliability tests/unit/traces tests/unit/security \
  tests/unit/replay tests/unit/failures tests/unit/testcases \
  tests/unit/regression tests/unit/testgen tests/unit/judges \
  tests/unit/scoring tests/unit/metrics tests/unit/drift \
  tests/unit/dataset tests/unit/confidence tests/contract \
  --config vitest.unit.config.ts
```

```bash
# Python SDK contract tests
python -m pytest src/packages/sdk-python/tests/test_contract_payloads.py -v
```
