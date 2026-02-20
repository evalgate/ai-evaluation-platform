-- Standardize traces.created_at from text to integer (Unix seconds)
-- Matches organizations pattern for schema consistency.
-- SQLite: recreate table since ALTER COLUMN type is not supported.

PRAGMA foreign_keys=OFF;

-- Retry-safe: drop if left from failed run
DROP TABLE IF EXISTS traces_new;

CREATE TABLE traces_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  trace_id TEXT NOT NULL UNIQUE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'pending',
  duration_ms INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

-- Convert ISO text to Unix seconds (unixepoch parses ISO8601 in SQLite 3.38+)
INSERT INTO traces_new (id, name, trace_id, organization_id, status, duration_ms, metadata, created_at)
SELECT
  id, name, trace_id, organization_id, status, duration_ms, metadata,
  COALESCE(unixepoch(created_at), strftime('%s', replace(created_at, 'T', ' ')), strftime('%s', 'now'))
FROM traces;

DROP TABLE traces;

ALTER TABLE traces_new RENAME TO traces;

PRAGMA foreign_keys=ON;
