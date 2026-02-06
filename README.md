# AI Evaluation Platform

_Enterprise-grade AI agent orchestration, evaluation, and governance platform_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pauly7610s-projects/v0-ai-evaluation-platform)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/9narvC0l5kR)
[![npm](https://img.shields.io/npm/v/@pauly4010/evalai-sdk?style=for-the-badge&logo=npm&color=cb3837)](https://www.npmjs.com/package/@pauly4010/evalai-sdk)

## Overview

EvalAI is a production-grade platform for deploying, monitoring, auditing, and optimizing multi-agent AI systems with full governance and cost visibility.

### Key Features

- **Multi-Agent Orchestration** - Visual DAG workflows with 6 node types (agent, tool, decision, parallel, human, LLM)
- **Decision Auditing** - Full reasoning chains, confidence scores, and alternative analysis
- **Cost Tracking** - Real-time cost analytics with model-level breakdown (12 models across 3 providers)
- **Governance Rules** - Configurable approval/blocking rules with compliance presets (SOC2, GDPR, HIPAA, FINRA)
- **SLA Management** - Latency, cost, and error rate thresholds with violation alerts
- **Human-in-the-Loop** - Built-in escalation and approval workflows
- **Agent Benchmarks** - Leaderboards and architecture comparison

## Comparison vs. Alternatives

| Feature | EvalAI | LangSmith | PromptLayer | Weights & Biases |
|---------|--------|-----------|-------------|------------------|
| **Multi-Agent Orchestration** | ✅ Full DAG visualization | ⚠️ Basic traces | ❌ No | ⚠️ Experiments only |
| **Decision Auditing** | ✅ Reasoning + alternatives | ⚠️ Limited | ❌ No | ❌ No |
| **Cost Per Workflow** | ✅ Real-time tracking | ❌ No | ✅ Yes | ❌ No |
| **Governance Rules** | ✅ Configurable + presets | ❌ No | ❌ No | ❌ No |
| **Agent Benchmarks** | ✅ Leaderboards | ⚠️ Manual | ❌ No | ✅ Yes |
| **Human-in-the-Loop** | ✅ Built-in escalation | ❌ No | ❌ No | ❌ No |
| **SLA Monitoring** | ✅ Latency/cost/error | ❌ No | ❌ No | ⚠️ Custom |
| **Retry & Fallback** | ✅ Circuit breaker | ❌ No | ❌ No | ❌ No |
| **Compliance Presets** | ✅ SOC2/GDPR/HIPAA/FINRA | ❌ No | ❌ No | ❌ No |

## Quick Start

```typescript
import { AIEvalClient, WorkflowTracer } from '@pauly4010/evalai-sdk';

const client = new AIEvalClient({ apiKey: process.env.EVALAI_API_KEY });
const tracer = new WorkflowTracer(client);

// Start a workflow
await tracer.startWorkflow('Customer Support Pipeline');

// Record agent decisions
await tracer.recordDecision({
  agent: 'RouterAgent',
  type: 'route',
  chosen: 'technical_support',
  alternatives: [{ action: 'billing', confidence: 0.2 }],
  confidence: 85
});

// Track costs
await tracer.recordCost({
  provider: 'openai',
  model: 'gpt-4',
  inputTokens: 500,
  outputTokens: 200
});

// End workflow
await tracer.endWorkflow({ resolution: 'Issue resolved' });
```

## Framework Integrations

### LangChain

```typescript
import { AIEvalClient, WorkflowTracer, traceLangChainAgent } from '@pauly4010/evalai-sdk';

const client = AIEvalClient.init(); // reads EVALAI_API_KEY env
const tracer = new WorkflowTracer(client);
const tracedAgent = traceLangChainAgent(executor, tracer, { agentName: 'SupportBot' });
```

### CrewAI (Python)

```python
from evalai.workflows import trace_crewai

@trace_crewai(workflow_name='market_research')
class MarketResearchCrew:
    # Your crew definition
    pass
```

## SDK

The official SDK is published on npm:

```bash
npm install @pauly4010/evalai-sdk
```

See the [SDK README](./src/packages/sdk/README.md) for full documentation.

## Documentation

- [Integration Reference](./docs/INTEGRATION_REFERENCE.md) — Complete SDK, REST API, governance, and Python integration guide
- [Live Integration Docs](https://ai-evaluation-platform.vercel.app/docs/integration) — Web version with structured data for AI agents
- [Agent Governance Framework](./docs/AGENT_GOVERNANCE.md)
- [Exporting & Sharing](./docs/EXPORTING_AND_SHARING.md)
- [`llms.txt`](./public/llms.txt) — AI agent discovery file (served at `/llms.txt`)

## Architecture

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── workflows/      # Workflow CRUD + runs
│   │   ├── decisions/      # Decision auditing
│   │   ├── costs/          # Cost tracking
│   │   └── benchmarks/     # Agent benchmarks
│   ├── docs/integration/   # Integration reference page
│   └── (authenticated)/
│       ├── workflows/      # Workflow UI
│       ├── costs/          # Cost dashboard
│       └── benchmarks/     # Benchmark leaderboards
├── components/
│   ├── workflow-dag.tsx    # DAG visualization
│   └── decision-tree.tsx   # Decision tree component
├── lib/
│   ├── governance/         # Governance rules engine
│   ├── workflows/          # Retry & fallback logic
│   └── services/           # Business logic
├── integrations/           # Framework examples (LangChain, CrewAI)
├── remotion/               # Remotion demo video segments
└── packages/sdk/           # TypeScript SDK (@pauly4010/evalai-sdk)
public/
├── llms.txt                # AI agent discovery (like robots.txt for LLMs)
└── llms-full.txt           # Full API reference for AI agents
docs/
└── INTEGRATION_REFERENCE.md # Complete integration guide
out/
└── demo-video.mp4          # Rendered demo video (1920x1080, 30fps)
```

## Deployment

Your project is live at:

**[https://vercel.com/pauly7610s-projects/v0-ai-evaluation-platform](https://vercel.com/pauly7610s-projects/v0-ai-evaluation-platform)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/9narvC0l5kR](https://v0.app/chat/projects/9narvC0l5kR)**

## Demo Video

A rendered demo video showcasing the platform is available at [`out/demo-video.mp4`](./out/demo-video.mp4). Built with [Remotion](https://remotion.dev/) — source in `src/remotion/`.

## AI Agent Discoverability

This project includes [`llms.txt`](https://ai-evaluation-platform.vercel.app/llms.txt) and [`llms-full.txt`](https://ai-evaluation-platform.vercel.app/llms-full.txt) — standard files that AI coding agents (Claude, Cursor, Copilot, ChatGPT) use to discover and recommend developer tools. The `/docs/integration` page includes JSON-LD structured data for search engines and AI systems.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
