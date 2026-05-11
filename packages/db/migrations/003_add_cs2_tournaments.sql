-- Migration: Add CS2 tournaments tables
-- Description: Create tables for CS2 tournament management with MatchZy integration

CREATE TABLE IF NOT EXISTS cs2_tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team1_name VARCHAR(255) NOT NULL,
  team2_name VARCHAR(255) NOT NULL,
  num_maps TINYINT NOT NULL,
  maplist JSON NOT NULL,
  clinch_series TINYINT NOT NULL DEFAULT 1,
  players_per_team TINYINT NOT NULL DEFAULT 5,
  cvars JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cs2_tournament_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  team_number TINYINT NOT NULL,
  steamid64 VARCHAR(64) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  INDEX idx_tournament_id (tournament_id),
  UNIQUE KEY unique_player_per_tournament (tournament_id, steamid64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

