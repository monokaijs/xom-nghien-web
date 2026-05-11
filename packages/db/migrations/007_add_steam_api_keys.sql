-- Migration: Add Steam API keys table and update temp_game_servers
-- Description: Create table for managing Steam API keys and link them to temp game servers

CREATE TABLE IF NOT EXISTS steam_api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  steam_account VARCHAR(255),
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE temp_game_servers
  ADD COLUMN steam_api_key_id INT AFTER vps_id,
  ADD INDEX idx_temp_server_steam_api_key_id (steam_api_key_id),
  ADD FOREIGN KEY (steam_api_key_id) REFERENCES steam_api_keys(id) ON DELETE SET NULL;

