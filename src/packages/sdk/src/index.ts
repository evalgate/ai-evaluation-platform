/**
 * AI Evaluation Platform SDK
 * 
 * Official TypeScript/JavaScript SDK for the AI Evaluation Platform.
 * Build confidence in your AI systems with comprehensive evaluation tools.
 * 
 * @packageDocumentation
 */

// Main SDK exports
export { AIEvalClient } from './client'

// Enhanced error handling (Tier 1.5)
export { 
  EvalAIError, 
  RateLimitError, 
  AuthenticationError, 
  ValidationError, 
  NetworkError 
} from './errors'

// Enhanced assertions (Tier 1.3)
export { 
  expect, 
  containsKeywords, 
  matchesPattern, 
  hasLength, 
  containsJSON, 
  notContainsPII, 
  hasSentiment, 
  similarTo, 
  withinRange, 
  isValidEmail, 
  isValidURL, 
  hasNoHallucinations, 
  matchesSchema,
  hasReadabilityScore,
  containsLanguage,
  hasFactualAccuracy,
  respondedWithinTime,
  hasNoToxicity,
  followsInstructions,
  containsAllRequiredFields,
  hasValidCodeSyntax
} from './assertions'

// Context propagation (Tier 2.9)
export { ContextManager, withContext, getContext } from './context'

// Test suite builder (Tier 2.7)
export { createTestSuite, TestSuite } from './testing'

// Snapshot testing (Tier 4.16)
export { snapshot, loadSnapshot, saveSnapshot, compareSnapshots } from './snapshot'

// Export/Import utilities (Tier 4.18)
export { exportData, importData, ExportFormat } from './export'

// Streaming & batch operations (Tier 2.8)
export { StreamingClient, BatchClient } from './streaming'

// Debug logger (Tier 4.17)
export { Logger } from './logger'

// Framework integrations (Tier 1.2)
export { traceOpenAI } from './integrations/openai'
export { traceAnthropic } from './integrations/anthropic'

// Types (Tier 1.4)
export type {
  AIEvalConfig,
  TraceData,
  SpanData,
  EvaluationData,
  LLMJudgeData,
  AnnotationData,
  RetryConfig,
  GenericMetadata,
  TracedResponse,
  TestCase,
  TestResult,
  SnapshotData,
  ExportOptions,
  ImportOptions,
  StreamOptions,
  BatchOptions
} from './types'

// New exports for v1.1.0
export { 
  EvaluationTemplates,
  type EvaluationTemplateType,
  type FeatureUsage,
  type OrganizationLimits
} from './types'

// Default export for convenience
import { AIEvalClient } from './client';
export default AIEvalClient;