"""Streaming evaluation, batch reading, and rate-limiting utilities."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Callable, Coroutine, Dict, Generic, List, Optional, TypeVar

T = TypeVar("T")
R = TypeVar("R")


@dataclass
class BatchProgress:
    completed: int = 0
    total: int = 0
    failed: int = 0
    elapsed_ms: float = 0


@dataclass
class BatchResult(Generic[R]):
    results: List[R] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    total: int = 0
    succeeded: int = 0
    failed: int = 0
    duration_ms: float = 0


class RateLimiter:
    """Token-bucket rate limiter.

    Usage::

        limiter = RateLimiter(requests_per_second=10)
        result = await limiter.throttle(my_async_fn)
    """

    def __init__(self, requests_per_second: float = 10) -> None:
        self._interval = 1.0 / requests_per_second
        self._last_call = 0.0
        self._lock = asyncio.Lock()

    async def throttle(self, fn: Callable[[], Coroutine[Any, Any, T]]) -> T:
        async with self._lock:
            now = time.monotonic()
            wait = self._interval - (now - self._last_call)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last_call = time.monotonic()
        return await fn()


def chunk(items: List[T], size: int) -> List[List[T]]:
    """Split a list into chunks of *size*."""
    return [items[i : i + size] for i in range(0, len(items), size)]


async def stream_evaluation(
    evaluator: Callable[[str], Coroutine[Any, Any, str]],
    inputs: List[str],
    *,
    concurrency: int = 3,
    on_progress: Optional[Callable[[BatchProgress], None]] = None,
) -> AsyncIterator[Dict[str, Any]]:
    """Stream evaluation results as they complete.

    Yields dicts with ``input``, ``output``, ``index``, ``duration_ms``, and optionally ``error``.
    """
    semaphore = asyncio.Semaphore(concurrency)
    progress = BatchProgress(total=len(inputs))
    start = time.monotonic()

    async def _run(index: int, input_text: str) -> Dict[str, Any]:
        async with semaphore:
            t0 = time.monotonic()
            try:
                output = await evaluator(input_text)
                return {"index": index, "input": input_text, "output": output, "duration_ms": (time.monotonic() - t0) * 1000}
            except Exception as exc:
                return {"index": index, "input": input_text, "error": str(exc), "duration_ms": (time.monotonic() - t0) * 1000}

    tasks = [asyncio.create_task(_run(i, inp)) for i, inp in enumerate(inputs)]

    for coro in asyncio.as_completed(tasks):
        result = await coro
        progress.completed += 1
        if "error" in result:
            progress.failed += 1
        progress.elapsed_ms = (time.monotonic() - start) * 1000
        if on_progress:
            on_progress(progress)
        yield result


async def batch_read(
    fetcher: Callable[[int, int], Coroutine[Any, Any, List[T]]],
    *,
    limit: int = 100,
    max_pages: int = 100,
) -> List[T]:
    """Read all pages from a paginated API endpoint.

    Args:
        fetcher: Async function(offset, limit) -> list of items.
        limit: Page size.
        max_pages: Safety cap on number of pages.
    """
    all_items: List[T] = []
    offset = 0
    for _ in range(max_pages):
        page = await fetcher(offset, limit)
        if not page:
            break
        all_items.extend(page)
        if len(page) < limit:
            break
        offset += limit
    return all_items
