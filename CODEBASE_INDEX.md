# AI Evaluation Platform - Complete Codebase Index

**Generated:** Thursday, October 16, 2025  
**Project:** AI Evaluation Platform  
**Framework:** Next.js 15.3.5 with React 19, TypeScript, Drizzle ORM  
**Database:** Turso (LibSQL/SQLite)  
**Authentication:** better-auth  
**Billing:** Autumn.js

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

- Custom SDK (`@evalai/sdk`)
- TypeScript with strict mode
- ESLint configuration
- Geist font family

### Key Patterns

1. **Server-Side Feature Gating** - All API routes check quotas server-side
2. **Context Propagation** - Metadata flows through traces automatically
3. **Retry Logic** - Built-in retry with exponential backoff
4. **Type Safety** - Comprehensive TypeScript types across SDK and API
5. **Middleware Auth** - Protected routes with better-auth sessions

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
│   └── meta/                   # Migration metadata
│
├── public/                     # Static assets
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   ├── placeholder-logo.png/svg
│   ├── placeholder-user.jpg
│   └── placeholder.jpg/svg
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # Protected routes
│   │   │   ├── annotations/
│   │   │   ├── dashboard/
│   │   │   ├── developer/
│   │   │   ├── evaluations/
│   │   │   ├── layout.tsx
│   │   │   ├── llm-judge/
│   │   │   ├── settings/
│   │   │   └── traces/
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── annotations/
│   │   │   ├── auth/
│   │   │   ├── autumn/
│   │   │   ├── billing-portal/
│   │   │   ├── developer/
│   │   │   ├── evaluations/
│   │   │   ├── llm-judge/
│   │   │   ├── onboarding/
│   │   │   ├── organizations/
│   │   │   └── traces/
│   │   │
│   │   ├── auth/               # Authentication pages
│   │   │   ├── error/
│   │   │   ├── login/
│   │   │   ├── sign-up/
│   │   │   └── sign-up-success/
│   │   │
│   │   ├── blog/               # Blog posts
│   │   ├── guides/             # Documentation guides
│   │   ├── about/
│   │   ├── api-reference/
│   │   ├── careers/
│   │   ├── contact/
│   │   ├── documentation/
│   │   ├── onboarding/
│   │   ├── pricing/
│   │   ├── privacy/
│   │   ├── sdk/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home page
│   │   └── globals.css
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components (57 files)
│   │   ├── autumn/             # Billing components
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── ErrorReporter.tsx
│   │   ├── evaluation-builder.tsx
│   │   ├── footer.tsx
│   │   ├── getting-started-wizard.tsx
│   │   ├── plan-usage-indicator.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
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
│   │   ├── hooks/
│   │   ├── auth-client.ts
│   │   ├── auth.ts
│   │   ├── autumn-provider.tsx
│   │   ├── autumn-server.ts
│   │   ├── evaluation-templates.ts
│   │   └── utils.ts
│   │
│   ├── packages/               # Monorepo packages
│   │   ├── sdk/                # TypeScript SDK
│   │   │   ├── cli/
│   │   │   ├── src/            # SDK source (14 files)
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
│   └── visual-edits/           # v0.app integration
│       ├── component-tagger-loader.js
│       └── VisualEditsMessenger.tsx
│
├── autumn.config.ts            # Billing configuration
├── components.json             # shadcn/ui config
├── drizzle.config.ts           # Drizzle ORM config
├── eslint.config.mjs           # ESLint config
├── middleware.ts               # Next.js middleware
├── next.config.ts              # Next.js config
├── package.json
├── postcss.config.mjs
├── tsconfig.json
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

- `GET /api/developer/api-keys` - List API keys
- `POST /api/developer/api-keys` - Create key
- `DELETE /api/developer/api-keys/[id]` - Delete key
- `GET /api/developer/api-keys/[id]/usage` - Key usage
- `GET /api/developer/webhooks` - List webhooks
- `POST /api/developer/webhooks` - Create webhook
- `DELETE /api/developer/webhooks/[id]` - Delete webhook
- `GET /api/developer/webhooks/[id]/deliveries` - List deliveries
- `GET /api/developer/usage` - Usage logs
- `GET /api/developer/usage/summary` - Usage summary

### Onboarding

- `POST /api/onboarding/setup` - Complete setup

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
- `/settings` - User settings
- `/onboarding` - First-time setup

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

### Billing Components

- `autumn/checkout-dialog.tsx` - Checkout modal
- `autumn/pricing-table.tsx` - Pricing table

---

## 📦 SDK Package

### Package: `@evalai/sdk`

**Version:** 1.1.0  
**Location:** `src/packages/sdk/`

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

// Advanced Features
export {
  snapshot,
  loadSnapshot,
  saveSnapshot,
  compareSnapshots,
} from "./snapshot";
export { exportData, importData, ExportFormat } from "./export";
export { StreamingClient, BatchClient } from "./streaming";
export { Logger } from "./logger";

// Integrations
export { traceOpenAI } from "./integrations/openai";
export { traceAnthropic } from "./integrations/anthropic";
```

#### SDK Files (14 total)

- `client.ts` - Main SDK client with retry logic
- `assertions.ts` - Assertion library
- `context.ts` - Context propagation
- `errors.ts` - Error classes
- `export.ts` - Data export/import
- `index.ts` - Main exports
- `logger.ts` - Debug logger
- `local.ts` - Local development
- `snapshot.ts` - Snapshot testing
- `streaming.ts` - Streaming & batch
- `testing.ts` - Test suite builder
- `types.ts` - TypeScript types
- `integrations/openai.ts` - OpenAI wrapper
- `integrations/anthropic.ts` - Anthropic wrapper

#### Usage Example

```typescript
import { AIEvalClient } from "@evalai/sdk";

// Zero-config initialization
const client = AIEvalClient.init();

// Create a trace
const trace = await client.traces.create({
  name: "User Query",
  traceId: "trace-123",
  metadata: { userId: "456" },
});

// Run an evaluation
const evaluation = await client.evaluations.create({
  name: "Chatbot Quality Test",
  type: "unit_test",
  organizationId: 1,
});
```

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

- **Framework:** next@15.3.5, react@19, react-dom@19
- **Database:** drizzle-orm@0.44.6, @libsql/client@0.15.15
- **Auth:** better-auth@1.3.27
- **Billing:** autumn-js@0.1.40, atmn@0.0.27
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
  "lint": "next lint"
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

### Developer Experience

- **TypeScript SDK** - Type-safe client library
- **Retry Logic** - Exponential backoff
- **Debug Logger** - Request/response logging
- **Context Propagation** - Automatic metadata passing
- **Error Handling** - Custom error classes
- **Zod Validation** - Runtime type checking

### Deployment

- **Vercel** - Hosting and edge functions
- **v0.app** - Design and deployment sync
- **GitHub** - Auto-sync from v0 deployments

---

## 📊 Statistics

### Files by Type

- **TypeScript/TSX:** ~150+ files
- **SQL Migrations:** 10 files
- **UI Components:** 57 shadcn/ui components
- **API Routes:** 30 endpoints
- **Pages:** 40+ pages
- **Seed Files:** 14 seed scripts

### Lines of Code (Estimated)

- **Total:** ~15,000+ lines
- **Frontend:** ~8,000 lines
- **Backend:** ~5,000 lines
- **SDK:** ~2,000 lines

### Database Tables

- **Total:** 23 tables
- **Auth:** 4 tables
- **Core:** 8 tables
- **Traces:** 3 tables
- **Annotations:** 3 tables
- **Developer:** 4 tables
- **LLM Judge:** 2 tables

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
npm install

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run start
```

---

## 📝 Recent Changes

See `MIGRATION_SUMMARY.md` for details on:

- ✅ Supabase to Drizzle migration (complete)
- ✅ 20+ evaluation templates added
- ✅ Drag-and-drop evaluation builder
- ✅ Server-side feature gating
- ✅ Per-organization quotas

---

## 🔗 Resources

- **Project URL:** https://vercel.com/pauly7610s-projects/v0-ai-evaluation-platform
- **v0.app Project:** https://v0.app/chat/projects/9narvC0l5kR
- **Repository:** Auto-synced from v0.app deployments

---

**Index Generated:** Thursday, October 16, 2025  
**Index Version:** 1.0  
**Codebase Version:** Based on latest deployment
