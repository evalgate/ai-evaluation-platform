# CI Quickstart: Adopt EvalAI in 60 Seconds

## 🚀 One-Command CI Setup

Add this to your `.github/workflows/evalai.yml`:

```yaml
name: EvalAI CI
on: [push, pull_request]
jobs:
  evalai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx evalai ci --format github --write-results --base main
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: evalai-results
          path: .evalai/
```

That's it! Your CI now:
- ✅ Discovers all evaluation specs
- ✅ Runs only impacted specs (if changes detected)
- ✅ Compares results against base branch
- ✅ Posts rich summary in PR
- ✅ Exits with proper codes (0/1/2)

## 📊 What Happens in CI

### Exit Codes
- **0** - Clean: No regressions detected
- **1** - Regressions: Tests failed or scores dropped
- **2** - Config issue: Missing artifacts, API key, etc.

### Artifacts
- `.evalai/last-run.json` - Latest run results
- `.evalai/runs/run-*.json` - All run history
- `.evalai/runs/index.json` - Run metadata index

### GitHub Step Summary
Automatic PR summary with:
- 📊 Pass rate delta and score changes
- 🚨 Regressions detected (if any)
- 📈 Improvements and new specs
- 📁 Links to run artifacts

## 🔧 Debugging CI Failures

### Missing Base Artifact
```bash
# Download base artifact from base branch workflow
# Save as .evalai/base-run.json
evalai diff --base .evalai/base-run.json --head .evalai/last-run.json
```

### Local Debugging
```bash
# Run same as CI locally
npx evalai ci --base main

# Explain any failure
evalai explain --report .evalai/last-run.json

# Check setup
evalai doctor
```

### Impact Analysis
```bash
# See what would run (dry run)
evalai impact-analysis --base main

# Run only impacted specs
npx evalai ci --base main --impacted-only
```

## 🎯 Advanced Options

### Custom Base Branch
```yaml
- run: npx evalai ci --base develop --format github --write-results
```

### No Diff (Run Only)
```yaml
- run: npx evalai ci --format github --write-results
```

### JSON Output for Automation
```yaml
- run: npx evalai ci --format json --write-results > evalai-results.json
```

## 📚 Next Steps

- **[Architecture Guide](ARCHITECTURE.md)** - Deep dive on system design
- **[Regression Gate](REGRESSION_GATE.md)** - Advanced gate configuration
- **[CI Artifacts](CI_ARTIFACTS.md)** - Artifact management
- **[AI Assistant Integration](AI_ASSISTANT_INTEGRATION.md)** - IDE integration

---

**Need help?** Run `evalai doctor` for setup diagnostics or `evalai explain` for failure analysis.
