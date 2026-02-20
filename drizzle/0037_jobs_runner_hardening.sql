-- Jobs runner hardening (Phase: overlap safety, observability, DLQ ops)
-- Adds lock/TTL columns, attempt timing, structured error codes, and global runner lock table.

-- ── Lock / TTL columns ──────────────────────────────────────────────────────
ALTER TABLE `jobs` ADD COLUMN `locked_at` INTEGER;
ALTER TABLE `jobs` ADD COLUMN `locked_until` INTEGER;
ALTER TABLE `jobs` ADD COLUMN `locked_by` TEXT;

-- ── Attempt timing columns ───────────────────────────────────────────────────
ALTER TABLE `jobs` ADD COLUMN `last_started_at` INTEGER;
ALTER TABLE `jobs` ADD COLUMN `last_finished_at` INTEGER;
ALTER TABLE `jobs` ADD COLUMN `last_duration_ms` INTEGER;

-- ── Structured error code ────────────────────────────────────────────────────
ALTER TABLE `jobs` ADD COLUMN `last_error_code` TEXT;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `idx_jobs_status_locked_until` ON `jobs` (`status`, `locked_until`);
CREATE INDEX IF NOT EXISTS `idx_jobs_org_id` ON `jobs` (`organization_id`);

-- ── Global runner lock table ─────────────────────────────────────────────────
CREATE TABLE `job_runner_locks` (
  `lock_name` TEXT PRIMARY KEY NOT NULL,
  `locked_until` INTEGER NOT NULL DEFAULT 0,
  `locked_by` TEXT,
  `updated_at` INTEGER NOT NULL DEFAULT 0
);

-- Seed the default lock row (locked_until=0 means unlocked)
INSERT INTO `job_runner_locks` (`lock_name`, `locked_until`, `updated_at`)
VALUES ('default', 0, 0);
