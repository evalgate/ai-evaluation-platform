# Golden Dataset

Frozen eval dataset that must never regress. This directory is the checked-in golden path for automated regression: the cases here back the repo's golden evaluation lane, while `.evalgate/golden/labeled.jsonl` remains the canonical labeled dataset for trace review, analysis, and synthesis workflows.

Run the golden suite with:

```bash
pnpm eval:golden
```

- **Without OPENAI_API_KEY:** Uses deterministic mock executor (CI-friendly).
- **With OPENAI_API_KEY:** Runs real LLM eval against the cases.
- **In the broader workflow:** Review failures with `evalgate label`, analyze them with `evalgate analyze`, draft broader cases with `evalgate synthesize`, then promote accepted cases back into your automated regression suite.

Edit `cases.json` to add/change cases. Bump `minScore` if you add harder cases.
