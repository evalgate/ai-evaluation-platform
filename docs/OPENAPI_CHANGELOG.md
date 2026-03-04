# OpenAPI Spec Changelog

When you change `docs/openapi.json`, add an entry here before running `pnpm openapi:snapshot`. CI requires this for spec hash changes.

Format: `## X.Y.Z` or `## [X.Y.Z]` with a short description.

## 3.0.0

- **AI Reliability Loop** — Major version bump: production failures automatically become regression tests
- New endpoint: `POST /api/collector` — single-payload trace + spans ingest (LangWatch-compatible)
- New endpoint: `POST /api/traces/:id/feedback` — user feedback with thumbs-down triggering analysis
- New endpoint: `GET /api/candidates` — list quarantined candidate eval cases
- New endpoint: `GET /api/candidates/:id` — candidate detail with failure report
- New endpoint: `PATCH /api/candidates/:id` — update candidate status
- New endpoint: `POST /api/candidates/:id/promote` — promote candidate to test suite (with dedup guard)
- New job type: `trace_failure_analysis` — async failure detection pipeline
- Schema: `traces.analysis_status`, `traces.source`, `traces.environment` columns added
- Schema: `failure_reports`, `candidate_eval_cases`, `user_feedback` tables added
- Schema: `idx_traces_org_trace_id` compound unique index
- Collector idempotency: `ON CONFLICT DO NOTHING` on trace + span inserts
- Rate-limit guardrail: `MAX_ANALYSIS_RATE=200/min` per org sliding window

## 2.3.0

- Bump spec version to align with SDK 2.3.0 (breaking: `hasConsistency` returns `passed` instead of `consistent`, `respondedWithinDuration`/`respondedWithinTimeSince` return `AssertionResult` instead of `boolean`; new barrel exports: `computeBaselineChecksum`, `verifyBaselineChecksum`, `resetSentimentDeprecationWarning`)

## 2.2.3

- Bump spec version to align with SDK 2.2.3 (bug fixes: `RequestCache` default TTL, `EvalGateError` subclass prototype chain + `retryAfter` direct property, `autoPaginate` returns `Promise<T[]>`, `createEvalRuntime` config-object overload, `defaultLocalExecutor` callable factory, `SnapshotManager.save` null/undefined safety, `compareSnapshots` disk-load, `AIEvalClient` default baseUrl → `https://api.evalgate.com`, `importData` optional-chaining guards, `toContainCode` raw-code detection, `hasReadabilityScore` `{min,max}` object form; new exports: `autoPaginateGenerator`, `compareSnapshots`)

## 2.2.2

- Bump spec version to align with SDK 2.2.2 (new assertions: hasPII, containsAllRequiredFields, hasValidCodeSyntax, isFactuallyConsistent, hasNoBias, respondsInLanguage + async variants; WorkflowTracer fix; importData fix; compareWithSnapshot fix)

## 2.2.1

- Bump spec version to align with SDK 2.2.1 (patch: snapshot accepts object input)

## 2.2.0

- Bump spec version to align with SDK 2.2.0 (bug fixes: specId collision, explain RunResult support, baseline self-contained, impact-analysis clean errors; new APIs: expect().not, hasPII, defineSuite object form; breaking: snapshot param order swap)

## 2.1.3

- Fix critical post-mortem bugs: multi-defineEval discovery, false regression gate, doctor localhost default, simulated execution, scoring opacity, explain "unnamed"

## 2.1.2

- Align spec version with platform 2.1.2 (type safety fixes, CI gate alignment)

## 2.1.0

- Align OpenAPI spec version with SDK 2.1.0 (EvalGate Intelligence Layer — behavioral drift, multi-judge, three-layer scoring, dataset coverage, failure detection)

## 2.0.0

- Align with SDK 2.0.0 (EvalGate rebrand)

## 1.9.1

- Align OpenAPI spec version with SDK 1.9.1 (security, type fixes, PostgreSQL migration)

## 1.0.1

- Add `evaluationRunId` query parameter to `/api/llm-judge/alignment` endpoint

## 1.0.0

- Initial documented API surface (paths, schemas)
