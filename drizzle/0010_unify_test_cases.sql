-- Migrate data from evaluation_test_cases into test_cases (canonical table).
-- evaluation_test_cases rows that already have a matching (evaluationId, input) in
-- test_cases are skipped.

INSERT INTO test_cases (evaluation_id, name, input, expected_output, metadata, created_at)
SELECT
  etc.evaluation_id,
  'Test Case ' || etc.id,
  etc.input,
  etc.expected_output,
  etc.metadata,
  etc.created_at
FROM evaluation_test_cases etc
WHERE NOT EXISTS (
  SELECT 1 FROM test_cases tc
  WHERE tc.evaluation_id = etc.evaluation_id
    AND tc.input = etc.input
);
