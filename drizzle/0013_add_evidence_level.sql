-- Add evidence_level, total, trace_coverage_rate to quality_scores
ALTER TABLE quality_scores ADD COLUMN evidence_level TEXT;
ALTER TABLE quality_scores ADD COLUMN total INTEGER;
ALTER TABLE quality_scores ADD COLUMN trace_coverage_rate TEXT;
