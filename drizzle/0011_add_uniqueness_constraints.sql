-- Add unique constraint on (organization_id, user_id) for organization_members
CREATE UNIQUE INDEX IF NOT EXISTS org_members_org_user_unique
  ON organization_members (organization_id, user_id);

-- Add unique constraint on key_prefix for api_keys
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_prefix_unique
  ON api_keys (key_prefix);
