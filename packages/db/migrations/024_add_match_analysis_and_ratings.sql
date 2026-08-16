-- Parsed CS2 demo data and the Xom Nghien dedicated-server rating ledger.
DROP PROCEDURE IF EXISTS migrate_matchzy_demo_analysis;
DELIMITER //
CREATE PROCEDURE migrate_matchzy_demo_analysis()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parse_status') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parse_status VARCHAR(16) NOT NULL DEFAULT 'queued';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parser_version') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parser_version VARCHAR(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parse_attempts') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parse_attempts INT UNSIGNED NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parse_started_at') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parse_started_at DATETIME(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parsed_at') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parsed_at DATETIME(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND column_name = 'parse_error') THEN
    ALTER TABLE matchzy_demos ADD COLUMN parse_error TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'matchzy_demos' AND index_name = 'idx_matchzy_demos_parse_queue') THEN
    ALTER TABLE matchzy_demos ADD INDEX idx_matchzy_demos_parse_queue (parse_status, uploaded_at);
  END IF;
END//
DELIMITER ;
CALL migrate_matchzy_demo_analysis();
DROP PROCEDURE migrate_matchzy_demo_analysis;

CREATE TABLE IF NOT EXISTS match_demo_rounds (
  demo_id INT NOT NULL,
  round_number INT NOT NULL,
  start_tick INT,
  end_tick INT,
  winner_side VARCHAR(8),
  winner_team VARCHAR(255),
  end_reason VARCHAR(64),
  team1_score INT NOT NULL DEFAULT 0,
  team2_score INT NOT NULL DEFAULT 0,
  PRIMARY KEY (demo_id, round_number),
  CONSTRAINT fk_match_demo_rounds_demo
    FOREIGN KEY (demo_id) REFERENCES matchzy_demos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS match_demo_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  demo_id INT NOT NULL,
  round_number INT NOT NULL DEFAULT 0,
  tick INT NOT NULL DEFAULT 0,
  event_type VARCHAR(40) NOT NULL,
  actor_steamid64 VARCHAR(64),
  target_steamid64 VARCHAR(64),
  weapon VARCHAR(64),
  value INT,
  payload TEXT,
  INDEX idx_match_demo_events_timeline (demo_id, round_number, tick),
  INDEX idx_match_demo_events_type (demo_id, event_type),
  CONSTRAINT fk_match_demo_events_demo
    FOREIGN KEY (demo_id) REFERENCES matchzy_demos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xn_ratings (
  steamid64 VARCHAR(64) PRIMARY KEY,
  rating INT NOT NULL DEFAULT 1000,
  matches_played INT UNSIGNED NOT NULL DEFAULT 0,
  wins INT UNSIGNED NOT NULL DEFAULT 0,
  losses INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_xn_ratings_rank (rating, matches_played)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xn_match_ratings (
  matchid INT PRIMARY KEY,
  status VARCHAR(16) NOT NULL,
  reason VARCHAR(255),
  rated_at DATETIME(3),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_xn_match_ratings_status (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xn_rating_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  matchid INT NOT NULL,
  steamid64 VARCHAR(64) NOT NULL,
  team VARCHAR(255) NOT NULL,
  rating_before INT NOT NULL,
  rating_delta INT NOT NULL,
  rating_after INT NOT NULL,
  expected_score FLOAT NOT NULL,
  result_score FLOAT NOT NULL,
  opponent_team_rating INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_xn_rating_match_player (matchid, steamid64),
  INDEX idx_xn_rating_player_history (steamid64, matchid),
  INDEX idx_xn_rating_match (matchid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
