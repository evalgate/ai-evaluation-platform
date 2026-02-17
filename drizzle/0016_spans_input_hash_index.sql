-- Index for TraceLinkedExecutor query shape: filter by input_hash, order by created_at
CREATE INDEX IF NOT EXISTS idx_spans_input_hash_created ON spans(input_hash, created_at);
