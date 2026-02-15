-- Add foreign key columns to llm_judge_results for alignment tracking
ALTER TABLE llm_judge_results ADD COLUMN evaluation_run_id INTEGER REFERENCES evaluation_runs(id);
ALTER TABLE llm_judge_results ADD COLUMN test_case_id INTEGER REFERENCES test_cases(id);
