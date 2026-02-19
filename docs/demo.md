# EvalAI Gate — Before & After

Show, don't tell. Here's what a failing gate looks like in GitHub Actions, and what it looks like after you fix the regression.

## Failing Gate

When your score drops below the baseline, CI fails. With `--format github`, you get:

- **Annotations** — `::error` markers on failed test cases (visible in Files changed)
- **Step summary** — Verdict, score, delta vs baseline, and failing cases

![EvalAI gate failure — score 78/100, baseline 92, -14 pts, 2 failing cases](images/evalai-gate-fail.png)

Example output:

```
## EvalAI Gate

❌ FAILED: score_below_baseline

**Score:** 78/100 (baseline 92, -14 pts)

### 2 failing cases

- **Hello** — expected: greeting, got "Hi there"
- **2 + 2 = ?** — expected: 4, got ""

[View Dashboard](...)
```

## Passing Gate

After you fix the regressions (or adjust the baseline), the gate passes.

![EvalAI gate pass — score 92/100](images/evalai-gate-pass.png)

```
## EvalAI Gate

✅ PASSED

**Score:** 92/100
```

## How to Capture Screenshots

1. Add the [GitHub Actions workflow](ci/github-actions.md) to your repo
2. Intentionally break a test case to trigger a failure
3. Screenshot the "EvalAI gate" step in the Actions run
4. Fix the regression and screenshot the passing run

Place images in `docs/images/` as `evalai-gate-fail.png` and `evalai-gate-pass.png`. Run `pnpm create:demo-placeholders` to create minimal placeholders (replace with real screenshots).
