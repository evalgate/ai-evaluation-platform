# Audit Trail

Critical mutations are traceable via the audit log.

## Logged Actions

| Action | Resource | When |
|--------|----------|------|
| `share_link_created` | shared_export | Export published as public share |
| `share_link_revoked` | shared_export | Share link unpublished |
| `api_key_created` | api_key | New API key created |
| `api_key_revoked` | api_key | API key revoked |
| `baseline_updated` | evaluation | Published run set as baseline |
| `run_imported` | evaluation_run | Run imported via API |

## Entry Shape

Each entry includes:

- `organizationId`, `userId` (actor)
- `action`, `resourceType`, `resourceId`
- `metadata` — `apiKeyId` when authenticated via API key; entity-specific fields
- `createdAt`

## Query by Entity

```typescript
// Who changed the baseline and when?
const logs = await auditService.listForEntity(orgId, "evaluation", "42");
```

## Access

Audit logs are admin-only. `GET /api/audit-logs` requires admin/owner role.
