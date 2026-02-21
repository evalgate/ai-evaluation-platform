# Share Link Privacy Scrubbing

This document describes how export data is validated and what guarantees the `privacyScrubbed: true` flag provides when viewing shared evaluations.

---

## What Is Scrubbed

Export data for public share links is validated at publish time. The following are **rejected** (never stored):

- **Secret-like keys** (case-insensitive, unknownwhere in the object tree): `apiKey`, `api_key`, `authorization`, `bearer`, `bearer_token`, `secret`, `password`, `token`, `organizationId`, `organization_id`, `userId`, `user_id`, `createdBy`, `created_by`, `annotatorId`, `annotator_id`, `internalNotes`, `internal_notes`
- **Secret-like values** in strings: OpenAI-style API keys (`sk-...`), Bearer tokens, JWTs
- **Top-level keys** not in the allowlist (e.g. `_internal`, `share_id`, `published_at` in the stored payload)

**Allowed** top-level keys: `evaluation`, `timestamp`, `summary`, `qualityScore`, `type`, `testResults`, `evaluations`, `judgeEvaluations`, `criteria`, `interRaterReliability`, `variants`, `results`, `statisticalSignificance`, `comparison`, `codeValidation`, `judgePrompt`, `judgeModel`, `aggregateMetrics`.

Implementation: [src/lib/shared-exports/sanitize.ts](../src/lib/shared-exports/sanitize.ts)

---

## When Scrubbing Happens

- **Write-time only:** The single write path for `shared_exports` uses `prepareExportForShare()` (sanitize + validate). All inserts/updates to `shared_exports.exportData` go through this path. If unknown forbidden keys or secret-like values are detected, the request fails with a validation error. **No unsanitized export can ever be persisted.**
- **Read-time:** The export endpoint `GET /api/exports/[shareId]` returns stored `exportData` (already validated at publish) and sets `privacyScrubbed: true` in the DTO.

---

## What `privacyScrubbed: true` Means

- Export data was **validated** at publish time; no PII/secrets in the payload.
- **Implementation:** The flow validates via `assertNoSecrets` (rejects); it does not strip secrets from nested objects. Data with secrets never reaches storage.

**What it does not mean:**

- No PII in evaluation names or descriptions — those are allowed and may contain user-provided text.
- No scrubbing of content within allowed fields (e.g. test case inputs/outputs).

---

## Related

- [Exporting and Sharing](EXPORTING_AND_SHARING.md) — full export and share workflow
- [API contract](api-contract.md) — ShareExportDTO shape
