# @evalai/sdk

Official TypeScript/JavaScript SDK for the AI Evaluation Platform. Build confidence in your AI systems with comprehensive evaluation tools.

## Installation

```bash
npm install @evalai/sdk
# or
yarn add @evalai/sdk
# or
pnpm add @evalai/sdk
```

## Quick Start

```typescript
import { AIEvalClient } from '@evalai/sdk';

// Initialize with environment variables
const client = AIEvalClient.init();

// Or with explicit config
const client = new AIEvalClient({
  apiKey: 'your-api-key',
  organizationId: 123,
  debug: true
});
```

## Features

### 🎯 Evaluation Templates (v1.1.0)

The SDK now includes comprehensive evaluation template types for different testing scenarios:

```typescript
import { EvaluationTemplates } from '@evalai/sdk';

// Create evaluations with predefined templates
await client.evaluations.create({
  name: 'Prompt Optimization Test',
  type: EvaluationTemplates.PROMPT_OPTIMIZATION,
  createdBy: userId
});

// Available templates:
// Core Testing
EvaluationTemplates.UNIT_TESTING
EvaluationTemplates.OUTPUT_QUALITY

// Advanced Evaluation
EvaluationTemplates.PROMPT_OPTIMIZATION
EvaluationTemplates.CHAIN_OF_THOUGHT
EvaluationTemplates.LONG_CONTEXT_TESTING
EvaluationTemplates.MODEL_STEERING
EvaluationTemplates.REGRESSION_TESTING
EvaluationTemplates.CONFIDENCE_CALIBRATION

// Safety & Compliance
EvaluationTemplates.SAFETY_COMPLIANCE

// Domain-Specific
EvaluationTemplates.RAG_EVALUATION
EvaluationTemplates.CODE_GENERATION
EvaluationTemplates.SUMMARIZATION
```

### 📊 Organization Resource Limits (v1.1.0)

Track your organization's resource usage and limits:

```typescript
// Get current usage and limits
const limits = await client.getOrganizationLimits();

console.log('Traces:', {
  usage: limits.traces_per_organization?.usage,
  balance: limits.traces_per_organization?.balance,
  total: limits.traces_per_organization?.included_usage
});

console.log('Evaluations:', {
  usage: limits.evals_per_organization?.usage,
  balance: limits.evals_per_organization?.balance,
  total: limits.evals_per_organization?.included_usage
});

console.log('Annotations:', {
  usage: limits.annotations_per_organization?.usage,
  balance: limits.annotations_per_organization?.balance,
  total: limits.annotations_per_organization?.included_usage
});
```

### 🔍 Traces

```typescript
// Create a trace
const trace = await client.traces.create({
  name: 'User Query',
  traceId: 'trace-123',
  metadata: { userId: '456' }
});

// List traces
const traces = await client.traces.list({
  limit: 10,
  status: 'success'
});

// Create spans
const span = await client.traces.createSpan(trace.id, {
  name: 'LLM Call',
  spanId: 'span-456',
  startTime: new Date().toISOString(),
  metadata: { model: 'gpt-4' }
});
```

### 📝 Evaluations

```typescript
// Create evaluation
const evaluation = await client.evaluations.create({
  name: 'Chatbot Responses',
  type: EvaluationTemplates.OUTPUT_QUALITY,
  description: 'Test chatbot response quality',
  createdBy: userId
});

// Add test cases
await client.evaluations.createTestCase(evaluation.id, {
  input: 'What is the capital of France?',
  expectedOutput: 'Paris'
});

// Run evaluation
const run = await client.evaluations.createRun(evaluation.id, {
  status: 'running'
});
```

### ⚖️ LLM Judge

```typescript
// Evaluate with LLM judge
const result = await client.llmJudge.evaluate({
  configId: 1,
  input: 'Translate: Hello world',
  output: 'Bonjour le monde',
  metadata: { language: 'French' }
});

console.log('Score:', result.result.score);
console.log('Reasoning:', result.result.reasoning);
```

## Configuration

### Environment Variables

```bash
# Required
EVALAI_API_KEY=your-api-key

# Optional
EVALAI_ORGANIZATION_ID=123
EVALAI_BASE_URL=https://api.example.com
```

### Client Options

```typescript
const client = new AIEvalClient({
  apiKey: 'your-api-key',
  organizationId: 123,
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  debug: true,
  logLevel: 'debug',
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT']
  }
});
```

## Error Handling

```typescript
import { EvalAIError, RateLimitError } from '@evalai/sdk';

try {
  await client.traces.create({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof EvalAIError) {
    console.log('Error:', error.code, error.message);
  }
}
```

## Advanced Features

### Context Propagation

```typescript
import { withContext } from '@evalai/sdk';

withContext({ userId: '123', sessionId: 'abc' }, async () => {
  // Context automatically included in all traces
  await client.traces.create({
    name: 'Query',
    traceId: 'trace-1'
  });
});
```

### Test Suites

```typescript
import { createTestSuite } from '@evalai/sdk';

const suite = createTestSuite({
  name: 'Chatbot Tests',
  tests: [
    {
      name: 'Greeting',
      input: 'Hello',
      expectedOutput: 'Hi there!'
    }
  ]
});

await suite.run(client);
```

### Framework Integrations

```typescript
import { traceOpenAI } from '@evalai/sdk/integrations/openai';
import OpenAI from 'openai';

const openai = traceOpenAI(new OpenAI(), client);

// All OpenAI calls are automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

## TypeScript Support

The SDK is fully typed with TypeScript generics for type-safe metadata:

```typescript
interface CustomMetadata {
  userId: string;
  sessionId: string;
  model: string;
}

const trace = await client.traces.create<CustomMetadata>({
  name: 'Query',
  traceId: 'trace-1',
  metadata: {
    userId: '123',
    sessionId: 'abc',
    model: 'gpt-4'
  }
});

// TypeScript knows the exact metadata type
console.log(trace.metadata.userId);
```

## Changelog

### v1.1.0 (Latest)
- ✨ Added comprehensive evaluation template types
- ✨ Added organization resource limits tracking
- ✨ Added `getOrganizationLimits()` method
- 📚 Enhanced documentation with new features

### v1.0.0
- 🎉 Initial release
- ✅ Traces, Evaluations, LLM Judge APIs
- ✅ Framework integrations (OpenAI, Anthropic)
- ✅ Test suite builder
- ✅ Context propagation
- ✅ Error handling & retries

## License

MIT

## Support

- Documentation: https://docs.evalai.com
- Issues: https://github.com/evalai/sdk/issues
- Discord: https://discord.gg/evalai