"""Data models for the EvalAI SDK, matching the TypeScript SDK's types.ts."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar, Union

from pydantic import BaseModel, Field

TMetadata = TypeVar("TMetadata", bound=Dict[str, Any])

# ── Client config ────────────────────────────────────────────────────

class RetryConfig(BaseModel):
    max_attempts: int = 3
    backoff: Literal["exponential", "linear", "fixed"] = "exponential"
    retryable_errors: List[str] = Field(default_factory=lambda: ["RATE_LIMIT_EXCEEDED", "TIMEOUT", "NETWORK_ERROR"])

class ClientConfig(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    organization_id: Optional[int] = None
    timeout: int = 30_000
    debug: bool = False
    log_level: Literal["trace", "debug", "info", "warn", "error"] = "info"
    retry: RetryConfig = Field(default_factory=RetryConfig)
    enable_caching: bool = True
    cache_size: int = 1000
    enable_batching: bool = True
    batch_size: int = 10
    batch_delay: int = 50
    keep_alive: bool = True

# ── Evaluation templates ─────────────────────────────────────────────

class EvaluationTemplates(str, Enum):
    UNIT_TESTING = "unit-testing"
    OUTPUT_QUALITY = "output-quality"
    PROMPT_OPTIMIZATION = "prompt-optimization"
    CHAIN_OF_THOUGHT = "chain-of-thought"
    LONG_CONTEXT_TESTING = "long-context-testing"
    MODEL_STEERING = "model-steering"
    REGRESSION_TESTING = "regression-testing"
    CONFIDENCE_CALIBRATION = "confidence-calibration"
    SAFETY_COMPLIANCE = "safety-compliance"
    RAG_EVALUATION = "rag-evaluation"
    CODE_GENERATION = "code-generation"
    SUMMARIZATION = "summarization"

# ── Feature usage ────────────────────────────────────────────────────

class FeatureUsage(BaseModel):
    feature_id: str
    unlimited: bool
    interval: str
    remaining: Optional[int] = None
    limit: Optional[int] = None
    used: Optional[int] = None

class OrganizationLimits(BaseModel):
    organization_id: int
    plan: str
    features: List[FeatureUsage]

class Organization(BaseModel):
    id: int
    name: str
    slug: Optional[str] = None
    plan: Optional[str] = None

# ── Traces & Spans ───────────────────────────────────────────────────

class Trace(BaseModel):
    id: int
    trace_id: str
    name: Optional[str] = None
    organization_id: Optional[int] = None
    status: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateTraceParams(BaseModel):
    name: str
    trace_id: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    organization_id: Optional[int] = None

class UpdateTraceParams(BaseModel):
    name: Optional[str] = None
    output: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ListTracesParams(BaseModel):
    limit: int = 20
    offset: int = 0
    organization_id: Optional[int] = None
    status: Optional[str] = None

class Span(BaseModel):
    id: int
    span_id: str
    trace_id: int
    name: Optional[str] = None
    type: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None

class CreateSpanParams(BaseModel):
    name: str
    span_id: Optional[str] = None
    type: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ── Evaluations ──────────────────────────────────────────────────────

class Evaluation(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    organization_id: Optional[int] = None
    created_by: Optional[str] = None
    model_settings: Optional[Dict[str, Any]] = None
    execution_settings: Optional[Dict[str, Any]] = None
    custom_metrics: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateEvaluationParams(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    organization_id: Optional[int] = None
    model_settings: Optional[Dict[str, Any]] = None
    execution_settings: Optional[Dict[str, Any]] = None
    assertions: Optional[List[Dict[str, Any]]] = None
    test_cases: Optional[List[Dict[str, Any]]] = None

class UpdateEvaluationParams(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    model_settings: Optional[Dict[str, Any]] = None
    execution_settings: Optional[Dict[str, Any]] = None

class ListEvaluationsParams(BaseModel):
    limit: int = 20
    offset: int = 0
    status: Optional[str] = None

# ── Test Cases ───────────────────────────────────────────────────────

class TestCase(BaseModel):
    id: int
    evaluation_id: int
    name: Optional[str] = None
    input: Optional[str] = None
    expected_output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CreateTestCaseParams(BaseModel):
    name: Optional[str] = None
    input: str
    expected_output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ── Evaluation Runs ──────────────────────────────────────────────────

class EvaluationRun(BaseModel):
    id: int
    evaluation_id: int
    status: Optional[str] = None
    score: Optional[float] = None
    trace_log: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class CreateRunParams(BaseModel):
    model_settings: Optional[Dict[str, Any]] = None
    execution_settings: Optional[Dict[str, Any]] = None

# ── LLM Judge ────────────────────────────────────────────────────────

class LLMJudgeConfig(BaseModel):
    id: int
    name: str
    model: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None

class CreateLLMJudgeConfigParams(BaseModel):
    name: str
    model: str = "gpt-4"
    criteria: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    organization_id: Optional[int] = None

class LLMJudgeResult(BaseModel):
    id: int
    config_id: Optional[int] = None
    score: Optional[float] = None
    reasoning: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class RunLLMJudgeParams(BaseModel):
    config_id: int
    input: str
    output: str
    expected_output: Optional[str] = None
    context: Optional[str] = None

class ListLLMJudgeConfigsParams(BaseModel):
    limit: int = 20
    offset: int = 0

class ListLLMJudgeResultsParams(BaseModel):
    config_id: Optional[int] = None
    limit: int = 20
    offset: int = 0

class LLMJudgeAlignment(BaseModel):
    alignment_score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

class GetLLMJudgeAlignmentParams(BaseModel):
    config_id: int

# ── Annotations ──────────────────────────────────────────────────────

class Annotation(BaseModel):
    id: int
    evaluation_run_id: Optional[int] = None
    test_case_id: Optional[int] = None
    annotator_id: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    labels: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class CreateAnnotationParams(BaseModel):
    evaluation_run_id: int
    test_case_id: int
    rating: Optional[int] = None
    feedback: Optional[str] = None
    labels: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ListAnnotationsParams(BaseModel):
    evaluation_run_id: Optional[int] = None
    test_case_id: Optional[int] = None
    limit: int = 20
    offset: int = 0

class AnnotationTask(BaseModel):
    id: int
    name: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class CreateAnnotationTaskParams(BaseModel):
    name: str
    evaluation_id: int
    settings: Optional[Dict[str, Any]] = None
    organization_id: Optional[int] = None

class ListAnnotationTasksParams(BaseModel):
    limit: int = 20
    offset: int = 0

class AnnotationItem(BaseModel):
    id: int
    task_id: int
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class CreateAnnotationItemParams(BaseModel):
    content: Dict[str, Any]

class ListAnnotationItemsParams(BaseModel):
    status: Optional[str] = None
    limit: int = 20
    offset: int = 0

# ── API Keys ─────────────────────────────────────────────────────────

class APIKey(BaseModel):
    id: int
    name: str
    key_prefix: Optional[str] = None
    scopes: Optional[List[str]] = None
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class APIKeyWithSecret(APIKey):
    key: str

class CreateAPIKeyParams(BaseModel):
    name: str
    scopes: Optional[List[str]] = None
    expires_at: Optional[str] = None
    organization_id: Optional[int] = None

class UpdateAPIKeyParams(BaseModel):
    name: Optional[str] = None
    scopes: Optional[List[str]] = None

class ListAPIKeysParams(BaseModel):
    organization_id: Optional[int] = None

class APIKeyUsage(BaseModel):
    total_requests: int = 0
    requests_today: int = 0
    last_used_at: Optional[datetime] = None

# ── Webhooks ─────────────────────────────────────────────────────────

class Webhook(BaseModel):
    id: int
    url: str
    events: Optional[List[str]] = None
    active: bool = True
    created_at: Optional[datetime] = None

class CreateWebhookParams(BaseModel):
    url: str
    events: List[str]
    organization_id: Optional[int] = None

class UpdateWebhookParams(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None

class ListWebhooksParams(BaseModel):
    organization_id: Optional[int] = None

class WebhookDelivery(BaseModel):
    id: int
    webhook_id: int
    event: Optional[str] = None
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    created_at: Optional[datetime] = None

class ListWebhookDeliveriesParams(BaseModel):
    limit: int = 20
    offset: int = 0

# ── Usage ────────────────────────────────────────────────────────────

class UsageStats(BaseModel):
    total_requests: int = 0
    total_evaluations: int = 0
    total_traces: int = 0
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

class GetUsageParams(BaseModel):
    organization_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class UsageSummary(BaseModel):
    evaluations: int = 0
    traces: int = 0
    test_cases: int = 0
    api_calls: int = 0

# ── Test Suite ───────────────────────────────────────────────────────

class TestSuiteCase(BaseModel):
    name: str
    input: str
    expected_output: Optional[str] = None
    assertions: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class TestSuiteConfig(BaseModel):
    model: Optional[str] = None
    provider: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    evaluator: Optional[Any] = None
    test_cases: List[TestSuiteCase] = Field(default_factory=list)
    timeout: int = 30_000

class TestSuiteCaseResult(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    name: str
    passed: bool
    duration_ms: int = 0
    input: str
    output: Optional[str] = None
    expected_output: Optional[str] = None
    assertions: List[Any] = Field(default_factory=list)
    error: Optional[str] = None

class TestSuiteResult(BaseModel):
    suite_name: str
    passed: bool
    total: int = 0
    passed_count: int = 0
    failed_count: int = 0
    duration_ms: int = 0
    results: List[TestSuiteCaseResult] = Field(default_factory=list)

# ── Workflow types ───────────────────────────────────────────────────

class WorkflowNode(BaseModel):
    id: str
    type: str
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class WorkflowEdge(BaseModel):
    source: str = Field(alias="from")
    target: str = Field(alias="to")
    condition: Optional[str] = None
    label: Optional[str] = None

    model_config = {"populate_by_name": True}

class WorkflowDefinition(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    entrypoint: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class WorkflowStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class HandoffType(str, Enum):
    DELEGATION = "delegation"
    ESCALATION = "escalation"
    COLLABORATION = "collaboration"
    FALLBACK = "fallback"

class AgentHandoff(BaseModel):
    from_agent: Optional[str] = None
    to_agent: str
    context: Optional[Dict[str, Any]] = None
    handoff_type: HandoffType = HandoffType.DELEGATION
    timestamp: Optional[datetime] = None

class DecisionType(str, Enum):
    ROUTING = "routing"
    SELECTION = "selection"
    FILTERING = "filtering"
    PRIORITIZATION = "prioritization"

class DecisionAlternative(BaseModel):
    name: str
    score: Optional[float] = None
    reasoning: Optional[str] = None

class RecordDecisionParams(BaseModel):
    agent_name: str
    decision_type: DecisionType = DecisionType.ROUTING
    chosen: str
    alternatives: List[DecisionAlternative] = Field(default_factory=list)
    reasoning: Optional[str] = None
    confidence: Optional[float] = None
    input_context: Optional[Dict[str, Any]] = None

class CostCategory(str, Enum):
    LLM_INPUT = "llm_input"
    LLM_OUTPUT = "llm_output"
    EMBEDDING = "embedding"
    TOOL_CALL = "tool_call"
    OTHER = "other"

class RecordCostParams(BaseModel):
    agent_name: str
    category: CostCategory
    amount: float
    currency: str = "USD"
    model: Optional[str] = None
    tokens: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class CostRecord(BaseModel):
    agent_name: str
    category: CostCategory
    amount: float
    currency: str = "USD"
    model: Optional[str] = None
    tokens: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class WorkflowContext(BaseModel):
    workflow_id: Optional[str] = None
    trace_id: Optional[int] = None
    name: str
    status: WorkflowStatus = WorkflowStatus.RUNNING
    definition: Optional[WorkflowDefinition] = None
    metadata: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None

class AgentSpanContext(BaseModel):
    span_id: Optional[str] = None
    agent_name: str
    trace_id: Optional[int] = None
    parent_span_id: Optional[str] = None
    started_at: Optional[datetime] = None
