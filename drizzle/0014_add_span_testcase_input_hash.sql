-- Add inputHash and evaluationRunId to spans for trace-linked executor
ALTER TABLE spans ADD COLUMN input_hash TEXT;
ALTER TABLE spans ADD COLUMN evaluation_run_id INTEGER REFERENCES evaluation_runs(id);

-- Add inputHash to test_cases for deterministic matching
ALTER TABLE test_cases ADD COLUMN input_hash TEXT;

-- Add assertionsJson to test_results for structured safety metrics
ALTER TABLE test_results ADD COLUMN assertions_json TEXT;

-- Add trace_linked_matched for trace coverage metric
ALTER TABLE test_results ADD COLUMN trace_linked_matched INTEGER;
