# Regression Gate

The regression gate prevents quality regressions from merging to `main`. It compares current eval scores, confidence test counts, and product metrics against a committed baseline and fails CI if regression exceeds tolerance.

## Architecture

```
evals/baseline.json          ← committed baseline (source of truth)
evals/confidence-summary.json ← emitted by pnpm test:confidence (gitignored)
evals/golden/golden-results.json ← emitted by pnpm eval:golden (gitignored)
evals/regression-report.json  ← emitted by regression gate (gitignored, uploaded as CI artifact)
```

### Exit Codes

| Code | Category | Meaning |
|------|----------|---------|
| 0 | `pass` | No regression detected |
| 1 | `regression` | Regression exceeds tolerance |
| 2 | `infra_error` | Baseline file missing or invalid |
| 3 | `infra_error` | Confidence summary missing (tests crashed) |
| 4 | `infra_error` | Golden eval crashed or results missing |

### Report Schema (v1)

```json
{
  "schemaVersion": 1,
  "timestamp": "ISO-8601",
  "passed": true,
  "exitCode": 0,
  "category": "pass | regression | infra_error",
  "deltas": [{ "metric": "...", "baseline": 100, "current": 100, "delta": "+0", "status": "pass" }],
  "failures": [],
  "baseline": { "updatedAt": "...", "updatedBy": "..." }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm eval:baseline-init` | Create initial baseline with sample values |
| `pnpm eval:baseline-update` | Update baseline with live scores |
| `pnpm eval:regression-gate` | Run the regression gate |
| `pnpm test:confidence` | Run confidence tests (emits confidence-summary.json) |

## Baseline Governance

PRs that change `evals/baseline.json` require:
1. The `baseline-update` PR label
2. At least one approver (configure via CODEOWNERS)

The `baseline-governance.yml` workflow enforces the label requirement and prints a diff table showing what metrics changed.

## CI Integration

The regression gate runs in `platform-ci.yml` after `unit-confidence` and `db-confidence` jobs pass:

```
quality → unit-confidence + db-confidence → regression-gate
```

A standalone `evalai.yml` drop-in workflow is also available for external repos.

## Sanity Checks

### 1. Verify required checks in GitHub

1. Go to `https://github.com/pauly7610/ai-evaluation-platform/settings/branches`
2. Edit the `main` branch protection rule
3. Under "Require status checks to pass before merging", add:
   - `quality`
   - `unit-confidence`
   - `db-confidence`
   - `regression-gate`
   - `build`
   - `sdk`
4. Open a PR — verify `regression-gate` appears as a check
5. Confirm it **blocks merge** when it fails

### 2. Simulate a regression

```bash
# 1. Temporarily lower the golden score baseline
#    In evals/baseline.json, change goldenEval.score from 100 to 200
#    (or change tolerance.scoreDrop to 0 and manually lower score by 1)

# 2. Run the gate — it should FAIL with exit code 1
pnpm eval:regression-gate
# Expected: "❌ REGRESSION DETECTED" with delta table

# 3. Check the report
cat evals/regression-report.json | jq '.category'
# Expected: "regression"

# 4. Revert the change
git checkout evals/baseline.json

# 5. Run again — should PASS
pnpm eval:regression-gate
# Expected: "✅ NO REGRESSION — gate passed"
```

### 3. Simulate an infra error

```bash
# 1. Temporarily rename the baseline file
mv evals/baseline.json evals/baseline.json.bak

# 2. Run the gate — it should fail with exit code 2
pnpm eval:regression-gate
# Expected: "❌ Baseline file not found"

# 3. Restore
mv evals/baseline.json.bak evals/baseline.json
```

If both simulations produce the expected output, the product claim **"Stop regressions in CI"** is provable.

## Metrics Tracked

| Metric | Source | Gating? | Tolerance |
|--------|--------|---------|-----------|
| Golden score | `pnpm eval:golden` → `golden-results.json` | Yes | `tolerance.scoreDrop` (default: 5) |
| Golden pass rate | `pnpm eval:golden` → `golden-results.json` | Yes | `tolerance.passRateDrop` (default: 5%) |
| Unit test count | `pnpm test:confidence` → `confidence-summary.json` | Yes | Must pass |
| DB test count | `pnpm test:confidence` → `confidence-summary.json` | Yes | Must pass |
| p95 API latency | `pnpm eval:latency-benchmark` → `latency-benchmark.json` | Yes | `tolerance.maxLatencyIncreaseMs` (default: 200ms) |
| DB lane duration | `confidence-summary.json` lane durations | No (informational) | — |
| Unit lane duration | `confidence-summary.json` lane durations | No (informational) | — |

## Baseline Provenance

Every baseline includes provenance fields set automatically by `pnpm eval:baseline-update`:

| Field | Description |
|-------|-------------|
| `schemaVersion` | Baseline schema version (currently 1) |
| `generatedAt` | ISO timestamp when baseline was generated |
| `generatedBy` | OS username of the person who generated it |
| `commitSha` | Git HEAD SHA at generation time |

## Anti-Cheat Guards

1. **CODEOWNERS** — `evals/baseline.json` requires approval from `@pauly7610`
2. **Label gate** — PR must have `baseline-update` label
3. **Delta limits** — governance blocks if:
   - Golden score jumps > +5
   - Any tolerance value loosens (scoreDrop, passRateDrop, maxLatencyIncreaseMs, maxCostIncreaseUsd)
4. **Override** — add `baseline-exception` label to bypass delta limits (still needs CODEOWNER approval)

## Report Schema Contract

The report schema is defined in `evals/schemas/regression-report.schema.json` (JSON Schema 2020-12).

Contract tests in `tests/unit/confidence/regression-report-contract.test.ts` validate:
- All required fields exist
- Valid categories and exit codes
- Delta entries have required fields
- Schema file matches the contract constants

### Backward Compatibility Policy

**Breaking change** = removing a required field, renaming a field, or changing the type of an existing field.

**Non-breaking change** = adding optional fields, adding new enum values to `category` or `status`.

When making a breaking change:
1. Bump `REPORT_SCHEMA_VERSION` in `scripts/regression-gate.ts`
2. Update `evals/schemas/regression-report.schema.json`
3. Update the contract test
4. Document the change in `CHANGELOG.md`

Consumers of the report (CI step summary, external tools) should check `schemaVersion` and handle unknown fields gracefully.

## Cross-Platform Support

Both `run-confidence.ts` and `regression-gate.ts` use `spawnSync` (not `execSync` with shell redirection) for cross-platform compatibility. The CI runs on:
- **ubuntu-latest** (required, blocking)
- **windows-latest** (optional, non-blocking — `continue-on-error: true`)
