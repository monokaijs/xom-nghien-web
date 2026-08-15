-- Text configuration files synchronized by the Xom Nghien bootstrap before
-- normal BepInEx plugins initialize.
CREATE TABLE IF NOT EXISTS server_managed_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  server_id INT NOT NULL,
  path VARCHAR(512) NOT NULL,
  contents TEXT NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_server_managed_configs_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_server_managed_configs_path (server_id, path),
  KEY idx_server_managed_configs_order (server_id, sort_order)
);
