-- Hot table indexes for common query patterns (Phase 7)

-- evaluationRuns: List runs by eval, org
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_org_eval_created ON evaluation_runs(organization_id, evaluation_id, created_at);

-- testResults: Run results
CREATE INDEX IF NOT EXISTS idx_test_results_org_run ON test_results(organization_id, evaluation_run_id);

-- qualityScores: List quality by eval
CREATE INDEX IF NOT EXISTS idx_quality_scores_org_eval_created ON quality_scores(organization_id, evaluation_id, created_at);

-- spans: Spans by trace
CREATE INDEX IF NOT EXISTS idx_spans_trace_created ON spans(trace_id, created_at);

-- costRecords: Run-scoped cost (Phase 1)
CREATE INDEX IF NOT EXISTS idx_cost_records_org_run ON cost_records(organization_id, evaluation_run_id);
