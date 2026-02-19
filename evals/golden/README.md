# Golden Dataset

Frozen eval dataset that must never regress. Run with:

```bash
pnpm eval:golden
```

- **Without OPENAI_API_KEY:** Uses deterministic mock executor (CI-friendly).
- **With OPENAI_API_KEY:** Runs real LLM eval against the cases.

Edit `cases.json` to add/change cases. Bump `minScore` if you add harder cases.
