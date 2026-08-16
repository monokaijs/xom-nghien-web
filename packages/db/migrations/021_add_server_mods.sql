-- Store exact mod packages configured for each game server. The package identity
-- and selected version form the install contract used by the future game client.
CREATE TABLE IF NOT EXISTS server_mods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  server_id INT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  community VARCHAR(64) NOT NULL,
  namespace VARCHAR(128) NOT NULL,
  package_name VARCHAR(128) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  version_number VARCHAR(64) NOT NULL,
  description TEXT NULL,
  icon_url VARCHAR(2048) NULL,
  package_url VARCHAR(2048) NOT NULL,
  requirement VARCHAR(16) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_server_mods_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_server_mods_package (server_id, provider, namespace, package_name),
  KEY idx_server_mods_requirement (server_id, requirement, sort_order)
);
