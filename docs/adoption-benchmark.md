# Time-to-Adopt Benchmark

**Goal:** Median time to first passing CI gate under 15 minutes.

---

## Steps (Fresh Run)

| Step | Action | Est. Time |
|------|--------|-----------|
| 1 | Clone repo, `pnpm install` | 1–2 min |
| 2 | Get API key from platform | 1 min |
| 3 | Create `evalai.config.json` (or use SDK init) | 1 min |
| 4 | Add 2–3 test cases to evaluation | 2–3 min |
| 5 | Add GitHub Actions workflow | 2 min |
| 6 | Push, wait for CI | 3–5 min |
| 7 | Verify annotations visible in PR | 1 min |

**Total:** ~10–15 min

---

## What Counts as Done

- [ ] `evalai check` (or equivalent) runs in CI
- [ ] CI annotations visible on PR (pass/fail, score)
- [ ] At least one evaluation run completes successfully
- [ ] Gate fails when quality score below threshold (optional)

---

## Reference Timestamps (Sample Run)

```
T+0:00  Clone, pnpm install
T+0:45  EVALAI_API_KEY set, evalai init
T+1:30  Test cases added
T+2:15  .github/workflows/ci-eval.yml added
T+2:45  git push
T+5:30  CI job completes, annotations on PR
T+6:00  Done
```

---

## See Also

- [examples/quickstart-ci/](../examples/quickstart-ci/) — Minimal CI setup
- [docs/ci/github-actions.md](./ci/github-actions.md) — Workflow reference
