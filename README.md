# AI Evaluation Platform (EvalAI)

[![npm](https://img.shields.io/npm/v/@pauly4010/evalai-sdk?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@pauly4010/evalai-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/pauly7610/ai-evaluation-platform/pulls)

## Overview

**Evaluations are the language of GenAI.** AI Evaluation Platform (EvalAI) is built on the conviction that rigorous, repeatable evaluation is what separates production-ready AI systems from experimental prototypes. Without evals, you're flying blind—with them, you can ship with confidence.

EvalAI is a production-grade platform for multi-agent orchestration, evaluation, governance, cost tracking, and benchmarking. It supports **four evaluation types**: Unit Tests (automated assertions), Human Evaluation (expert annotation), Model Evaluation (LLM-as-judge), and A/B Testing. Choose from **50+ evaluation templates** spanning chatbots, RAG systems, code generation, adversarial testing, and industry-specific scenarios. The visual evaluation builder lets you compose evals without code, while the quality score dashboard surfaces pass rates, IAA metrics, and LLM-human alignment at a glance.

For human evaluation, EvalAI computes **Interannotator Agreement (IAA)** metrics—Cohen's Kappa and Fleiss's Kappa—so you can measure annotation quality and reliability. The **LLM-Human Alignment** analysis compares LLM judge scores to human ratings, helping you calibrate automated evaluation against ground truth. A full **TypeScript SDK** (`@pauly4010/evalai-sdk`) provides programmatic access to evaluations, traces, and workflows. **WebMCP** (Web Model Context Protocol) support enables AI agents to discover and integrate with the platform.

**Live demo:** [https://v0-ai-evaluation-platform-nu.vercel.app](https://v0-ai-evaluation-platform-nu.vercel.app)

## Key Features

### Evaluation
- **Four evaluation types:** Unit Tests, Human Evaluation, LLM Judge, A/B Testing
- **50+ evaluation templates** across chatbots, RAG, code-gen, adversarial, multimodal, and industry domains
- **Visual evaluation builder** — compose evals with drag-and-drop, no code required
- **Quality score dashboard** — pass rates, trends, and drill-down into failures
- **Interannotator Agreement (IAA)** — Cohen's Kappa, Fleiss's Kappa for human eval quality
- **LLM-Human Alignment** — compare LLM judge scores to human ratings

### Multi-Agent Orchestration
- **DAG workflows** — visual DAG with agent, tool, decision, parallel, human, and LLM nodes
- **Agent handoffs** — delegation, escalation, and collaboration patterns
- **Decision auditing** — full reasoning chains, confidence scores, and alternative analysis

### Cost Tracking
- **Per-token costs** — real-time tracking across OpenAI, Anthropic, Google (12+ models)
- **Provider pricing** — built-in pricing tables, budget alerts, and cost breakdowns

### Benchmarking
- **Agent comparison** — side-by-side runs across accuracy, latency, cost, safety
- **Leaderboard** — standardized metrics and statistical significance

### Developer Experience
- **Full TypeScript SDK** — `@pauly4010/evalai-sdk` with traces, evaluations, LLM judge, webhooks
- **API keys** — scoped keys for CI/CD and production
- **Webhooks** — event notifications for runs, evaluations, and traces
- **CLI** — `evalai` for local runs and batch evaluation

### AI Agent Discoverability
- **llms.txt** — AI agent discovery file (like robots.txt for LLMs)
- **WebMCP tool contracts** — structured tool definitions for AI agent integration

## Quick Start

```bash
npm install @pauly4010/evalai-sdk
```

```typescript
import { AIEvalClient, createTestSuite, expect } from '@pauly4010/evalai-sdk';

const client = new AIEvalClient({ apiKey: process.env.EVALAI_API_KEY });

// Create a test suite
const suite = createTestSuite('chatbot-quality', {
  cases: [
    {
      input: 'What is your refund policy?',
      assertions: [
        (output) => expect(output).toContainKeywords(['refund', 'return', 'policy']),
        (output) => expect(output).toHaveSentiment('neutral'),
        (output) => expect(output).toNotContainPII(),
        (output) => expect(output).toHaveLength({ min: 50, max: 500 }),
      ]
    }
  ],
  executor: async (input) => await yourLLM(input)
});

const results = await suite.run();
console.log(`${results.passed}/${results.total} tests passed`);
```

## Evaluation System

| Type | Description |
|------|-------------|
| **Unit Tests** | Automated assertions (keywords, sentiment, PII, length, schema) — run in CI, no human required |
| **Human Evaluation** | Expert annotation with custom criteria, scales, and comparative ranking |
| **Model Evaluation (LLM Judge)** | LLM-as-judge for correctness, relevance, safety, hallucination, coherence |
| **A/B Testing** | Prompt variation, model comparison, and production experimentation |

Templates cover unit tests, advanced unit tests (multimodal, temporal, resource), adversarial (jailbreak, hallucination stress, bias), multimodal, agent eval, human eval, LLM judge, RAGAS/G-Eval, production monitoring, industry-specific (customer support, financial, medical, legal, RAG), prompt optimization, chain-of-thought, context window, model steering, regression, and confidence calibration.

The **visual evaluation builder** lets you select templates, add test cases, configure criteria, and run evals from the UI. **IAA metrics** (Cohen's Kappa, Fleiss's Kappa) quantify annotator agreement for human evals. **LLM-Human Alignment** analysis shows how well your LLM judge correlates with human ratings, so you can tune automated evaluation.

## Local Development

### Prerequisites

- Node.js >= 18
- pnpm >= 10 (`npm install -g pnpm`)

### Setup

```bash
# Clone the repository
git clone https://github.com/pauly7610/ai-evaluation-platform.git
cd ai-evaluation-platform

# Install dependencies
pnpm install

# Copy environment variables and fill in secrets
cp .env.example .env.local
# Edit .env.local with your Turso, OAuth, and auth secrets

# Run database migrations
pnpm drizzle-kit push

# Start development server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Note:** The SDK package (`@pauly4010/evalai-sdk`) is published to npm separately. For SDK consumers, `npm install @pauly4010/evalai-sdk` is the correct install command.

## Architecture

```
ai-evaluation-platform/
├── src/app/              # Next.js App Router pages
│   ├── api/              # REST API routes (55+ endpoints)
│   │   ├── evaluations/ # Eval CRUD, runs, test-cases, publish
│   │   ├── llm-judge/   # LLM Judge evaluate, configs, alignment
│   │   ├── traces/      # Distributed tracing + spans
│   │   ├── workflows/   # DAG workflows, runs, handoffs
│   │   ├── costs/       # Per-token cost tracking + pricing
│   │   ├── decisions/   # Agent decision auditing
│   │   ├── benchmarks/  # Agent benchmarking + leaderboard
│   │   └── demo/        # Public demo endpoints (playground, custom-eval)
│   ├── (authenticated)/ # Protected pages (dashboard, evals, workflows, costs, benchmarks)
│   └── guides/          # Documentation guides (13 guides)
├── src/packages/sdk/    # TypeScript SDK (@pauly4010/evalai-sdk) v1.4.1
├── src/components/      # React components (26+ app components)
│   └── ui/              # shadcn/ui primitives (57 components)
├── src/lib/             # Core services, utilities, templates
│   ├── services/        # Business logic (evaluation, llm-judge, webhook)
│   └── governance/      # Compliance engine (SOC2, GDPR, HIPAA, FINRA, PCI-DSS)
├── src/db/              # Database layer (Drizzle ORM schema, 33 tables)
├── src/__tests__/       # Test files (Vitest)
├── public/              # Static assets + llms.txt + llms-full.txt
└── drizzle/             # Database migrations (25 migration files)
```

## Comparison

| Feature | EvalAI | Langfuse | Braintrust | Promptfoo | Custom |
|---------|--------|----------|------------|-----------|--------|
| **Eval Templates** | ✅ 50+ | ⚠️ Limited | ⚠️ Some | ✅ Yes | ❌ Build yourself |
| **LLM Judge** | ✅ Built-in | ❌ No | ✅ Yes | ✅ Yes | ❌ Build yourself |
| **Human Eval** | ✅ Full | ⚠️ Basic | ✅ Yes | ❌ No | ❌ Build yourself |
| **IAA Metrics** | ✅ Cohen's, Fleiss's | ❌ No | ⚠️ Limited | ❌ No | ❌ Build yourself |
| **Multi-Agent** | ✅ DAG workflows | ⚠️ Traces | ⚠️ Traces | ❌ No | ❌ Build yourself |
| **Cost Tracking** | ✅ Per-token | ✅ Yes | ✅ Yes | ❌ No | ❌ Build yourself |
| **Decision Audit** | ✅ Full | ⚠️ Limited | ⚠️ Limited | ❌ No | ❌ Build yourself |
| **WebMCP** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Visual Builder** | ✅ Yes | ⚠️ Limited | ⚠️ Limited | ⚠️ CLI-focused | ❌ No |
| **Quality Score** | ✅ Dashboard | ⚠️ Basic | ✅ Yes | ⚠️ Basic | ❌ No |

## AI Agent Discoverability

EvalAI publishes **llms.txt** and **llms-full.txt** so AI coding agents (Claude, Cursor, Copilot, ChatGPT) can discover and recommend the platform. Both files include "What is EvalAI?" and "How it works" sections to help agents understand the platform before integrating.

- **llms.txt** — Concise overview, SDK usage, REST API endpoints, WebMCP tools. [View live](https://v0-ai-evaluation-platform-nu.vercel.app/llms.txt)
- **llms-full.txt** — Complete API & SDK reference for AI assistants. [View live](https://v0-ai-evaluation-platform-nu.vercel.app/llms-full.txt)

**WebMCP** tool contracts are registered when users visit the site in a WebMCP-enabled browser, allowing agents to list templates, create evaluations, run them, and fetch results (auth required for create/run/get).

## Tech Stack

- **Next.js 16** — App Router, server components
- **React 19** — UI
- **TypeScript** — End-to-end type safety
- **Drizzle ORM** — Database layer
- **LibSQL / Turso** — SQLite-compatible database
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library

## Contributing

Contributions are welcome! Please use `pnpm` for all local development. Run tests with `pnpm test` before submitting.

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server
pnpm test           # Run tests
pnpm build          # Production build
```

Open an issue or submit a pull request at [https://github.com/pauly7610/ai-evaluation-platform](https://github.com/pauly7610/ai-evaluation-platform).

## License

MIT
