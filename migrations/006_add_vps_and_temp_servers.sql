-- Migration: Add VPS instances and temporary game servers tables
-- Description: Create tables for VPS management and temporary game server rental system

CREATE TABLE IF NOT EXISTS vps_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  port INT NOT NULL DEFAULT 22,
  username VARCHAR(255) NOT NULL,
  private_key TEXT NOT NULL,
  open_port_range_start INT NOT NULL,
  open_port_range_end INT NOT NULL,
  max_game_instances INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_vps_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temp_game_servers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vps_id INT NOT NULL,
  assigned_port INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'offline',
  rcon_password VARCHAR(255) NOT NULL,
  container_id VARCHAR(255),
  created_by VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_temp_server_vps_id (vps_id),
  INDEX idx_temp_server_expires_at (expires_at),
  INDEX idx_temp_server_created_by (created_by),
  UNIQUE KEY unique_vps_port (vps_id, assigned_port),
  FOREIGN KEY (vps_id) REFERENCES vps_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

