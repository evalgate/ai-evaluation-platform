# EvalAI Quickstart CI

Minimal example that runs an evaluation in CI and gates on quality score.

## Setup

1. Copy this folder to your project or use it as reference.
2. Create an API key at [EvalAI](https://v0-ai-evaluation-platform-nu.vercel.app) (owner/admin role).
3. Deploy a webhook endpoint that accepts `POST { input: string }` and returns `{ output: string }`.

## Run Locally

```bash
npm install
EVALAI_API_KEY=sk_test_xxx WEBHOOK_URL=https://your-endpoint.com/api/generate npm run ci
```

## GitHub Actions

Add a workflow that runs `npm run ci` with secrets:

- `EVALAI_API_KEY` — Your API key
- `WEBHOOK_URL` — Your webhook endpoint URL

See [docs/quickstart.md](../../docs/quickstart.md) for full documentation.
