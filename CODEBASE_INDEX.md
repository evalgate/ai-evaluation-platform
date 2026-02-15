# AI Evaluation Platform - Complete Codebase Index

**Generated:** Saturday, February 15, 2026  
**Project:** AI Evaluation Platform  
**Framework:** Next.js 15.5.6 with React 19, TypeScript, Drizzle ORM  
**Database:** Turso (LibSQL/SQLite)  
**Authentication:** better-auth 1.3.27  
**Billing:** Autumn.js 0.1.40  
**SDK Version:** v1.3.0 (100% API Coverage + WebMCP)  
**Testing:** Vitest 3.2.4 with React Testing Library

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Pages & Routes](#pages--routes)
8. [Components](#components)
9. [SDK Package](#sdk-package)
10. [Shared Packages](#shared-packages)
11. [Configuration Files](#configuration-files)
12. [Key Technologies](#key-technologies)

---

## 📖 Project Overview

The AI Evaluation Platform is a comprehensive end-to-end platform for evaluating AI systems, particularly Large Language Models (LLMs). It provides:

- **Unit Testing** - Automated assertions for validating LLM outputs
- **Human Evaluation** - Expert annotation and feedback workflows
- **LLM Judge** - Model-as-a-judge evaluations with custom criteria
- **Tracing** - Observability and debugging for LLM calls
- **A/B Testing** - Production experimentation capabilities
- **Developer Tools** - API keys, webhooks, usage analytics
- **Multi-Agent Orchestration** - DAG workflows, agent handoffs, decision auditing
- **Cost Analytics** - Per-token cost tracking across 12+ LLM models
- **Agent Benchmarking** - Compare agent architectures with leaderboard
- **Interactive Playground** - Try evaluations with no signup (including custom eval mode)
- **50+ Evaluation Templates** - Across 17 categories

The platform was built with v0.app and is deployed on Vercel with automatic syncing.

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4.1.9
- shadcn/ui (Radix UI components)
- Recharts for visualization

**Backend:**

- Next.js API Routes
- Drizzle ORM 0.44.6
- Turso Database (LibSQL)
- better-auth 1.3.27 for authentication

**Billing & Features:**

- Autumn.js (autumn-js 0.1.40, atmn 0.0.27)
- Feature-gated API routes
- Usage tracking and limits

**Developer Experience:**

- Custom SDK (`@pauly4010/evalai-sdk`)
- TypeScript with strict mode
- ESLint configuration
- Geist font family

### Key Patterns

1. **Server-Side Feature Gating** - All API routes check quotas server-side
2. **Context Propagation** - Metadata flows through traces automatically
3. **Retry Logic** - Built-in retry with exponential backoff
4. **Type Safety** - Comprehensive TypeScript types across SDK and API
5. **Middleware Auth** - Protected routes with better-auth sessions
6. **Rate Limiting** - Upstash Redis with tiered limits (free: 100/min, pro: 1000/min, enterprise: 10000/min)
7. **Error Monitoring** - Sentry integration across server, edge, and instrumentation
8. **Testing Infrastructure** - Vitest with React Testing Library for unit/integration tests

---

## 📁 Directory Structure

```
ai-evaluation-platform/
├── drizzle/                    # Database migrations
│   ├── 0000_uneven_gamma_corps.sql
│   ├── 0001_luxuriant_squirrel_girl.sql
│   ├── 0002_hard_marvex.sql
│   ├── 0003_curious_the_leader.sql
│   ├── 0004_keen_wither.sql
│   ├── 0005_add_performance_indexes.sql
│   ├── 0006_add_advanced_indexes.sql
│   ├── 0007_add_email_subscribers.sql
│   ├── 0008_add_llm_judge_result_fks.sql
│   └── meta/                   # Migration metadata
│
├── public/                     # Static assets
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   ├── placeholder-logo.png/svg
│   ├── placeholder-user.jpg
│   └── placeholder.jpg/svg
│
├── src/
│   ├── __tests__/              # Test files
│   │   ├── api/                # API route tests
│   │   ├── components/         # Component tests
│   │   ├── hooks/              # Hook tests
│   │   └── lib/                # Library tests
│   │
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # Protected routes
│   │   │   ├── annotations/
│   │   │   ├── benchmarks/
│   │   │   ├── costs/
│   │   │   ├── dashboard/
│   │   │   ├── developer/
│   │   │   ├── evaluations/
│   │   │   ├── layout.tsx
│   │   │   ├── llm-judge/
│   │   │   ├── prompts/
│   │   │   ├── settings/
│   │   │   ├── traces/
│   │   │   └── workflows/
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── annotations/
│   │   │   ├── auth/
│   │   │   ├── autumn/
│   │   │   ├── benchmarks/
│   │   │   ├── billing-portal/
│   │   │   ├── costs/
│   │   │   ├── decisions/
│   │   │   ├── demo/
│   │   │   ├── developer/
│   │   │   ├── docs/
│   │   │   ├── evaluation-templates/
│   │   │   ├── evaluations/
│   │   │   ├── health/
│   │   │   ├── llm-judge/
│   │   │   ├── onboarding/
│   │   │   ├── organizations/
│   │   │   ├── subscribers/
│   │   │   ├── traces/
│   │   │   └── workflows/
│   │   │
│   │   ├── auth/               # Authentication pages
│   │   │   ├── error/
│   │   │   ├── login/
│   │   │   ├── sign-up/
│   │   │   └── sign-up-success/
│   │   │
│   │   ├── blog/               # Blog posts
│   │   ├── changelog/          # Version changelog
│   │   ├── guides/             # Documentation guides
│   │   ├── share/              # Public sharing
│   │   ├── about/
│   │   ├── api-reference/
│   │   ├── careers/
│   │   ├── contact/
│   │   ├── documentation/
│   │   ├── onboarding/
│   │   ├── playground/         # Interactive playground
│   │   ├── pricing/
│   │   ├── privacy/
│   │   ├── sdk/
│   │   ├── templates/          # Template library
│   │   ├── traces/             # Public trace viewer
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home page
│   │   └── globals.css
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components (57 files)
│   │   ├── autumn/             # Billing components
│   │   ├── ai-quality-score-card.tsx
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── catalog-template-card.tsx
│   │   ├── copy-button.tsx
│   │   ├── decision-tree.tsx
│   │   ├── email-capture-widget.tsx
│   │   ├── enterprise-metrics.tsx
│   │   ├── error-boundary.tsx
│   │   ├── ErrorReporter.tsx
│   │   ├── evaluation-builder.tsx
│   │   ├── export-modal.tsx
│   │   ├── footer.tsx
│   │   ├── getting-started-wizard.tsx
│   │   ├── home-features.tsx
│   │   ├── home-header.tsx
│   │   ├── home-hero.tsx
│   │   ├── interactive-playground.tsx
│   │   ├── plan-usage-indicator.tsx
│   │   ├── public-page-header.tsx
│   │   ├── static-pricing-cards.tsx
│   │   ├── template-card.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── webmcp-provider.tsx
│   │   └── workflow-dag.tsx
│   │
│   ├── db/                     # Database layer
│   │   ├── index.ts            # Drizzle client
│   │   ├── schema.ts           # Database schema
│   │   └── seeds/              # Seed data (14 files)
│   │
│   ├── hooks/
│   │   └── use-mobile.ts
│   │
│   ├── lib/                    # Utilities and services
│   │   ├── autumn/
│   │   ├── governance/
│   │   │   └── rules.ts
│   │   ├── hooks/
│   │   ├── services/           # Business logic services
│   │   │   ├── evaluation.service.ts
│   │   │   ├── llm-judge.service.ts
│   │   │   └── webhook.service.ts
│   │   ├── ai-quality-score.ts
│   │   ├── api-docs.ts
│   │   ├── api-rate-limit.ts   # Rate limit middleware
│   │   ├── auth-client.ts
│   │   ├── auth.ts
│   │   ├── autumn-provider.tsx
│   │   ├── autumn-server.ts
│   │   ├── db-logger.ts
│   │   ├── db-optimization.ts
│   │   ├── dynamic-import.ts
│   │   ├── evaluation-templates.ts
│   │   ├── evaluation-templates-library.ts
│   │   ├── logger.ts
│   │   ├── rate-limit.ts       # Upstash Redis rate limiting
│   │   ├── rate-limit-wrapper.ts
│   │   ├── redis-cache.ts
│   │   ├── utils.ts
│   │   └── validation.ts
│   │
│   ├── packages/               # Monorepo packages
│   │   ├── sdk/                # TypeScript SDK
│   │   │   ├── cli/
│   │   │   ├── src/            # SDK source (19 files)
│   │   │   ├── CHANGELOG.md
│   │   │   ├── package.json
│   │   │   ├── README.md
│   │   │   └── tsconfig.json
│   │   │
│   │   └── shared/             # Shared utilities
│   │       ├── assertions/
│   │       ├── constants/
│   │       ├── services/
│   │       ├── tracing/
│   │       └── types/
│   │
│   ├── scripts/                # SQL migration scripts
│   │   ├── 001_create_core_tables.sql
│   │   ├── 002_create_trace_tables.sql
│   │   ├── 003_create_human_eval_tables.sql
│   │   ├── 004_create_ab_test_tables.sql
│   │   └── 005_create_triggers.sql
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── types/                  # TypeScript type definitions
│   │
│   └── visual-edits/           # v0.app integration
│       ├── component-tagger-loader.js
│       └── VisualEditsMessenger.tsx
│
├── autumn.config.ts            # Billing configuration
├── components.json             # shadcn/ui config
├── drizzle.config.ts           # Drizzle ORM config
├── eslint.config.mjs           # ESLint config
├── instrumentation.ts          # Sentry instrumentation
├── middleware.ts               # Next.js middleware
├── next.config.ts              # Next.js config
├── package.json
├── postcss.config.mjs
├── sentry.server.config.ts     # Sentry server config
├── sentry.edge.config.ts       # Sentry edge config
├── tsconfig.json
├── vitest.config.ts            # Vitest test config
├── MIGRATION_SUMMARY.md        # Recent migrations
└── README.md
```

---

## 🎯 Core Features

### 1. Evaluations

**Types:**

- Unit Test - Automated assertions
- Human Eval - Expert annotations
- Model Eval - LLM-as-judge
- A/B Test - Production experiments

**Key Files:**

- `src/app/(authenticated)/evaluations/page.tsx` - List view
- `src/app/(authenticated)/evaluations/new/page.tsx` - Create with templates
- `src/app/(authenticated)/evaluations/[id]/page.tsx` - Detail view
- `src/app/api/evaluations/route.ts` - CRUD API
- `src/components/evaluation-builder.tsx` - Drag-and-drop builder
- `src/lib/evaluation-templates.ts` - 20+ templates

### 2. Traces

**Capabilities:**

- Capture LLM calls
- Distributed tracing with spans
- Metadata and tags
- Integration guides for OpenAI, LangChain

**Key Files:**

- `src/app/(authenticated)/traces/page.tsx` - List with filters
- `src/app/(authenticated)/traces/[id]/page.tsx` - Detail view
- `src/app/api/traces/route.ts` - Create/list traces
- `src/app/api/traces/[id]/spans/route.ts` - Spans API

### 3. LLM Judge

**Features:**

- Custom judge configurations
- Pre-built templates (Accuracy, Tone, Safety, Helpfulness, RAG)
- Multi-judge consensus
- Advanced settings (temperature, tokens, scoring scales)

**Key Files:**

- `src/app/(authenticated)/llm-judge/page.tsx` - Judge dashboard
- `src/app/api/llm-judge/configs/route.ts` - Judge configs
- `src/app/api/llm-judge/evaluate/route.ts` - Run evaluations
- `src/app/api/llm-judge/results/route.ts` - Results API

### 4. Annotations

**Workflow:**

- Create annotation tasks
- Assign to annotators
- Collect ratings and feedback
- Track completion status

**Key Files:**

- `src/app/(authenticated)/annotations/page.tsx` - Task list
- `src/app/(authenticated)/annotations/tasks/[id]/page.tsx` - Annotation UI
- `src/app/api/annotations/route.ts` - Annotations API
- `src/app/api/annotations/tasks/route.ts` - Tasks API

### 5. Developer Dashboard

**Analytics:**

- API usage metrics
- Request/response times
- Error rates
- Top endpoints
- Status code breakdown

**Key Files:**

- `src/app/(authenticated)/developer/page.tsx` - Dashboard
- `src/app/api/developer/api-keys/route.ts` - API key management
- `src/app/api/developer/webhooks/route.ts` - Webhook management
- `src/app/api/developer/usage/route.ts` - Usage analytics

### 6. Billing & Features

**Pricing Tiers:**

- **Developer** (Free) - 5K traces/month, 1 project, community support
- **Team** ($49/seat/month) - 25K traces, 5 projects, email support
- **Professional** ($99/seat/month) - 100K traces, unlimited projects

**Key Files:**

- `autumn.config.ts` - Feature definitions
- `src/lib/autumn-server.ts` - Server-side gating
- `src/components/autumn/pricing-table.tsx` - Pricing UI
- `src/components/plan-usage-indicator.tsx` - Usage display

### 7. Multi-Agent Orchestration (v1.3.0)

**Capabilities:**

- DAG-based workflow definitions
- Agent handoff tracking and context propagation
- Decision auditing with confidence scores
- Cost tracking per workflow run

**Key Files:**

- `src/app/(authenticated)/workflows/page.tsx` - Workflow management
- `src/app/(authenticated)/workflows/[id]/page.tsx` - Workflow detail
- `src/app/api/workflows/route.ts` - Workflow CRUD API
- `src/app/api/workflows/[id]/runs/route.ts` - Workflow runs
- `src/app/api/workflows/[id]/handoffs/route.ts` - Agent handoffs
- `src/components/workflow-dag.tsx` - DAG visualization

### 8. Cost Analytics

**Capabilities:**

- Per-token cost tracking across 12+ LLM models
- Daily cost trends and breakdowns
- Provider pricing management
- Retry cost attribution

**Key Files:**

- `src/app/(authenticated)/costs/page.tsx` - Cost analytics dashboard
- `src/app/api/costs/route.ts` - Cost recording and querying
- `src/app/api/costs/pricing/route.ts` - Provider pricing management
- `src/app/api/costs/trends/route.ts` - Daily cost trends

### 9. Decision Auditing

**Capabilities:**

- Record and query agent decisions
- Decision type classification
- Confidence scoring and alternative tracking
- Aggregate decision statistics

**Key Files:**

- `src/app/api/decisions/route.ts` - Decision recording and querying
- `src/app/api/decisions/stats/route.ts` - Decision statistics
- `src/components/decision-tree.tsx` - Decision tree visualization

### 10. Agent Benchmarking

**Capabilities:**

- Compare agent architectures side-by-side
- Configurable benchmark suites
- Leaderboard with ranked results
- Multi-metric scoring

**Key Files:**

- `src/app/(authenticated)/benchmarks/page.tsx` - Benchmarking dashboard
- `src/app/api/benchmarks/route.ts` - Benchmark CRUD API
- `src/app/api/benchmarks/[id]/results/route.ts` - Benchmark results
- `src/app/api/benchmarks/[id]/leaderboard/route.ts` - Leaderboard

### 11. Interactive Playground

**Capabilities:**

- Try evaluations with no signup required
- Custom eval mode with user-defined assertions
- Pre-built demo scenarios (chatbot, RAG, code gen)
- Real-time evaluation results

**Key Files:**

- `src/app/playground/page.tsx` - Interactive playground page
- `src/components/interactive-playground.tsx` - Playground component
- `src/app/api/demo/custom-eval/route.ts` - Custom eval API

### 12. SDK Integration (v1.3.0)

**Complete API Coverage:**

- 100% endpoint parity with backend APIs
- Type-safe client with TypeScript
- Nested API structure for better organization
- Built-in retry logic and error handling

**Key Features:**

- Zero-config initialization
- 40+ TypeScript interfaces
- 20+ assertion helpers
- Framework integrations (OpenAI, Anthropic)
- NPM-ready package

**Key Files:**

- `src/packages/sdk/src/client.ts` - Main SDK client
- `src/packages/sdk/src/types.ts` - All type definitions
- `src/packages/sdk/README.md` - SDK documentation
- `src/packages/sdk/CHANGELOG.md` - Version history

---

## 🗄️ Database Schema

### Authentication Tables (better-auth)

```typescript
user {
  id: text (PK)
  name: text
  email: text (unique)
  emailVerified: boolean
  image: text
  createdAt: timestamp
  updatedAt: timestamp
}

session {
  id: text (PK)
  token: text (unique)
  expiresAt: timestamp
  userId: text -> user.id
  ipAddress: text
  userAgent: text
  createdAt: timestamp
  updatedAt: timestamp
}

account {
  id: text (PK)
  accountId: text
  providerId: text
  userId: text -> user.id
  accessToken: text
  refreshToken: text
  idToken: text
  ...timestamps
}

verification {
  id: text (PK)
  identifier: text
  value: text
  expiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Core Tables

```typescript
organizations {
  id: integer (PK, auto)
  name: text
  createdAt: text
  updatedAt: text
}

organizationMembers {
  id: integer (PK, auto)
  organizationId: integer -> organizations.id
  userId: text -> user.id
  role: text (owner|admin|member|viewer)
  createdAt: text
}

evaluations {
  id: integer (PK, auto)
  name: text
  description: text
  type: text (unit_test|human_eval|model_eval|ab_test)
  status: text (draft|active|completed)
  organizationId: integer -> organizations.id
  createdBy: text -> user.id
  executionSettings: json
  modelSettings: json
  customMetrics: json
  createdAt: text
  updatedAt: text
}

evaluationTestCases {
  id: integer (PK, auto)
  evaluationId: integer -> evaluations.id
  input: text
  expectedOutput: text
  metadata: json
  createdAt: text
}

evaluationRuns {
  id: integer (PK, auto)
  evaluationId: integer -> evaluations.id
  status: text (pending|running|completed|failed)
  totalCases: integer
  passedCases: integer
  failedCases: integer
  startedAt: text
  completedAt: text
  createdAt: text
}

testCases {
  id: integer (PK, auto)
  evaluationId: integer -> evaluations.id
  name: text
  input: text
  expectedOutput: text
  metadata: json
  createdAt: text
}

testResults {
  id: integer (PK, auto)
  evaluationRunId: integer -> evaluationRuns.id
  testCaseId: integer -> testCases.id
  status: text (pending|passed|failed)
  output: text
  score: integer
  error: text
  durationMs: integer
  createdAt: text
}
```

### Trace Tables

```typescript
traces {
  id: integer (PK, auto)
  name: text
  traceId: text (unique)
  organizationId: integer -> organizations.id
  status: text (pending|completed|failed)
  durationMs: integer
  metadata: json
  createdAt: text
}

traceSpans {
  id: integer (PK, auto)
  traceId: integer -> traces.id
  spanId: text
  parentSpanId: text
  name: text
  type: text (llm|tool|agent|retrieval|custom)
  input: text
  output: text
  durationMs: integer
  metadata: json
  createdAt: text
}

spans {
  id: integer (PK, auto)
  traceId: integer -> traces.id
  spanId: text (unique)
  parentSpanId: text
  name: text
  type: text
  startTime: text
  endTime: text
  durationMs: integer
  input: text
  output: text
  metadata: json
  createdAt: text
}
```

### Annotation Tables

```typescript
annotationTasks {
  id: integer (PK, auto)
  name: text
  description: text
  organizationId: integer -> organizations.id
  type: text
  status: text (active|paused|completed)
  totalItems: integer
  completedItems: integer
  createdBy: text -> user.id
  annotationSettings: json
  createdAt: text
  updatedAt: text
}

annotationItems {
  id: integer (PK, auto)
  taskId: integer -> annotationTasks.id
  content: text
  annotation: json
  annotatedBy: text -> user.id
  annotatedAt: text
  createdAt: text
}

humanAnnotations {
  id: integer (PK, auto)
  evaluationRunId: integer -> evaluationRuns.id
  testCaseId: integer -> testCases.id
  annotatorId: text -> user.id
  rating: integer
  feedback: text
  labels: json
  metadata: json
  createdAt: text
}
```

### LLM Judge Tables

```typescript
llmJudgeConfigs {
  id: integer (PK, auto)
  name: text
  organizationId: integer -> organizations.id
  model: text
  promptTemplate: text
  criteria: json
  settings: json
  createdBy: text -> user.id
  createdAt: text
  updatedAt: text
}

llmJudgeResults {
  id: integer (PK, auto)
  configId: integer -> llmJudgeConfigs.id
  input: text
  output: text
  score: integer
  reasoning: text
  metadata: json
  createdAt: text
}
```

### Developer Tables

```typescript
apiKeys {
  id: integer (PK, auto)
  userId: text -> user.id
  organizationId: integer -> organizations.id
  keyHash: text
  keyPrefix: text
  name: text
  scopes: json
  lastUsedAt: text
  expiresAt: text
  revokedAt: text
  createdAt: text
}

webhooks {
  id: integer (PK, auto)
  organizationId: integer -> organizations.id
  url: text
  events: json
  secret: text
  status: text (active|paused)
  lastDeliveredAt: text
  createdAt: text
  updatedAt: text
}

webhookDeliveries {
  id: integer (PK, auto)
  webhookId: integer -> webhooks.id
  eventType: text
  payload: json
  status: text (pending|delivered|failed)
  responseStatus: integer
  responseBody: text
  attemptCount: integer
  createdAt: text
}

apiUsageLogs {
  id: integer (PK, auto)
  apiKeyId: integer -> apiKeys.id
  userId: text -> user.id
  organizationId: integer -> organizations.id
  endpoint: text
  method: text
  statusCode: integer
  responseTimeMs: integer
  createdAt: text
}
```

### Multi-Agent & Analytics Tables

```typescript
emailSubscribers {
  id: integer (PK, auto)
  email: text
  source: text
  context: text
  subscribedAt: text
}

workflows {
  id: integer (PK, auto)
  name: text
  description: text
  organizationId: integer -> organizations.id
  definition: json
  status: text
  createdBy: text -> user.id
  createdAt: text
  updatedAt: text
}

workflowRuns {
  id: integer (PK, auto)
  workflowId: integer -> workflows.id
  traceId: text
  status: text
  totalAgents: integer
  completedAgents: integer
  totalCost: real
  startedAt: text
  completedAt: text
  createdAt: text
}

agentHandoffs {
  id: integer (PK, auto)
  workflowRunId: integer -> workflowRuns.id
  fromAgent: text
  toAgent: text
  context: json
  handoffType: text
  createdAt: text
}

agentDecisions {
  id: integer (PK, auto)
  workflowRunId: integer -> workflowRuns.id
  spanId: text
  agentName: text
  decisionType: text
  chosen: text
  alternatives: json
  reasoning: text
  confidence: real
  inputContext: json
  createdAt: text
}

costRecords {
  id: integer (PK, auto)
  workflowRunId: integer -> workflowRuns.id
  spanId: text
  provider: text
  model: text
  inputTokens: integer
  outputTokens: integer
  totalCost: real
  category: text
  isRetry: boolean
  retryNumber: integer
  createdAt: text
}

providerPricing {
  id: integer (PK, auto)
  organizationId: integer -> organizations.id
  provider: text
  model: text
  inputCostPer1M: real
  outputCostPer1M: real
  updatedAt: text
  createdAt: text
}

benchmarks {
  id: integer (PK, auto)
  name: text
  description: text
  organizationId: integer -> organizations.id
  config: json
  status: text
  createdBy: text -> user.id
  createdAt: text
  updatedAt: text
}

agentConfigs {
  id: integer (PK, auto)
  benchmarkId: integer -> benchmarks.id
  name: text
  agentType: text
  config: json
  createdAt: text
}

benchmarkResults {
  id: integer (PK, auto)
  benchmarkId: integer -> benchmarks.id
  agentConfigId: integer -> agentConfigs.id
  metrics: json
  status: text
  startedAt: text
  completedAt: text
  createdAt: text
}
```

---

## 🛣️ API Routes

### Authentication

- `POST /api/auth/[...all]` - better-auth handler

### Autumn Billing

- `POST /api/autumn/[...all]` - Autumn.js handler
- `POST /api/billing-portal` - Customer portal

### Organizations

- `GET /api/organizations/current` - Get current org
- `POST /api/organizations` - Create org

### Traces

- `GET /api/traces` - List traces (with filters)
- `POST /api/traces` - Create trace (quota checked)
- `DELETE /api/traces?id=X` - Delete trace
- `GET /api/traces/[id]` - Get trace details
- `GET /api/traces/[id]/spans` - List spans
- `POST /api/traces/[id]/spans` - Create span

### Evaluations

- `GET /api/evaluations` - List evaluations
- `POST /api/evaluations` - Create evaluation (quota checked)
- `GET /api/evaluations?id=X` - Get evaluation
- `PUT /api/evaluations?id=X` - Update evaluation
- `DELETE /api/evaluations?id=X` - Delete evaluation
- `GET /api/evaluations/[id]/test-cases` - List test cases
- `POST /api/evaluations/[id]/test-cases` - Create test case
- `GET /api/evaluations/[id]/runs` - List runs
- `POST /api/evaluations/[id]/runs` - Create run
- `GET /api/evaluations/[id]/runs/[runId]` - Get run details
- `POST /api/evaluations/[id]/publish` - Publish evaluation
- `DELETE /api/evaluations/[id]/publish` - Unpublish evaluation

### LLM Judge

- `GET /api/llm-judge/configs` - List judge configs
- `POST /api/llm-judge/configs` - Create config
- `POST /api/llm-judge/evaluate` - Run evaluation
- `GET /api/llm-judge/results` - List results
- `GET /api/llm-judge/alignment` - Get alignment metrics

### Annotations

- `GET /api/annotations` - List annotations
- `POST /api/annotations` - Create annotation
- `GET /api/annotations/tasks` - List tasks
- `POST /api/annotations/tasks` - Create task
- `GET /api/annotations/tasks/[id]` - Get task
- `PATCH /api/annotations/tasks/[id]` - Update task
- `GET /api/annotations/tasks/[id]/items` - List items
- `POST /api/annotations/tasks/[id]/items` - Create item

### Developer

**API Keys:**

- `GET /api/developer/api-keys` - List API keys
- `POST /api/developer/api-keys` - Create key
- `PATCH /api/developer/api-keys/[id]` - Update key
- `DELETE /api/developer/api-keys/[id]` - Revoke key
- `GET /api/developer/api-keys/[id]/usage` - Key usage stats

**Webhooks:**

- `GET /api/developer/webhooks` - List webhooks
- `POST /api/developer/webhooks` - Create webhook
- `GET /api/developer/webhooks/[id]` - Get webhook details
- `PATCH /api/developer/webhooks/[id]` - Update webhook
- `DELETE /api/developer/webhooks/[id]` - Delete webhook
- `GET /api/developer/webhooks/[id]/deliveries` - Delivery history

**Usage Analytics:**

- `GET /api/developer/usage` - Detailed usage logs
- `GET /api/developer/usage/summary` - Usage summary with limits

### Onboarding

- `POST /api/onboarding/setup` - Complete setup

### Workflows

- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/[id]` - Get workflow
- `PUT /api/workflows/[id]` - Update workflow
- `DELETE /api/workflows/[id]` - Delete workflow
- `POST /api/workflows/[id]/runs` - Create run
- `GET /api/workflows/[id]/runs` - List runs
- `GET /api/workflows/[id]/runs/[runId]` - Get run
- `PUT /api/workflows/[id]/runs/[runId]` - Update run
- `POST /api/workflows/[id]/handoffs` - Record handoff
- `GET /api/workflows/[id]/handoffs` - List handoffs

### Decisions

- `POST /api/decisions` - Record decision
- `GET /api/decisions` - Query decisions
- `GET /api/decisions/stats` - Decision stats

### Costs

- `POST /api/costs` - Record cost
- `GET /api/costs` - Get costs
- `GET /api/costs/trends` - Daily trends
- `GET /api/costs/pricing` - Get pricing
- `POST /api/costs/pricing` - Update pricing

### Benchmarks

- `POST /api/benchmarks` - Create benchmark
- `GET /api/benchmarks` - List benchmarks
- `GET /api/benchmarks/[id]` - Get benchmark
- `DELETE /api/benchmarks/[id]` - Delete benchmark
- `POST /api/benchmarks/[id]/results` - Submit results
- `GET /api/benchmarks/[id]/leaderboard` - Get leaderboard

### Evaluation Templates (Public)

- `GET /api/evaluation-templates` - List templates (no auth, rate-limited)

### Demo (Public)

- `POST /api/demo/custom-eval` - Run custom assertions
- `GET /api/demo/chatbot` - Chatbot demo
- `GET /api/demo/rag` - RAG demo
- `GET /api/demo/codegen` - Code gen demo

---

## 📄 Pages & Routes

### Public Pages

- `/` - Home page with hero and features
- `/about` - About page
- `/pricing` - Pricing plans
- `/contact` - Contact form
- `/careers` - Careers page
- `/privacy` - Privacy policy
- `/documentation` - Documentation hub
- `/api-reference` - API reference
- `/sdk` - SDK documentation
- `/changelog` - Version changelog
- `/playground` - Interactive evaluation playground
- `/templates` - Template library (50+ templates)

### Authentication Pages

- `/auth/login` - Sign in
- `/auth/sign-up` - Sign up
- `/auth/sign-up-success` - Post-signup
- `/auth/error` - Auth errors

### Protected Pages (requires auth)

- `/dashboard` - Overview dashboard
- `/evaluations` - List evaluations
- `/evaluations/new` - Create with templates
- `/evaluations/[id]` - Evaluation details
- `/traces` - List traces
- `/traces/[id]` - Trace details
- `/llm-judge` - LLM judge dashboard
- `/annotations` - Annotation tasks
- `/annotations/tasks/[id]` - Annotation UI
- `/developer` - Developer dashboard
- `/developer/api-keys` - API key management
- `/settings` - User settings
- `/onboarding` - First-time setup
- `/workflows` - Workflow management
- `/workflows/[id]` - Workflow detail
- `/costs` - Cost analytics
- `/benchmarks` - Agent benchmarking
- `/prompts` - Prompt management

### Blog Posts

- `/blog` - Blog index
- `/blog/building-effective-llm-judge-rubrics`
- `/blog/case-study-reducing-chatbot-errors`
- `/blog/evolution-of-ai-testing`
- `/blog/human-in-the-loop`
- `/blog/tracing-llm-observability`
- `/blog/why-every-ai-product-needs-evaluation`

### Guides

- `/guides` - Guides index
- `/guides/quick-start`
- `/guides/ab-testing`
- `/guides/chatbot-evaluation`
- `/guides/cicd-integration`
- `/guides/code-generation`
- `/guides/content-generation`
- `/guides/evaluation-types`
- `/guides/langchain-integration`
- `/guides/llm-judge`
- `/guides/openai-integration`
- `/guides/rag-evaluation`
- `/guides/token-optimization`
- `/guides/tracing-setup`

---

## 🧩 Components

### UI Components (shadcn/ui - 57 files)

Located in `src/components/ui/`:

accordion, alert-dialog, alert, aspect-ratio, avatar, background-boxes, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, command, ComponentSeparator, container-scroll-animation, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group, input-otp, input, item, kbd, label, menubar, navigation-menu, navigation, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

### App Components

- `app-header.tsx` - Header with user menu
- `app-sidebar.tsx` - Sidebar navigation
- `footer.tsx` - Footer links
- `theme-provider.tsx` - Dark/light theme
- `theme-toggle.tsx` - Theme switcher
- `ErrorReporter.tsx` - Error boundary

### Feature Components

- `evaluation-builder.tsx` - Drag-and-drop evaluation builder
- `getting-started-wizard.tsx` - Onboarding flow
- `plan-usage-indicator.tsx` - Quota display
- `catalog-template-card.tsx` - Template catalog card
- `copy-button.tsx` - Copy to clipboard button
- `decision-tree.tsx` - Decision tree visualization
- `enterprise-metrics.tsx` - Enterprise metrics display
- `export-modal.tsx` - Export modal dialog
- `home-header.tsx` - Home page header
- `public-page-header.tsx` - Public page header
- `static-pricing-cards.tsx` - Static pricing cards
- `webmcp-provider.tsx` - WebMCP integration provider
- `workflow-dag.tsx` - Workflow DAG visualization

### Billing Components

- `autumn/checkout-dialog.tsx` - Checkout modal
- `autumn/pricing-table.tsx` - Pricing table

---

## 📦 SDK Package

### Package: `@pauly4010/evalai-sdk`

**Version:** 1.3.0 (🎉 100% API Coverage + Multi-Agent Orchestration)  
**Location:** `src/packages/sdk/`  
**License:** MIT  
**Author:** EvalAI Team  
**NPM Ready:** Yes (with .npmignore and prepublishOnly script)

#### Main Exports

```typescript
// Client
export { AIEvalClient } from "./client";

// Errors
export {
  EvalAIError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NetworkError,
} from "./errors";

// Assertions
export {
  expect,
  containsKeywords,
  matchesPattern,
  hasLength,
  containsJSON,
  notContainsPII,
  hasSentiment,
  similarTo,
  withinRange,
  isValidEmail,
  isValidURL,
  hasNoHallucinations,
  matchesSchema,
  hasReadabilityScore,
  containsLanguage,
  hasFactualAccuracy,
  respondedWithinTime,
  hasNoToxicity,
  followsInstructions,
  containsAllRequiredFields,
  hasValidCodeSyntax,
} from "./assertions";

// Context & Testing
export { ContextManager, withContext, getContext } from "./context";
export { createTestSuite, TestSuite } from "./testing";

// Workflows (v1.3.0)
export { WorkflowTracer, createWorkflowTracer, traceWorkflowStep, traceLangChainAgent, traceCrewAI, traceAutoGen } from './workflows';

// Performance (v1.3.0)
export { RequestCache, CacheTTL } from './cache';
export { PaginatedIterator, createPaginatedIterator, autoPaginate } from './pagination';
export { RequestBatcher } from './batch';
export { batchProcess, streamEvaluation, batchRead, RateLimiter } from './streaming';

// Fix: correct snapshot exports
export { snapshot, compareWithSnapshot, saveSnapshot, compareSnapshots } from './snapshot';
export { exportData, importData, ExportFormat } from "./export";
export { Logger } from "./logger";

// Integrations
export { traceOpenAI } from "./integrations/openai";
export { traceAnthropic } from "./integrations/anthropic";

// Types (v1.3.0) - 40+ comprehensive interfaces
export type {
  // Core
  Trace,
  Span,
  Evaluation,
  EvaluationRun,
  TestCase,
  TestResult,
  // Annotations (NEW)
  Annotation,
  AnnotationTask,
  AnnotationItem,
  CreateAnnotationParams,
  ListAnnotationsParams,
  CreateAnnotationTaskParams,
  ListAnnotationTasksParams,
  CreateAnnotationItemParams,
  ListAnnotationItemsParams,
  // Developer (NEW)
  APIKey,
  APIKeyWithSecret,
  Webhook,
  WebhookDelivery,
  CreateAPIKeyParams,
  UpdateAPIKeyParams,
  ListAPIKeysParams,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListWebhooksParams,
  ListWebhookDeliveriesParams,
  APIKeyUsage,
  UsageStats,
  UsageSummary,
  GetUsageParams,
  // LLM Judge Extended (NEW)
  LLMJudgeConfig,
  LLMJudgeResult,
  LLMJudgeAlignment,
  CreateLLMJudgeConfigParams,
  ListLLMJudgeConfigsParams,
  ListLLMJudgeResultsParams,
  GetLLMJudgeAlignmentParams,
  // Organizations (NEW)
  Organization,
  // Templates
  EvaluationTemplates,
  FeatureUsage,
  OrganizationLimits,
} from "./types";
```

#### SDK Files (19 total)

- `client.ts` - Main SDK client with complete API coverage
- `assertions.ts` - 20+ assertion helpers
- `batch.ts` - Request batching
- `cache.ts` - Request caching
- `context.ts` - Context propagation
- `errors.ts` - Error classes
- `export.ts` - Data export/import
- `index.ts` - Main exports
- `logger.ts` - Debug logger
- `local.ts` - Local development
- `pagination.ts` - Cursor-based pagination
- `snapshot.ts` - Snapshot testing
- `streaming.ts` - Streaming & batch
- `testing.ts` - Test suite builder
- `types.ts` - 40+ TypeScript interfaces
- `workflows.ts` - Multi-agent workflow tracing
- `integrations/openai.ts` - OpenAI wrapper
- `integrations/anthropic.ts` - Anthropic wrapper

#### API Coverage (v1.3.0)

**Traces API** ✅

- `client.traces.create()` - Create traces
- `client.traces.list()` - List with filters
- `client.traces.get()` - Get trace details
- `client.traces.delete()` - Delete trace
- `client.traces.createSpan()` - Create span
- `client.traces.listSpans()` - List spans

**Evaluations API** ✅

- `client.evaluations.create()` - Create evaluations
- `client.evaluations.list()` - List evaluations
- `client.evaluations.get()` - Get evaluation
- `client.evaluations.update()` - Update evaluation
- `client.evaluations.delete()` - Delete evaluation
- `client.evaluations.createTestCase()` - Create test case
- `client.evaluations.listTestCases()` - List test cases
- `client.evaluations.createRun()` - Create run
- `client.evaluations.listRuns()` - List runs
- `client.evaluations.getRun()` - Get run details

**LLM Judge API** ✅

- `client.llmJudge.evaluate()` - Run evaluation
- `client.llmJudge.createConfig()` - Create judge config
- `client.llmJudge.listConfigs()` - List configs
- `client.llmJudge.listResults()` - Query results
- `client.llmJudge.getAlignment()` - Alignment analysis

**Annotations API** ✅ (NEW in v1.2.0)

- `client.annotations.create()` - Create annotation
- `client.annotations.list()` - List annotations
- `client.annotations.tasks.create()` - Create task
- `client.annotations.tasks.list()` - List tasks
- `client.annotations.tasks.get()` - Get task
- `client.annotations.tasks.items.create()` - Create item
- `client.annotations.tasks.items.list()` - List items

**Developer API** ✅ (NEW in v1.2.0)

- **API Keys:**
  - `client.developer.apiKeys.create()` - Create key
  - `client.developer.apiKeys.list()` - List keys
  - `client.developer.apiKeys.update()` - Update key
  - `client.developer.apiKeys.revoke()` - Revoke key
  - `client.developer.apiKeys.getUsage()` - Key usage
- **Webhooks:**
  - `client.developer.webhooks.create()` - Create webhook
  - `client.developer.webhooks.list()` - List webhooks
  - `client.developer.webhooks.get()` - Get webhook
  - `client.developer.webhooks.update()` - Update webhook
  - `client.developer.webhooks.delete()` - Delete webhook
  - `client.developer.webhooks.getDeliveries()` - Delivery history
- **Usage Analytics:**
  - `client.developer.getUsage()` - Usage statistics
  - `client.developer.getUsageSummary()` - Usage summary

**Organizations API** ✅ (NEW in v1.2.0)

- `client.organizations.getCurrent()` - Get current org

#### Usage Examples

```typescript
import { AIEvalClient } from "@pauly4010/evalai-sdk";

// Zero-config initialization
const client = AIEvalClient.init();

// Create a trace
const trace = await client.traces.create({
  name: "User Query",
  traceId: "trace-123",
  metadata: { userId: "456" },
});

// Create an evaluation
const evaluation = await client.evaluations.create({
  name: "Chatbot Quality Test",
  type: "unit_test",
  organizationId: 1,
});

// Create annotation task (NEW)
const task = await client.annotations.tasks.create({
  name: "Label Customer Feedback",
  description: "Rate helpfulness 1-5",
  organizationId: 1,
  type: "classification",
  totalItems: 100,
});

// Manage API keys (NEW)
const apiKey = await client.developer.apiKeys.create({
  name: "Production API Key",
  scopes: ["traces:write", "evaluations:read"],
});

// Create webhook (NEW)
const webhook = await client.developer.webhooks.create({
  url: "https://api.example.com/webhooks",
  events: ["trace.completed", "evaluation.finished"],
  organizationId: 1,
});

// Get usage stats (NEW)
const usage = await client.developer.getUsageSummary({
  startDate: "2025-10-01",
  endDate: "2025-10-31",
});
```

#### Package Configuration

**package.json metadata:**

- Keywords: ai, evaluation, llm, testing, observability, tracing, monitoring, annotations, webhooks, developer-tools
- Exports: Main, assertions, testing, integrations (openai, anthropic)
- Scripts: build, dev, test, prepublishOnly
- Repository: git+https://github.com/evalai/platform.git

**Publishing:**

- `.npmignore` configured to exclude source files
- `prepublishOnly` script ensures fresh build
- TypeScript declarations (.d.ts) included
- CLI binary: `evalai` command

---

## 🔧 Shared Packages

### Package: `shared`

**Location:** `src/packages/shared/`

#### Structure

```
shared/
├── assertions/
│   └── index.ts          # Assertion types
├── constants/
│   └── index.ts          # Constants
├── services/
│   ├── evaluation-service.ts  # Evaluation execution
│   └── trace-service.ts       # Trace management
├── tracing/
│   └── index.ts          # Tracing utilities
└── types/
    └── index.ts          # Shared TypeScript types
```

#### Key Exports

**Types:**

```typescript
// User and Organization
(User, Organization, OrganizationMember);

// Evaluations
(Evaluation, EvaluationRun, EvaluationType, EvaluationStatus);

// Traces
(Trace, Span);

// Test Cases
(TestCase, TestResult, AssertionResult);

// Annotations
(HumanAnnotation, AnnotationTask);

// LLM Judge
LLMJudgeResult;

// A/B Testing
(ABTest, ABTestVariant, ABTestResult);

// Metrics
(Metric, MetricValue);
```

**Services:**

```typescript
// EvaluationService
executeTestCase();
executeEvaluationRun();
calculateMetrics();
```

---

## ⚙️ Configuration Files

### `package.json`

**Key Dependencies:**

- **Framework:** next@15.5.6, react@19, react-dom@19
- **Database:** drizzle-orm@0.44.6, @libsql/client@0.15.15
- **Auth:** better-auth@1.3.27
- **Billing:** autumn-js@0.1.40, atmn@0.0.27
- **Rate Limiting:** @upstash/ratelimit@2.0.6, @upstash/redis@1.35.6
- **Monitoring:** @sentry/nextjs@10.20.0
- **Testing:** vitest@3.2.4, @vitejs/plugin-react@5.0.4
- **UI:** @radix-ui/\* (20+ components), tailwindcss@4.1.9
- **Charts:** recharts@3.2.1
- **Forms:** react-hook-form@7.60.0, zod@3.25.76
- **Fonts:** geist@1.5.1
- **Analytics:** @vercel/analytics@1.5.0

**Scripts:**

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `next.config.ts`

**Features:**

- Remote image patterns (https://** and http://**)
- Transpile recharts
- Turbopack with custom loaders
- Visual edits support

### `drizzle.config.ts`

**Database:**

- Dialect: Turso (LibSQL)
- Schema: `./src/db/schema.ts`
- Migrations: `./drizzle`
- Credentials: `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN`

### `middleware.ts`

**Protected Routes:**

```typescript
const protectedRoutes = [
  "/dashboard",
  "/evaluations",
  "/traces",
  "/annotations",
  "/llm-judge",
  "/developer",
  "/settings",
];
```

**Auth Check:**

- Checks `better-auth.session_token` cookie
- Redirects to `/auth/login` if missing

### `autumn.config.ts`

**Features Defined:**

- `traces` - Single use
- `projects` - Continuous use
- `organizations` - Continuous use
- `seats` - Continuous use
- `annotations` - Single use
- `traces_per_project` - Single use per organization
- `evals_per_project` - Single use per organization
- `annotations_per_project` - Single use per organization
- Support features: community, email, priority
- Integration features: basic, advanced

**Products:**

- **Developer** (free) - 5K traces, 1 project, 10 annotations/month
- **Team** ($49/seat) - 25K traces, 5 projects, 50 annotations/month
- **Professional** ($99/seat) - 100K traces, unlimited projects

### Rate Limiting Configuration

**Location:** `src/lib/rate-limit.ts`

**Tiers:**

- **Anonymous:** 10 requests/minute
- **Free:** 100 requests/minute
- **Pro:** 1,000 requests/minute
- **Enterprise:** 10,000 requests/minute

**Features:**

- Upstash Redis with sliding window algorithm
- Analytics enabled
- Tiered rate limits based on plan
- Rate limit headers in responses (X-RateLimit-\*)
- Middleware wrapper: `src/lib/api-rate-limit.ts`

### Error Monitoring

**Sentry Configuration:**

- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `instrumentation.ts` - Global error handler with `onRequestError()`

**Features:**

- Performance monitoring (traces sample rate: 100%)
- Environment-based configuration
- Debug mode in development
- Request error capture with context (URL, method, headers)
- Production error sanitization
- Integrated with rate limiting middleware

### Testing Infrastructure

**Vitest Configuration:**

- `vitest.config.ts` - Test runner configuration
- Environment: jsdom (for React testing)
- Globals enabled for easy test writing
- Path aliases configured (@/ = ./src)

**Scripts:**

- `pnpm test` - Run tests
- `pnpm test:ui` - Interactive test UI
- `pnpm test:coverage` - Coverage reports

**Note:** Playwright for E2E testing is not currently installed. To add it, run:

```bash
pnpm add -D @playwright/test
npx playwright install
```

---

## 🔑 Key Technologies

### Frontend

- **Next.js 15** - App Router, Server Components, API Routes
- **React 19** - Latest features
- **TypeScript 5** - Type safety
- **Tailwind CSS 4.1.9** - Utility-first styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Recharts** - Data visualization
- **Geist Font** - Sans and Mono variants

### Backend

- **Drizzle ORM** - Type-safe SQL queries
- **Turso** - Distributed SQLite (LibSQL)
- **better-auth** - Authentication with sessions
- **Autumn.js** - Usage-based billing and feature gating
- **Upstash Redis** - Rate limiting with sliding window
- **Sentry** - Error monitoring and performance tracking

### Developer Experience

- **TypeScript SDK** - Type-safe client library (v1.3.0)
- **Retry Logic** - Exponential backoff
- **Debug Logger** - Request/response logging
- **Context Propagation** - Automatic metadata passing
- **Error Handling** - Custom error classes
- **Zod Validation** - Runtime type checking
- **Vitest** - Unit and integration testing
- **Rate Limiting** - Tiered API limits (10-10K requests/min)

### Deployment & Infrastructure

- **Vercel** - Hosting and edge functions
- **v0.app** - Design and deployment sync
- **GitHub** - Auto-sync from v0 deployments
- **Upstash** - Redis for distributed rate limiting
- **Sentry** - Real-time error tracking and monitoring

---

## 📊 Statistics

### Files by Type

- **TypeScript/TSX:** ~150+ files
- **SQL Migrations:** 9 files
- **UI Components:** 57 shadcn/ui components
- **App Components:** 26+
- **API Routes:** 55+ endpoints
- **Pages:** 40+ pages
- **Seed Files:** 14 seed scripts
- **SDK Files:** 19 core files
- **Test Files:** 7 test files (API, components, hooks, lib)

### Lines of Code (Estimated)

- **Total:** ~18,000+ lines
- **Frontend:** ~8,000 lines
- **Backend:** ~5,000 lines
- **SDK:** ~3,500 lines (v1.3.0)
- **Types/Config:** ~1,500 lines

### Database Tables

- **Total:** 33 tables
- **Auth:** 4 tables (better-auth)
- **Core:** 8 tables
- **Traces:** 3 tables
- **Annotations:** 3 tables
- **Developer:** 4 tables
- **LLM Judge:** 2 tables
- **Multi-Agent:** 4 tables
- **Analytics:** 3 tables
- **Benchmarks:** 2 tables

### SDK Coverage (v1.3.0)

- **Total API Endpoints:** 55+
- **SDK Coverage:** 100% ✅
- **TypeScript Interfaces:** 40+
- **API Classes:** 9 (TracesAPI, EvaluationsAPI, LLMJudgeAPI, AnnotationsAPI, AnnotationTasksAPI, AnnotationTaskItemsAPI, DeveloperAPI, APIKeysAPI, WebhooksAPI, OrganizationsAPI)
- **Assertion Helpers:** 20+
- **Framework Integrations:** 2 (OpenAI, Anthropic)

---

## 🚀 Getting Started

### Prerequisites

```bash
# Environment Variables Required
TURSO_CONNECTION_URL=your-turso-url
TURSO_AUTH_TOKEN=your-turso-token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit push

# Start development server
pnpm dev
```

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📝 Recent Changes

See `MIGRATION_SUMMARY.md` and `SDK_V1.2.0_IMPLEMENTATION_SUMMARY.md` for details on:

- ✅ Supabase to Drizzle migration (complete)
- ✅ 20+ evaluation templates added
- ✅ Drag-and-drop evaluation builder
- ✅ Server-side feature gating
- ✅ Per-organization quotas
- ✅ **Rate Limiting Infrastructure** - Upstash Redis with tiered limits (10-10K req/min)
- ✅ **Error Monitoring** - Sentry fully configured (server, edge, instrumentation)
- ✅ **Testing Infrastructure** - Vitest with jsdom environment
- 🎉 **SDK v1.2.0** - 100% API Coverage (October 18, 2025)
  - Annotations API (complete human-in-the-loop workflow)
  - Developer API (API keys, webhooks, usage analytics)
  - LLM Judge Extended (configs, results, alignment)
  - Organizations API
  - 40+ new TypeScript interfaces
  - NPM-ready with .npmignore and metadata
- 🎉 **SDK v1.3.0** — Multi-Agent Orchestration (WorkflowTracer, agent handoffs, decision auditing, cost tracking)
- ✅ **50+ evaluation templates** across 17 categories
- ✅ **Interactive playground** with custom eval mode
- ✅ **WebMCP integration** (5 AI-discoverable tools)
- ✅ **Agent benchmarking** with leaderboard

---

## 🔗 Resources

- **Project URL:** https://vercel.com/pauly7610s-projects/v0-ai-evaluation-platform
- **v0.app Project:** https://v0.app/chat/projects/9narvC0l5kR
- **Repository:** Auto-synced from v0.app deployments

---

**Index Generated:** February 15, 2026  
**Index Version:** 1.3  
**Codebase Version:** Based on latest deployment  
**SDK Version:** v1.3.0 (100% API Coverage + Multi-Agent Orchestration)  
**Last Updated:** Full codebase index with multi-agent orchestration, cost analytics, benchmarking, and complete file inventory
