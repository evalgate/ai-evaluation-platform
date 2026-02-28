"""Core types for the runtime foundation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine, Dict, List, Literal, Optional


@dataclass
class SpecOptions:
    timeout_ms: int = 30_000
    retries: int = 0
    tags: List[str] = field(default_factory=list)
    skip: bool = False
    only: bool = False


@dataclass
class SpecConfig:
    name: str
    executor: Any = None
    options: SpecOptions = field(default_factory=SpecOptions)
    description: Optional[str] = None
    suite: Optional[str] = None


@dataclass
class EvalSpec:
    id: str
    name: str
    executor: Any
    options: SpecOptions = field(default_factory=SpecOptions)
    file_path: Optional[str] = None
    suite: Optional[str] = None
    description: Optional[str] = None


@dataclass
class EvalContext:
    input: Any = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    options: Dict[str, Any] = field(default_factory=dict)
    trace_id: Optional[str] = None


@dataclass
class EvalResult:
    passed: bool
    score: float = 0.0
    assertions: List[Any] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    duration_ms: float = 0.0
    status: Literal["passed", "failed", "error", "timeout"] = "passed"


@dataclass
class ExecutorCapabilities:
    supports_async: bool = True
    supports_timeout: bool = True
    supports_retries: bool = True
    supports_parallel: bool = False


@dataclass
class ExecutionErrorEnvelope:
    error_type: str
    message: str
    stack: Optional[str] = None
    retryable: bool = False


@dataclass
class RuntimeHealth:
    status: Literal["healthy", "degraded", "unhealthy"] = "healthy"
    spec_count: int = 0
    memory_estimate_mb: float = 0.0
    uptime_ms: float = 0.0


# ── Error classes ────────────────────────────────────────────────────

class EvalRuntimeError(Exception):
    """Base error for runtime operations."""
    pass


class SpecRegistrationError(EvalRuntimeError):
    """Raised when a spec fails to register."""
    pass


class SpecExecutionError(EvalRuntimeError):
    """Raised when a spec fails to execute."""
    pass


class RuntimeError(EvalRuntimeError):
    """Raised for general runtime errors."""
    pass


class EvalExecutionError(EvalRuntimeError):
    """Raised during eval execution with context."""

    def __init__(self, message: str, spec_id: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message)
        self.spec_id = spec_id
        self.cause = cause
