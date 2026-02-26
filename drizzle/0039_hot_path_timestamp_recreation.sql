-- Phase 3-B: Recreate 5 hot-path tables with integer timestamps
-- Converts text timestamp columns to INTEGER (Unix seconds).
-- Uses the recreate-table pattern (same as 0028) since SQLite lacks ALTER COLUMN.
-- Also drops the interim `_int` columns added by 0035 for test_results/spans.

PRAGMA foreign_keys=OFF;
--> statement-breakpoint

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. evaluation_runs
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS evaluation_runs_new;
--> statement-breakpoint

CREATE TABLE evaluation_runs_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  evaluation_id INTEGER NOT NULL REFERENCES evaluations(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cases INTEGER DEFAULT 0,
  passed_cases INTEGER DEFAULT 0,
  failed_cases INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  trace_log TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  environment TEXT DEFAULT 'dev',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint

INSERT INTO evaluation_runs_new (
  id, evaluation_id, organization_id, idempotency_key, status,
  total_cases, passed_cases, failed_cases, processed_count, trace_log,
  started_at, completed_at, environment, created_at
)
SELECT
  id, evaluation_id, organization_id, idempotency_key, status,
  total_cases, passed_cases, failed_cases, processed_count, trace_log,
  CASE WHEN typeof(started_at) = 'text' AND started_at != ''
       THEN CAST(strftime('%s', started_at) AS INTEGER) ELSE started_at END,
  CASE WHEN typeof(completed_at) = 'text' AND completed_at != ''
       THEN CAST(strftime('%s', completed_at) AS INTEGER) ELSE completed_at END,
  environment,
  CASE WHEN typeof(created_at) = 'text' AND created_at != ''
       THEN COALESCE(CAST(strftime('%s', created_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
       ELSE COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER)) END
FROM evaluation_runs;
--> statement-breakpoint

DROP TABLE evaluation_runs;
--> statement-breakpoint
ALTER TABLE evaluation_runs_new RENAME TO evaluation_runs;
--> statement-breakpoint

-- Recreate indexes for evaluation_runs
CREATE INDEX IF NOT EXISTS idx_eval_runs_eval_id ON evaluation_runs(evaluation_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_eval_runs_org_id ON evaluation_runs(organization_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_eval_runs_status ON evaluation_runs(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_eval_runs_created_at ON evaluation_runs(created_at);
--> statement-breakpoint

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. api_keys
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS api_keys_new;
--> statement-breakpoint

CREATE TABLE api_keys_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes TEXT NOT NULL,
  last_used_at INTEGER,
  expires_at INTEGER,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint

INSERT INTO api_keys_new (
  id, user_id, organization_id, key_hash, key_prefix, name, scopes,
  last_used_at, expires_at, revoked_at, created_at
)
SELECT
  id, user_id, organization_id, key_hash, key_prefix, name, scopes,
  CASE WHEN typeof(last_used_at) = 'text' AND last_used_at != ''
       THEN CAST(strftime('%s', last_used_at) AS INTEGER) ELSE NULL END,
  CASE WHEN typeof(expires_at) = 'text' AND expires_at != ''
       THEN CAST(strftime('%s', expires_at) AS INTEGER) ELSE NULL END,
  CASE WHEN typeof(revoked_at) = 'text' AND revoked_at != ''
       THEN CAST(strftime('%s', revoked_at) AS INTEGER) ELSE NULL END,
  CASE WHEN typeof(created_at) = 'text' AND created_at != ''
       THEN COALESCE(CAST(strftime('%s', created_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
       ELSE COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER)) END
FROM api_keys;
--> statement-breakpoint

DROP TABLE api_keys;
--> statement-breakpoint
ALTER TABLE api_keys_new RENAME TO api_keys;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
--> statement-breakpoint

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. webhooks
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS webhooks_new;
--> statement-breakpoint

CREATE TABLE webhooks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  secret TEXT NOT NULL,
  encrypted_secret TEXT,
  secret_iv TEXT,
  secret_tag TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_delivered_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint

INSERT INTO webhooks_new (
  id, organization_id, url, events, secret, encrypted_secret, secret_iv, secret_tag,
  status, last_delivered_at, created_at, updated_at
)
SELECT
  id, organization_id, url, events, secret, encrypted_secret, secret_iv, secret_tag,
  status,
  CASE WHEN typeof(last_delivered_at) = 'text' AND last_delivered_at != ''
       THEN CAST(strftime('%s', last_delivered_at) AS INTEGER) ELSE NULL END,
  CASE WHEN typeof(created_at) = 'text' AND created_at != ''
       THEN COALESCE(CAST(strftime('%s', created_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
       ELSE COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER)) END,
  CASE WHEN typeof(updated_at) = 'text' AND updated_at != ''
       THEN COALESCE(CAST(strftime('%s', updated_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
       ELSE COALESCE(updated_at, CAST(strftime('%s', 'now') AS INTEGER)) END
FROM webhooks;
--> statement-breakpoint

DROP TABLE webhooks;
--> statement-breakpoint
ALTER TABLE webhooks_new RENAME TO webhooks;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON webhooks(organization_id);
--> statement-breakpoint

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. test_results (also drops interim created_at_int from 0035)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS test_results_new;
--> statement-breakpoint

CREATE TABLE test_results_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  evaluation_run_id INTEGER NOT NULL REFERENCES evaluation_runs(id),
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  score INTEGER,
  error TEXT,
  assertions_json TEXT,
  trace_linked_matched INTEGER,
  has_provenance INTEGER,
  duration_ms INTEGER,
  messages TEXT,
  tool_calls TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint

INSERT INTO test_results_new (
  id, evaluation_run_id, test_case_id, organization_id, status,
  output, score, error, assertions_json, trace_linked_matched,
  has_provenance, duration_ms, messages, tool_calls, created_at
)
SELECT
  id, evaluation_run_id, test_case_id, organization_id, status,
  output, score, error, assertions_json, trace_linked_matched,
  has_provenance, duration_ms, messages, tool_calls,
  CASE
    WHEN created_at_int IS NOT NULL THEN created_at_int
    WHEN typeof(created_at) = 'text' AND created_at != ''
      THEN COALESCE(CAST(strftime('%s', created_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
    ELSE COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER))
  END
FROM test_results;
--> statement-breakpoint

DROP TABLE test_results;
--> statement-breakpoint
ALTER TABLE test_results_new RENAME TO test_results;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_test_results_eval_run_id ON test_results(evaluation_run_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_test_results_org_id ON test_results(organization_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
--> statement-breakpoint

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. spans (also drops interim created_at_int from 0035)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS spans_new;
--> statement-breakpoint

CREATE TABLE spans_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  trace_id INTEGER NOT NULL REFERENCES traces(id),
  span_id TEXT NOT NULL UNIQUE,
  parent_span_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  duration_ms INTEGER,
  input TEXT,
  input_hash TEXT,
  output TEXT,
  evaluation_run_id INTEGER REFERENCES evaluation_runs(id),
  metadata TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint

INSERT INTO spans_new (
  id, trace_id, span_id, parent_span_id, name, type,
  start_time, end_time, duration_ms, input, input_hash, output,
  evaluation_run_id, metadata, created_at
)
SELECT
  id, trace_id, span_id, parent_span_id, name, type,
  CASE WHEN typeof(start_time) = 'text' AND start_time != ''
       THEN CAST(strftime('%s', start_time) AS INTEGER) ELSE start_time END,
  CASE WHEN typeof(end_time) = 'text' AND end_time != ''
       THEN CAST(strftime('%s', end_time) AS INTEGER) ELSE end_time END,
  duration_ms, input, input_hash, output,
  evaluation_run_id, metadata,
  CASE
    WHEN created_at_int IS NOT NULL THEN created_at_int
    WHEN typeof(created_at) = 'text' AND created_at != ''
      THEN COALESCE(CAST(strftime('%s', created_at) AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
    ELSE COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER))
  END
FROM spans;
--> statement-breakpoint

DROP TABLE spans;
--> statement-breakpoint
ALTER TABLE spans_new RENAME TO spans;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_spans_eval_run_id ON spans(evaluation_run_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_spans_input_hash ON spans(input_hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_spans_created_at ON spans(created_at);
--> statement-breakpoint

PRAGMA foreign_keys=ON;
