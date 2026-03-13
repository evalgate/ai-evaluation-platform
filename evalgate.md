# EvalGate — Golden Datasets, Regression Gates, and Guided Optimization

EvalGate is a full AI quality suite for teams that want more than a single pass/fail gate. It helps you discover coverage overlap, cluster failures, build golden datasets, synthesize broader cases, run automated regression gates, and guide prompt optimization with explicit budgets.

## Quick Start

```bash
# Scaffold the project and baseline
npx evalgate init --template chatbot
npx evalgate discover --manifest
npx evalgate run
npx evalgate gate
```

## Documentation

- **📖 Zero to Golden Dataset** - `docs/ZERO_TO_GOLDEN_DATASET.md`
- **🧪 Golden Path Demo** - `docs/GOLDEN_PATH.md`
- **📉 Regression Gate** - `docs/REGRESSION_GATE.md`
- **📊 Production Trace Collection** - reportTrace() guide with asymmetric sampling
- **🔄 Replay Commands** - Candidate replay and automated decisions
- **🏥 System Health** - evalgate doctor for configuration validation

## What EvalGate Does

- **Behavioral testing**: Run evaluation specs against your model and capture pass/fail outcomes
- **Coverage discovery**: Find overlapping specs and redundant coverage before adding more evals
- **Failure clustering**: Group similar failures so teams label and debug by pattern instead of by raw arrival order
- **Golden datasets**: Label traces, analyze failure modes, and grow a canonical `.evalgate/golden/labeled.jsonl`
- **Golden-case synthesis**: Expand repeated failure patterns into deterministic draft cases for review and promotion
- **Automated regression**: Compare current behavior against a baseline and block merges when quality drops
- **Guided optimization**: Run bounded prompt-improvement loops with explicit `keep`, `discard`, or `investigate` outcomes
- **Artifact persistence**: Save datasets, analyses, diversity reports, clusters, and syntheses so work can be reopened later
- **Root cause analysis**: Explain failures with actionable next steps and suggested fixes

## Core Concepts

### Evaluations & Specs
An **evaluation** is a collection of **specs** (test cases). Each spec contains:
- Input prompt
- Expected output/behavior
- Optional assertions (JSON schema, regex, custom validators)
- Optional metadata (tags, severity, cost tier)

### Runs & Baselines
A **run** executes all specs and records results. A **baseline** is a published run that represents the accepted behavior. EvalGate compares new runs against the baseline to detect changes.

### Gates
A **gate** enforces quality rules:
- Pass rate thresholds
- Score thresholds
- Cost and latency budgets
- Policy compliance (HIPAA, SOC2, etc.)
- Judge credibility (when using LLM judges)

## Command Reference

### `evalgate init` — Project Setup
```bash
npx evalgate init [--template <name>] [--list-templates]
```
Creates `evalgate.config.json`, `evals/baseline.json`, and GitHub Actions workflow.

Templates: `chatbot`, `codegen`, `agent`, `safety`, `rag`

### `evalgate run` — Execute Evaluations
```bash
npx evalgate run [--spec-ids <ids>] [--impacted-only] [--base <branch>] [--format <fmt>] [--write-results]
```
Runs evaluation specs and produces a run report.

### `evalgate discover` — Coverage & Diversity
```bash
npx evalgate discover [--manifest]
```
Scans evaluation specs, regenerates the manifest, and reports diversity / redundant spec pairs so you can tighten coverage before shipping.

### `evalgate cluster` — Failure Pattern Grouping
```bash
npx evalgate cluster [--run <path>] [--output <path>]
```
Groups similar failures from a saved run artifact so triage and labeling happen cluster-by-cluster.

### `evalgate gate` — Local Regression Gate
```bash
npx evalgate gate [--format <fmt>] [--dry-run]
```
Compares current run against baseline without requiring API access.

### `evalgate ci` — Full CI Pipeline
```bash
npx evalgate ci [--base <branch>] [--impacted-only] [--format <fmt>] [--write-results]
```
Runs the complete CI-oriented workflow with discovery, impact analysis, execution, and regression reporting.

### `evalgate check` — API-Based Gate
```bash
npx evalgate check [--evaluationId <id>] [--minScore <n>] [--maxDrop <n>] [--policy <name>]
```
Cloud-based gate with advanced analytics and judge alignment.

### `evalgate failure-modes` — Failure Taxonomy Setup
```bash
npx evalgate failure-modes
```
Defines the app-specific failure mode taxonomy used during labeling, analysis, alerting, and prioritization.

### `evalgate label` — Interactive Trace Labeling
```bash
npx evalgate label [--run <path>] [--output <path>] [--format <fmt>]
```
Step through traces, label pass/fail, tag failure modes. Builds golden dataset for `evalgate analyze`.

### `evalgate analyze` — Failure Mode Analysis
```bash
npx evalgate analyze [--dataset <path>] [--format <fmt>] [--top <n>]
```
Analyzes labeled golden dataset to surface top failure modes and frequencies.

### `evalgate synthesize` — Golden Dataset Expansion
```bash
npx evalgate synthesize [--dataset <path>] [--dimensions <path>] [--output <path>]
```
Turns repeated labeled failures into deterministic golden-case drafts that can be reviewed, accepted, and promoted.

### `evalgate auto` — Guided Optimization Loop
```bash
npx evalgate auto [--objective <mode>] [--prompt <file>] [--budget <n>]
npx evalgate auto daemon [--cycles <n>] [--once]
```
Runs a bounded prompt optimization loop and emits `keep`, `discard`, or `investigate` decisions instead of silently mutating your suite.

### `evalgate diff` — Run Comparison
```bash
npx evalgate diff [--base <ref>] [--head <path>] [--format <fmt>]
```
Compare two runs and see behavioral changes, regressions, and improvements.

### `evalgate explain` — Failure Explanation
```bash
npx evalgate explain [--report <path>] [--format <fmt>]
```
Explains last gate/check failure with root causes and suggested fixes.

### `evalgate doctor` — Readiness Checklist
```bash
npx evalgate doctor [--report]
```
Comprehensive CI/CD readiness check with exact remediation commands.

## Configuration

`evalgate.config.json` defines your evaluation setup:

```json
{
  "evaluationId": "your-eval-id",
  "baseline": "evals/baseline.json",
  "gate": {
    "minPassRate": 0.95,
    "maxCostUsd": 10.0,
    "maxLatencyMs": 5000
  },
  "judge": {
    "labeledDatasetPath": ".evalgate/golden/labeled.jsonl",
    "alignmentThresholds": {
      "minTpr": 0.8,
      "minTnr": 0.8
    },
    "bootstrapIterations": 1000,
    "bootstrapSeed": 42
  }
}
```

## CI/CD Integration

EvalGate includes a GitHub Actions workflow that:
- Runs evaluations on every PR
- Comments with behavioral diffs
- Enforces quality gates
- Updates baselines on merge

```yaml
# .github/workflows/evalgate-gate.yml
name: EvalGate
on: [pull_request]
jobs:
  evalgate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx evalgate ci --base main
```

## Full Suite Workflow

1. **Discover overlap before adding more tests**: `npx evalgate discover --manifest`
2. **Run evaluations and save artifacts**: `npx evalgate run --write-results`
3. **Cluster failures by pattern**: `npx evalgate cluster --run .evalgate/runs/latest.json`
4. **Label and analyze the golden dataset**: `npx evalgate label` then `npx evalgate analyze --top 10`
5. **Draft broader golden cases**: `npx evalgate synthesize --dataset .evalgate/golden/labeled.jsonl --output .evalgate/golden/synthetic.jsonl`
6. **Block regressions or try guided optimization**: `npx evalgate gate`, `npx evalgate ci`, `npx evalgate replay-decision`, or `npx evalgate auto`

In the platform UI, saved artifacts and auto sessions mirror the same workflow so datasets, analyses, diversity reports, clusters, syntheses, and optimization runs can be reopened, reviewed, or promoted later.

## Advanced Features

### Impact Analysis
Run only specs affected by code changes:
```bash
npx evalgate run --impacted-only --base main
```

### Watch Mode
Auto-rerun on file changes:
```bash
npx evalgate run --watch
```

### Judge Credibility
When using LLM judges, EvalGate automatically:
- Calculates TPR/TNR from labeled golden dataset
- Applies bootstrap confidence intervals
- Skips correction for weak discriminative power
- Falls back to raw pass rates with warnings

### Cost & Latency Budgeting
Set per-eval budgets and get alerts:
```json
{
  "gate": {
    "maxCostUsd": 25.0,
    "maxLatencyMs": 3000
  }
}
```

## Troubleshooting

### Common Issues

**"No baseline found"**
- Run: `npx evalgate baseline init` or `npx evalgate init`

**"Evaluation not found"**
- Check `evaluationId` in config or use `--evaluationId` flag

**"Judge credibility warnings"**
- Ensure labeled dataset has sufficient samples (>30)
- Check discriminative power (TPR+TNR-1 > 0.05)

### Debug Commands

```bash
npx evalgate doctor          # Full readiness check
npx evalgate print-config    # Show resolved config
npx evalgate explain         # Last failure analysis
```

## Next Steps

- Explore templates: `npx evalgate init --list-templates`
- Read [ZERO_TO_GOLDEN_DATASET.md](docs/ZERO_TO_GOLDEN_DATASET.md) for the end-to-end onboarding flow
- Read [REGRESSION_GATE.md](docs/REGRESSION_GATE.md) for automated regression setup and governance
- Check [LABELED_DATASET_SCHEMA.md](docs/LABELED_DATASET_SCHEMA.md) for the canonical golden dataset format
- Run the [GOLDEN_PATH.md](docs/GOLDEN_PATH.md) demo to validate the full loop locally
- Join discussions in GitHub Issues

---

EvalGate helps you ship with confidence. 🚀
