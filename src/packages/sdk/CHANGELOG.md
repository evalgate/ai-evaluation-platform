# Changelog

All notable changes to the @evalai/sdk package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-16

### Added
- **Evaluation Template Types**: New `EvaluationTemplates` constant with comprehensive template categories:
  - Core Testing: `UNIT_TESTING`, `OUTPUT_QUALITY`
  - Advanced Evaluation: `PROMPT_OPTIMIZATION`, `CHAIN_OF_THOUGHT`, `LONG_CONTEXT_TESTING`, `MODEL_STEERING`, `REGRESSION_TESTING`, `CONFIDENCE_CALIBRATION`
  - Safety & Compliance: `SAFETY_COMPLIANCE`
  - Domain-Specific: `RAG_EVALUATION`, `CODE_GENERATION`, `SUMMARIZATION`
- **Organization Resource Limits**: New types and methods for tracking per-organization quotas:
  - `FeatureUsage` type for tracking feature usage metrics
  - `OrganizationLimits` type for organization-level resource limits
  - `getOrganizationLimits()` method on `AIEvalClient` for fetching current usage and limits
- **Enhanced TypeScript Support**: New exported types for better type safety:
  - `EvaluationTemplateType` - Union type of all template strings
  - `FeatureUsage` - Feature usage tracking interface
  - `OrganizationLimits` - Organization limits interface

### Changed
- Updated README with comprehensive examples for new features
- Enhanced documentation with usage examples for evaluation templates and resource limits

### Developer Notes
- Per-organization limits include: `traces_per_organization`, `evals_per_organization`, `annotations_per_organization`
- Server-side enforcement prevents users from exceeding plan limits
- Resource limits reset monthly based on billing cycle

## [1.0.0] - 2024-10-15

### Added
- Initial release of @evalai/sdk
- **Core Features**:
  - Zero-config initialization with environment variable detection
  - Comprehensive Trace API with span support
  - Full Evaluation API with test cases and runs
  - LLM Judge integration for automated evaluation
- **Advanced Features**:
  - Context propagation with `withContext()` and `getContext()`
  - Test suite builder with `createTestSuite()`
  - Snapshot testing utilities
  - Export/Import utilities for data portability
  - Streaming and batch operations support
  - Debug logger with configurable log levels
- **Framework Integrations**:
  - OpenAI integration with automatic tracing
  - Anthropic integration with automatic tracing
- **Enhanced Assertions**:
  - 20+ built-in assertion helpers for LLM output validation
  - Pattern matching, sentiment analysis, similarity checks
  - JSON schema validation, PII detection, toxicity checks
- **Error Handling**:
  - Custom error classes: `EvalAIError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `NetworkError`
  - Automatic retry with configurable backoff strategies
  - Detailed error messages with error codes and solutions
- **TypeScript Support**:
  - Full TypeScript support with generic metadata types
  - Comprehensive type definitions for all APIs
  - Type-safe client configuration
- **Developer Experience**:
  - Request/response logging in debug mode
  - Configurable timeout and retry settings
  - Support for both browser and Node.js environments

[1.1.0]: https://github.com/evalai/sdk/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/evalai/sdk/releases/tag/v1.0.0