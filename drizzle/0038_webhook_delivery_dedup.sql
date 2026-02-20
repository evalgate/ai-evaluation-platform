-- Webhook delivery deduplication (Phase 5-A)
-- Adds payload_hash column and unique index to prevent duplicate deliveries.

ALTER TABLE `webhook_deliveries` ADD COLUMN `payload_hash` TEXT;

-- Unique constraint: same webhook + event + payload = one delivery
CREATE UNIQUE INDEX IF NOT EXISTS `idx_webhook_deliveries_dedup`
  ON `webhook_deliveries` (`webhook_id`, `event_type`, `payload_hash`);
