-- Standardize organization_members.created_at from text to integer (Unix seconds)
-- Matches organizations pattern for schema consistency.
-- SQLite: recreate table since ALTER COLUMN type is not supported.

PRAGMA foreign_keys=OFF;

-- Retry-safe: drop if left from failed run
DROP TABLE IF EXISTS organization_members_new;

CREATE TABLE organization_members_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Convert ISO text to Unix seconds (unixepoch parses ISO8601 in SQLite 3.38+)
INSERT INTO organization_members_new (id, organization_id, user_id, role, created_at)
SELECT
  id, organization_id, user_id, role,
  COALESCE(unixepoch(created_at), strftime('%s', replace(created_at, 'T', ' ')), strftime('%s', 'now'))
FROM organization_members;

DROP TABLE organization_members;

ALTER TABLE organization_members_new RENAME TO organization_members;

PRAGMA foreign_keys=ON;
