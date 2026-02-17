-- Add evaluation_run_id to cost_records for run-scoped cost aggregation
ALTER TABLE cost_records ADD COLUMN evaluation_run_id INTEGER REFERENCES evaluation_runs(id);
