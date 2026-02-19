/**
 * Golden error catalog — single source of truth for canonical error codes.
 * API and SDK must use codes from this catalog. Unknown codes degrade gracefully.
 *
 * @see docs/data-retention.md for SHARE_* semantics
 * @see src/lib/api/errors.ts for API usage
 * @see src/packages/sdk/src/errors.ts for SDK documentation
 */

export const CANONICAL_ERROR_CODES = [
  // Auth
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NO_ORG_MEMBERSHIP",
  "MISSING_API_KEY",
  "MISSING_ORGANIZATION_ID",
  // Resources
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  // Rate & limits
  "RATE_LIMITED",
  "RATE_LIMIT_EXCEEDED",
  "QUOTA_EXCEEDED",
  "FEATURE_LIMIT_REACHED",
  // Share / export (410 Gone)
  "SHARE_REVOKED",
  "SHARE_EXPIRED",
  "SHARE_UNAVAILABLE",
  // Server
  "INTERNAL_ERROR",
  "INTERNAL_SERVER_ERROR",
  "SERVICE_UNAVAILABLE",
  "TIMEOUT",
  "NETWORK_ERROR",
] as const;

export type CanonicalErrorCode = (typeof CANONICAL_ERROR_CODES)[number];

/** API-specific codes (RATE_LIMITED vs RATE_LIMIT_EXCEEDED — API uses RATE_LIMITED) */
export const API_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "CONFLICT",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
  "QUOTA_EXCEEDED",
  "NO_ORG_MEMBERSHIP",
  "SHARE_REVOKED",
  "SHARE_EXPIRED",
  "SHARE_UNAVAILABLE",
] as const;
