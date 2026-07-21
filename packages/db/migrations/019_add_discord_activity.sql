-- Discord activity ledger, durable voice state, and one-time account-link tokens.
-- Fail before adding the unique constraint if legacy data needs manual repair.
DROP PROCEDURE IF EXISTS assert_unique_discord_ids;
DELIMITER //
CREATE PROCEDURE assert_unique_discord_ids()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM user_info
    WHERE discord_id IS NOT NULL
    GROUP BY discord_id
    HAVING COUNT(*) > 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Duplicate user_info.discord_id values found; resolve them before migration 019';
  END IF;
END//
DELIMITER ;
CALL assert_unique_discord_ids();
DROP PROCEDURE assert_unique_discord_ids;

SET @has_unique_discord_id = (
  SELECT COUNT(*) > 0
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'user_info'
    AND index_name = 'uq_user_info_discord_id'
);
SET @add_unique_discord_id = IF(
  @has_unique_discord_id,
  'SELECT 1',
  'ALTER TABLE user_info ADD UNIQUE INDEX uq_user_info_discord_id (discord_id)'
);
PREPARE add_unique_discord_id_statement FROM @add_unique_discord_id;
EXECUTE add_unique_discord_id_statement;
DEALLOCATE PREPARE add_unique_discord_id_statement;

CREATE TABLE IF NOT EXISTS discord_activity_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  guild_id VARCHAR(32) NOT NULL,
  discord_user_id VARCHAR(32) NOT NULL,
  channel_id VARCHAR(32) NOT NULL,
  activity_type VARCHAR(16) NOT NULL,
  source_key VARCHAR(128) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  points INT UNSIGNED NOT NULL,
  credited_user_id VARCHAR(64) NULL,
  credited_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE INDEX uq_discord_activity_source (guild_id, activity_type, source_key),
  INDEX idx_discord_activity_uncredited (discord_user_id, credited_user_id),
  INDEX idx_discord_activity_user_period (credited_user_id, occurred_at),
  CONSTRAINT fk_discord_activity_user
    FOREIGN KEY (credited_user_id) REFERENCES user_info(steamid64)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discord_voice_state (
  guild_id VARCHAR(32) NOT NULL,
  discord_user_id VARCHAR(32) NOT NULL,
  channel_id VARCHAR(32) NULL,
  connected_at DATETIME(3) NULL,
  eligible_since DATETIME(3) NULL,
  remainder_ms INT UNSIGNED NOT NULL DEFAULT 0,
  last_observed_at DATETIME(3) NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (guild_id, discord_user_id),
  INDEX idx_discord_voice_active_channel (guild_id, channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discord_link_tokens (
  token_hash VARCHAR(64) NOT NULL,
  guild_id VARCHAR(32) NOT NULL,
  discord_user_id VARCHAR(32) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  INDEX idx_discord_link_user_expiry (discord_user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
