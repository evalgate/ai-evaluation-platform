# Architecture

## Product Split: Local Gate vs Platform Gate

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Your Repository                              │
│                                                                     │
│  package.json          evals/baseline.json     evalgate.config.json   │
│  (test script)         (committed truth)       (optional)           │
└──────────┬──────────────────────┬───────────────────┬───────────────┘
           │                      │                   │
           ▼                      ▼                   ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   Tier 1: Local Gate │  │  Tier 2: Full    │  │  Platform Gate       │
│   (no account)       │  │  Gate (no acct)  │  │  (API key required)  │
├──────────────────────┤  ├──────────────────┤  ├──────────────────────┤
│                      │  │                  │  │                      │
│  npx evalgate init     │  │  npx evalgate      │  │  npx evalgate check    │
│  npx evalgate gate     │  │  upgrade --full  │  │  --format github     │
│                      │  │                  │  │  --onFail import     │
│  Runs: <pm> test     │  │  Runs: custom    │  │                      │
│  Compares: exit code │  │  gate script     │  │  Calls: quality API  │
│    + test count      │  │  Compares: golden │  │  Compares: score vs  │
│                      │  │    eval, latency, │  │    baseline, policy  │
│  Output:             │  │    cost, tests   │  │                      │
│  regression-report   │  │                  │  │  Output:             │
│  .json               │  │  Output:         │  │  PR annotations,     │
│                      │  │  regression-     │  │  step summary,       │
│  CI: evalai-gate.yml │  │  report.json +   │  │  dashboard import    │
│                      │  │  governance.yml  │  │                      │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
         │                        │                       │
         └────────────┬───────────┘                       │
                      │                                   │
              No account needed                   Requires account
              No API key needed                   EVALGATE_API_KEY
              Works offline                       Dashboard + history
```

### Decision Matrix

| | Tier 1 (Local) | Tier 2 (Full) | Platform |
|--|-----------------|---------------|----------|
| **Setup** | `npx evalgate init` | `npx evalgate upgrade --full` | Dashboard + config |
| **Account** | No | No | Yes |
| **API key** | No | No | Yes |
| **What it gates** | Test pass/fail + count | Golden eval, latency, cost, tests | Quality score, policy |
| **CI workflow** | Auto-generated | Upgraded auto-generated | Manual or auto |
| **Report format** | JSON + human + GitHub | JSON + human + GitHub | JSON + human + GitHub |
| **Dashboard** | No | No | Yes |
| **History** | Git only | Git only | Platform DB |
| **LLM judge** | No | No | Yes |
| **Baseline governance** | No | Yes (CODEOWNERS + labels) | N/A (server-side) |
| **Remove** | Delete 3 files | Delete 3 files + scripts | Delete config |

### Upgrade Path

```
npx evalgate init          →  npx evalgate upgrade --full  →  Add evaluationId +
(Tier 1 in 2 min)            (Tier 2 in 1 min)            EVALGATE_API_KEY
                                                           (Platform in 5 min)
```

Each tier is additive. You can use Tier 1 + Platform simultaneously.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
│                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard  │  │ API      │  │ Server Actions   │ │
│  │ Pages      │  │ Routes   │  │                  │ │
│  │ (React)    │  │ (REST)   │  │                  │ │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│        │              │                  │           │
│        └──────────────┼──────────────────┘           │
│                       ▼                              │
│  ┌─────────────────────────────────────────────────┐ │
│  │                 src/lib/                         │ │
│  │                                                 │ │
│  │  services/      scoring/      jobs/     arena/  │ │
│  │  (workflow,     (quality      (runner,  (A/B    │ │
│  │   LLM judge,    score,        enqueue)  compare)│ │
│  │   evaluations)  algorithms)                     │ │
│  └────────────────────┬────────────────────────────┘ │
│                       ▼                              │
│  ┌─────────────────────────────────────────────────┐ │
│  │              src/db/ (Drizzle ORM)              │ │
│  │              PostgreSQL (via postgres driver)     │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              src/packages/sdk/                       │
│              @evalgate/sdk                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ CLI      │  │ Client   │  │ Integrations      │ │
│  │ (init,   │  │ (API     │  │ (OpenAI,          │ │
│  │  gate,   │  │  client,  │  │  Anthropic,       │ │
│  │  check,  │  │  traces,  │  │  tracing)         │ │
│  │  doctor) │  │  evals)   │  │                   │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Data Flow: Production → Golden Dataset → Regression Loop (v3.2.2)

```
Production App
    │ SDK reportTrace({ sampleRate: 0.1 }) or POST /api/collector
    ▼
Trace Ingested (idempotent — ON CONFLICT DO NOTHING)
    │ analysis_status: pending → analyzing
    │ async job (errors + thumbs-down always analyzed, success sampled)
    │ rate-limited: MAX_ANALYSIS_RATE = 200/min per org
    ▼
Failure Detection Pipeline (background job)
    │ detect → aggregate → group (SHA-256 hash) → generate → score
    ▼
Candidate Eval Case (quarantined, quality-scored)
    │ analysis_status: analyzing → analyzed
    │
    ├─ auto_promote_eligible? ──→ Golden Regression Dataset (auto)
    │   (quality≥90 AND confidence≥0.8 AND detectors≥2)
    │
    └─ manual review needed ──→ evalgate cluster / label / analyze / synthesize
                                       │ replay + dedup check (input hash + title)
                                       ▼
                              Golden Regression Dataset (manual or synthesized)
    │
    ▼ next PR
evalgate gate / ci → golden regression runs → regression blocked ✅
    │
    ▼
evalgate doctor → "AI Reliability Report"
```

**Key infrastructure:**
- **Collector:** `POST /api/collector` — single-payload trace + spans ingest
- **Sampling:** Server-side (error=always, thumbs_down=always, success=10%)
- **Rate limiter:** Sliding-window per org, configurable via `MAX_ANALYSIS_RATE` env var
- **Idempotency:** `ON CONFLICT DO NOTHING` on `traces.traceId` + `spans.spanId`
- **Pipeline:** `trace_failure_analysis` job type with `analysis_status` lifecycle
- **Dedup:** `deduplicateAgainstExistingTests()` prevents near-duplicates in golden dataset

---

## Data Flow: Regression Gate

```
Developer pushes PR
        │
        ▼
CI triggers evalai-gate.yml
        │
        ▼
npx evalgate gate
        │
        ├── Has eval:regression-gate script?
        │       │
        │   Yes ▼                    No ▼
        │   Run project script       Run <pm> test
        │   (Tier 2 full gate)       (Tier 1 built-in)
        │       │                        │
        │       ▼                        ▼
        │   Compare golden eval,     Compare exit code
        │   confidence, latency,     + test count vs
        │   cost vs baseline         baseline
        │       │                        │
        └───────┴────────────────────────┘
                │
                ▼
        Write evals/regression-report.json
                │
                ▼
        Exit 0 (pass) or 1 (regression) or 2 (infra_error)
                │
                ▼
        CI blocks or allows merge
```

## Scaling

The platform is designed to scale horizontally:

| Layer | Scaling approach |
|-------|------------------|
| **Next.js** | Vercel serverless; auto-scales per request |
| **PostgreSQL** | Single primary; use read replicas for heavy read workloads |
| **Workers** | In-memory runner (`src/lib/workers/eval-worker.ts`); for production, replace with a queue (e.g. BullMQ, Inngest) and scale worker processes |
| **LLM calls** | Throttled per provider; use provider key rotation for higher limits |
| **Rate limits** | Per-tier (anonymous 30/min, free 200/min, pro 1000/min, enterprise 10000/min) |

For high-volume evaluation runs, consider:

1. **Batch imports** — Use the batch import API to reduce per-run overhead
2. **Async execution** — Run evaluations asynchronously; poll or webhook for completion
3. **Caching** — LLM responses are cached where applicable; ensure cache keys are stable
4. **Database** — Add indexes for hot queries; use connection pooling (e.g. PgBouncer) if needed
