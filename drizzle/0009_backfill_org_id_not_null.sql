-- Backfill organizationId on tables that previously allowed NULL
-- by deriving from parent joins, then mark columns NOT NULL.

-- evaluation_runs: derive from evaluations.organization_id
UPDATE evaluation_runs
SET organization_id = (
  SELECT e.organization_id FROM evaluations e WHERE e.id = evaluation_runs.evaluation_id
)
WHERE organization_id IS NULL;

-- test_results: derive from evaluation_runs.organization_id
UPDATE test_results
SET organization_id = (
  SELECT er.organization_id FROM evaluation_runs er WHERE er.id = test_results.evaluation_run_id
)
WHERE organization_id IS NULL;

-- workflow_runs: derive from traces -> evaluations (best effort via workflow)
UPDATE workflow_runs
SET organization_id = (
  SELECT w.organization_id FROM workflows w WHERE w.id = workflow_runs.workflow_id
)
WHERE organization_id IS NULL AND workflow_id IS NOT NULL;

-- agent_handoffs: derive from workflow_runs
UPDATE agent_handoffs
SET organization_id = (
  SELECT wr.organization_id FROM workflow_runs wr WHERE wr.id = agent_handoffs.workflow_run_id
)
WHERE organization_id IS NULL;

-- agent_decisions: derive from workflow_runs or spans
UPDATE agent_decisions
SET organization_id = (
  SELECT wr.organization_id FROM workflow_runs wr WHERE wr.id = agent_decisions.workflow_run_id
)
WHERE organization_id IS NULL AND workflow_run_id IS NOT NULL;

-- cost_records: derive from workflow_runs
UPDATE cost_records
SET organization_id = (
  SELECT wr.organization_id FROM workflow_runs wr WHERE wr.id = cost_records.workflow_run_id
)
WHERE organization_id IS NULL AND workflow_run_id IS NOT NULL;

-- audit_logs: set a sentinel org for system-level logs (org 1 = platform org)
-- In production, review these rows manually before running.
UPDATE audit_logs
SET organization_id = 1
WHERE organization_id IS NULL;
