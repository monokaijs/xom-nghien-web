-- Server-managed Valheim package manifests and editable configuration drafts.

CREATE TABLE IF NOT EXISTS valheim_manifests (
  server_id INT PRIMARY KEY,
  manifest_id VARCHAR(64) NOT NULL,
  access_token VARCHAR(64) NOT NULL,
  packages JSON NOT NULL,
  published_manifest MEDIUMTEXT,
  server_revision VARCHAR(64),
  client_revision VARCHAR(64),
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_valheim_manifest_id (manifest_id),
  CONSTRAINT fk_valheim_manifest_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS valheim_mod_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  server_id INT NOT NULL,
  path VARCHAR(512) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  target VARCHAR(10) NOT NULL DEFAULT 'server',
  enabled TINYINT NOT NULL DEFAULT 1,
  updated_by VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_valheim_config_server (server_id),
  UNIQUE KEY unique_valheim_config_target (server_id, path, target),
  CONSTRAINT fk_valheim_config_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
