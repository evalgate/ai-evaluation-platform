# pauly4010-evalai-sdk (Python)

Python SDK for the [AI Evaluation Platform](https://github.com/pauly7610/ai-evaluation-platform) — traces, evaluations, assertions, and workflow tracing for LLM applications.

> Feature-compatible with the TypeScript SDK (`@pauly4010/evalai-sdk`).

## Install

```bash
pip install pauly4010-evalai-sdk
```

With optional integrations:

```bash
pip install "pauly4010-evalai-sdk[openai]"       # OpenAI tracing
pip install "pauly4010-evalai-sdk[anthropic]"    # Anthropic tracing
pip install "pauly4010-evalai-sdk[all]"          # Everything
```

## Quick start

```python
import asyncio
from evalai_sdk import AIEvalClient, CreateTraceParams

async def main():
    # Zero-config (reads EVALAI_API_KEY env var)
    client = AIEvalClient.init()

    # Or explicit
    client = AIEvalClient(api_key="sk-...", organization_id=1)

    # Create a trace
    trace = await client.traces.create(CreateTraceParams(name="user-query"))
    print(trace.id, trace.trace_id)

    # List evaluations
    evals = await client.evaluations.list()
    for ev in evals:
        print(ev.name, ev.status)

    await client.close()

asyncio.run(main())
```

### Context manager

```python
async with AIEvalClient(api_key="sk-...") as client:
    trace = await client.traces.create(CreateTraceParams(name="test"))
```

## Assertions

20+ assertion functions for evaluating LLM output:

```python
from evalai_sdk import expect

result = expect("The capital of France is Paris.").to_contain("Paris")
assert result.passed

result = expect("Hello World").to_not_contain_pii()
assert result.passed

result = expect(0.95).to_be_between(0.0, 1.0)
assert result.passed
```

Standalone functions:

```python
from evalai_sdk import contains_keywords, has_no_toxicity, matches_pattern

assert contains_keywords("quick brown fox", ["quick", "fox"])
assert has_no_toxicity("Thank you for your help.")
assert matches_pattern("abc-123", r"\w+-\d+")
```

## Test suites

```python
from evalai_sdk import create_test_suite
from evalai_sdk.types import TestSuiteCase, TestSuiteConfig

suite = create_test_suite("my-suite", TestSuiteConfig(
    evaluator=my_llm_function,
    test_cases=[
        TestSuiteCase(name="greeting", input="Hello", expected_output="Hi there!"),
        TestSuiteCase(name="pii-check", input="Describe yourself",
                      assertions=[{"type": "not_contains_pii"}]),
    ],
))

result = await suite.run()
print(f"{result.passed_count}/{result.total} passed")
```

## Workflow tracing

Track multi-agent workflows with handoffs, decisions, and cost:

```python
from evalai_sdk import AIEvalClient, WorkflowTracer
from evalai_sdk.types import CostCategory, HandoffType, RecordCostParams

client = AIEvalClient.init()
tracer = WorkflowTracer(client)

ctx = await tracer.start_workflow("research-pipeline")
span = await tracer.start_agent_span("researcher", {"query": "AI trends"})
await tracer.end_agent_span(span, {"findings": "..."})

await tracer.record_handoff("researcher", "writer", handoff_type=HandoffType.DELEGATION)
await tracer.record_cost(RecordCostParams(
    agent_name="researcher", category=CostCategory.LLM_INPUT, amount=0.05, tokens=1500
))

await tracer.end_workflow()
print(f"Total cost: ${tracer.get_total_cost():.2f}")
```

## OpenAI integration

```python
from openai import AsyncOpenAI
from evalai_sdk import AIEvalClient
from evalai_sdk.integrations.openai import trace_openai

openai_client = AsyncOpenAI()
eval_client = AIEvalClient.init()

traced = trace_openai(openai_client, eval_client)
response = await traced.chat.completions.create(model="gpt-4", messages=[...])
```

## Anthropic integration

```python
from anthropic import AsyncAnthropic
from evalai_sdk import AIEvalClient
from evalai_sdk.integrations.anthropic import trace_anthropic

anthropic_client = AsyncAnthropic()
eval_client = AIEvalClient.init()

traced = trace_anthropic(anthropic_client, eval_client)
response = await traced.messages.create(model="claude-3-opus-20240229", messages=[...])
```

## API modules

| Module | Methods |
|---|---|
| `client.traces` | `create`, `list`, `get`, `update`, `delete`, `create_span`, `list_spans` |
| `client.evaluations` | `create`, `get`, `list`, `update`, `delete`, `create_test_case`, `list_test_cases`, `create_run`, `list_runs`, `get_run` |
| `client.llm_judge` | `evaluate`, `create_config`, `list_configs`, `list_results`, `get_alignment` |
| `client.annotations` | `create`, `list`, `tasks.create`, `tasks.list`, `tasks.get`, `tasks.items.create`, `tasks.items.list` |
| `client.developer` | `get_usage`, `get_usage_summary`, `api_keys.*`, `webhooks.*` |
| `client.organizations` | `get_current` |

## Development

```bash
cd src/packages/sdk-python
pip install -e ".[dev]"
pytest
```

## License

MIT
