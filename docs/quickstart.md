# EvalAI Quickstart

Get from zero to a gated evaluation run in CI in under 15 minutes.

## Prerequisites

- Node.js 18+
- An EvalAI account and API key (create at [v0-ai-evaluation-platform-nu.vercel.app](https://v0-ai-evaluation-platform-nu.vercel.app))
- A webhook endpoint that accepts `POST { input: string }` and returns `{ output: string }`

## Step 1: Install the SDK

```bash
npm install @pauly4010/evalai-sdk
```

## Step 2: Create an Evaluation with Webhook Executor

The webhook executor sends test inputs to your endpoint and scores the responses. It works with any model, framework, or language.

```typescript
import { AIEvalClient } from '@pauly4010/evalai-sdk';

const client = new AIEvalClient({
  baseUrl: process.env.EVALAI_BASE_URL || 'https://v0-ai-evaluation-platform-nu.vercel.app',
  apiKey: process.env.EVALAI_API_KEY!,
});

const evaluation = await client.evaluations.create({
  name: 'Chatbot Quality Gate',
  description: 'CI gate for production chatbot',
  type: 'unit_test',
  executorType: 'webhook',
  executorConfig: {
    url: process.env.WEBHOOK_URL!,
    secret: process.env.WEBHOOK_SECRET,
  },
});
```

## Step 3: Add Test Cases

```typescript
const testCases = [
  { name: 'Greeting', input: 'Hello!', expectedOutput: 'greeting' },
  { name: 'Product', input: 'What do you sell?', expectedOutput: 'product info' },
];

for (const tc of testCases) {
  await client.evaluations.createTestCase(evaluation.id, tc);
}
```

## Step 4: Run the Evaluation

```typescript
const run = await client.evaluations.createRun(evaluation.id, {});

// Poll for completion
while (run.status === 'pending' || run.status === 'running') {
  await new Promise((r) => setTimeout(r, 3000));
  const updated = await client.evaluations.getRun(evaluation.id, run.id);
  Object.assign(run, updated);
}
```

## Step 5: Check the Score (Gate)

Use the `evalai` CLI to gate on quality score:

```bash
npx evalai check --evaluationId <id> --minScore 85 --minN 5
```

Or fetch the score programmatically:

```typescript
const res = await fetch(
  `${baseUrl}/api/quality?evaluationId=${evaluation.id}&action=latest`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
);
const { score, total, evidenceLevel, flags } = await res.json();
if (score < 85) process.exit(1);
```

## Step 6: Generate a Signed Report

For audit trails and compliance:

```typescript
const reportRes = await fetch(`${baseUrl}/api/reports`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    evaluationId: evaluation.id,
    evaluationRunId: run.id,
  }),
});
const { shareUrl } = await reportRes.json();
console.log('Report:', shareUrl);
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EVALAI_API_KEY` | Your API key (required) |
| `EVALAI_BASE_URL` | API base URL (default: production) |
| `WEBHOOK_URL` | Your endpoint URL for webhook executor |
| `WEBHOOK_SECRET` | Optional secret for `X-EvalAI-Secret` header |

## CI Integration

See `examples/quickstart-ci/` for a minimal project that runs in GitHub Actions. The workflow:

1. Creates an evaluation with webhook executor
2. Adds test cases
3. Runs the evaluation
4. Gates on `evalai check --minScore 85`
5. Exits with code 0 (pass) or 1+ (fail)

## CLI Reference

```bash
evalai check --evaluationId <id> [options]
  --minScore <n>       Fail if score < n (0-100)
  --minN <n>           Fail if total test cases < n
  --allowWeakEvidence  Permit weak evidence level
  --maxDrop <n>        Fail if regression > n points
  --policy <name>      Enforce HIPAA, SOC2, GDPR, etc.
```
