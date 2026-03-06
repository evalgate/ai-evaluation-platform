"""CheckReport and related types for formatters.

Port of ``cli/formatters/types.ts``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

GateVerdict = Literal["pass", "warn", "fail"]
GateMode = Literal["enforced", "neutral"]

FailureReasonCode = Literal[
    "PASS",
    "WARN_REGRESSION",
    "LOW_SAMPLE_SIZE",
    "BASELINE_MISSING",
    "SCORE_TOO_LOW",
    "DELTA_TOO_HIGH",
    "COST_BUDGET_EXCEEDED",
    "LATENCY_BUDGET_EXCEEDED",
    "POLICY_FAILED",
    "UNKNOWN",
    "LOW_SCORE",
    "LOW_PASS_RATE",
    "SAFETY_RISK",
    "LATENCY_RISK",
    "COST_RISK",
    "MAX_DROP_EXCEEDED",
    "INSUFFICIENT_EVIDENCE",
    "POLICY_VIOLATION",
]

CHECK_REPORT_SCHEMA_VERSION = 1


@dataclass
class ScoreBreakdown01:
    pass_rate: Optional[float] = None
    safety: Optional[float] = None
    judge: Optional[float] = None
    schema: Optional[float] = None
    latency: Optional[float] = None
    cost: Optional[float] = None


@dataclass
class ScoreContribPts:
    pass_rate_pts: Optional[float] = None
    safety_pts: Optional[float] = None
    compliance_pts: Optional[float] = None
    performance_pts: Optional[float] = None


@dataclass
class GateThresholds:
    min_score: Optional[float] = None
    min_pass_rate: Optional[float] = None
    min_safety: Optional[float] = None
    max_drop: Optional[float] = None
    warn_drop: Optional[float] = None
    min_n: Optional[int] = None
    allow_weak_evidence: Optional[bool] = None
    baseline: Optional[str] = None
    max_cost_usd: Optional[float] = None
    max_latency_ms: Optional[float] = None
    max_cost_delta_usd: Optional[float] = None


@dataclass
class FailedCase:
    test_case_id: Optional[int] = None
    status: Optional[str] = None
    name: Optional[str] = None
    input: Optional[str] = None
    input_snippet: Optional[str] = None
    expected_output: Optional[str] = None
    expected_snippet: Optional[str] = None
    output: Optional[str] = None
    output_snippet: Optional[str] = None
    reason: Optional[str] = None


@dataclass
class CiContext:
    provider: Optional[str] = None
    repo: Optional[str] = None
    sha: Optional[str] = None
    branch: Optional[str] = None
    pr: Optional[int] = None
    run_url: Optional[str] = None
    actor: Optional[str] = None


@dataclass
class CheckReport:
    evaluation_id: str = ""
    verdict: GateVerdict = "fail"
    gate_applied: bool = True
    gate_mode: GateMode = "enforced"
    reason_code: str = "UNKNOWN"
    schema_version: int = CHECK_REPORT_SCHEMA_VERSION
    run_id: Optional[int] = None
    actionable_message: Optional[str] = None
    reason_message: Optional[str] = None
    score: Optional[float] = None
    baseline_score: Optional[float] = None
    delta: Optional[float] = None
    pass_rate: Optional[float] = None
    safety_pass_rate: Optional[float] = None
    flags: Optional[list[str]] = None
    breakdown_01: Optional[ScoreBreakdown01] = None
    contrib_pts: Optional[ScoreContribPts] = None
    thresholds: Optional[GateThresholds] = None
    n: Optional[int] = None
    evidence_level: Optional[str] = None
    baseline_missing: Optional[bool] = None
    baseline_status: Optional[str] = None
    dashboard_url: Optional[str] = None
    failed_cases: list[FailedCase] = field(default_factory=list)
    failed_cases_shown: Optional[int] = None
    failed_cases_more: Optional[int] = None
    request_id: Optional[str] = None
    duration_ms: Optional[float] = None
    ci: Optional[CiContext] = None
    explain: Optional[bool] = None
    share_url: Optional[str] = None
    policy: Optional[str] = None
    baseline_run_id: Optional[int] = None
    ci_run_url: Optional[str] = None
    policy_evidence: Optional[dict[str, Any]] = None
