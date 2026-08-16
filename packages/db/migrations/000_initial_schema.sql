-- Baseline tables that predate this repository's numbered migrations.
-- CREATE IF NOT EXISTS keeps this safe for existing databases.

CREATE TABLE IF NOT EXISTS matchzy_stats_matches (
  matchid INT AUTO_INCREMENT PRIMARY KEY,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  winner VARCHAR(255) NOT NULL DEFAULT '',
  series_type VARCHAR(255) NOT NULL DEFAULT '',
  team1_name VARCHAR(255) NOT NULL DEFAULT '',
  team1_score INT NOT NULL DEFAULT 0,
  team2_name VARCHAR(255) NOT NULL DEFAULT '',
  team2_score INT NOT NULL DEFAULT 0,
  server_ip VARCHAR(255) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matchzy_stats_maps (
  matchid INT NOT NULL,
  mapnumber TINYINT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  winner VARCHAR(16) NOT NULL DEFAULT '',
  mapname VARCHAR(64) NOT NULL DEFAULT '',
  team1_score INT NOT NULL DEFAULT 0,
  team2_score INT NOT NULL DEFAULT 0,
  PRIMARY KEY (matchid, mapnumber),
  INDEX mapnumber_index (mapnumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matchzy_stats_players (
  matchid INT NOT NULL,
  mapnumber TINYINT NOT NULL,
  steamid64 VARCHAR(64) NOT NULL,
  team VARCHAR(255) NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL,
  kills INT NOT NULL,
  deaths INT NOT NULL,
  damage INT NOT NULL,
  assists INT NOT NULL,
  enemy5ks INT NOT NULL,
  enemy4ks INT NOT NULL,
  enemy3ks INT NOT NULL,
  enemy2ks INT NOT NULL,
  utility_count INT NOT NULL,
  utility_damage INT NOT NULL,
  utility_successes INT NOT NULL,
  utility_enemies INT NOT NULL,
  flash_count INT NOT NULL,
  flash_successes INT NOT NULL,
  health_points_removed_total INT NOT NULL,
  health_points_dealt_total INT NOT NULL,
  shots_fired_total INT NOT NULL,
  shots_on_target_total INT NOT NULL,
  v1_count INT NOT NULL,
  v1_wins INT NOT NULL,
  v2_count INT NOT NULL,
  v2_wins INT NOT NULL,
  entry_count INT NOT NULL,
  entry_wins INT NOT NULL,
  equipment_value INT NOT NULL,
  money_saved INT NOT NULL,
  kill_reward INT NOT NULL,
  live_time INT NOT NULL,
  head_shot_kills INT NOT NULL,
  cash_earned INT NOT NULL,
  enemies_flashed INT NOT NULL,
  PRIMARY KEY (matchid, mapnumber, steamid64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_info (
  steamid64 VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(512),
  avatarmedium VARCHAR(512),
  avatarfull VARCHAR(512),
  profileurl VARCHAR(512),
  facebook VARCHAR(512),
  spotify VARCHAR(512),
  twitter VARCHAR(512),
  instagram VARCHAR(512),
  github VARCHAR(512),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
