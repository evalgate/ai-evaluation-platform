-- Add performance indexes for frequently queried fields
-- Created: 2025-10-19 for performance optimization

-- Evaluations indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_org_id ON evaluations(organizationId);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(createdAt DESC);

-- Evaluation runs indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_evaluation_id ON evaluationRuns(evaluationId);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_created_at ON evaluationRuns(createdAt DESC);

-- Traces indexes
CREATE INDEX IF NOT EXISTS idx_traces_org_id ON traces(organizationId);
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(createdAt DESC);

-- Trace spans indexes
CREATE INDEX IF NOT EXISTS idx_trace_spans_trace_id ON traceSpans(traceId);
CREATE INDEX IF NOT EXISTS idx_trace_spans_parent_span_id ON traceSpans(parentSpanId);

-- Annotation tasks indexes
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_org_id ON annotationTasks(organizationId);
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_status ON annotationTasks(status);
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_created_at ON annotationTasks(createdAt DESC);

-- Annotation items indexes
CREATE INDEX IF NOT EXISTS idx_annotation_items_task_id ON annotationItems(annotationTaskId);
CREATE INDEX IF NOT EXISTS idx_annotation_items_status ON annotationItems(status);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON apiKeys(organizationId);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON apiKeys(keyHash);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON webhooks(organizationId);

-- Webhook deliveries indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhookDeliveries(webhookId);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhookDeliveries(createdAt DESC);

-- LLM Judge configs indexes
CREATE INDEX IF NOT EXISTS idx_llm_judge_configs_org_id ON llmJudgeConfigs(organizationId);

-- LLM Judge results indexes
CREATE INDEX IF NOT EXISTS idx_llm_judge_results_config_id ON llmJudgeResults(configId);
CREATE INDEX IF NOT EXISTS idx_llm_judge_results_created_at ON llmJudgeResults(createdAt DESC);

