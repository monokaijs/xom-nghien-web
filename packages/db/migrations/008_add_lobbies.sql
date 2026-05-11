-- Migration: Add lobbies table
-- Description: Create table for game lobbies that link to temp game servers

CREATE TABLE IF NOT EXISTS lobbies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  game_mode VARCHAR(50) NOT NULL,
  max_players INT NOT NULL DEFAULT 10,
  map VARCHAR(100) NOT NULL,
  server_password VARCHAR(255),
  temp_game_server_id INT,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_lobby_temp_game_server_id (temp_game_server_id),
  INDEX idx_lobby_created_by (created_by),
  INDEX idx_lobby_expires_at (expires_at),
  FOREIGN KEY (temp_game_server_id) REFERENCES temp_game_servers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

