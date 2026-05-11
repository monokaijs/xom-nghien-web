-- Migration: Rework game server management
-- Description: Add SSH hosts, saved game configurations, deployment jobs, deployed instances, and events.

CREATE TABLE IF NOT EXISTS server_hosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  public_address VARCHAR(255) NOT NULL,
  ssh_host VARCHAR(255) NOT NULL,
  ssh_port INT NOT NULL DEFAULT 22,
  ssh_username VARCHAR(255) NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  base_deploy_path VARCHAR(512) NOT NULL DEFAULT '~/game-servers',
  port_range_start INT NOT NULL,
  port_range_end INT NOT NULL,
  max_instances INT NOT NULL DEFAULT 5,
  enabled TINYINT NOT NULL DEFAULT 1,
  health_status VARCHAR(30) NOT NULL DEFAULT 'unknown',
  last_checked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_server_host_ssh (ssh_host, ssh_port),
  INDEX idx_server_host_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_key VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_version_id INT,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_by VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_configuration_game_key (game_key),
  INDEX idx_game_configuration_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_configuration_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  configuration_id INT NOT NULL,
  version_number INT NOT NULL,
  config JSON NOT NULL,
  created_by VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_configuration_version_config_id (configuration_id),
  UNIQUE KEY unique_game_configuration_version (configuration_id, version_number),
  FOREIGN KEY (configuration_id) REFERENCES game_configurations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_key VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  assigned_instance_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_credential_game_type (game_key, type),
  INDEX idx_game_credential_assigned_instance (assigned_instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_server_deployments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  total_count INT NOT NULL DEFAULT 0,
  queued_count INT NOT NULL DEFAULT 0,
  succeeded_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_by VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_server_deployment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_server_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deployment_id INT,
  host_id INT NOT NULL,
  configuration_id INT NOT NULL,
  configuration_version_id INT NOT NULL,
  game_key VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  desired_state VARCHAR(30) NOT NULL DEFAULT 'online',
  visibility VARCHAR(30) NOT NULL DEFAULT 'public',
  owner_id VARCHAR(64),
  docker_project_name VARCHAR(255) NOT NULL,
  container_name VARCHAR(255) NOT NULL,
  connect_address VARCHAR(255),
  query_port INT,
  ports JSON NOT NULL,
  config_snapshot JSON NOT NULL,
  encrypted_rcon_password TEXT NOT NULL,
  encrypted_server_password TEXT,
  credential_id INT,
  last_error TEXT,
  provisioned_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_server_instance_deployment_id (deployment_id),
  INDEX idx_game_server_instance_host_id (host_id),
  INDEX idx_game_server_instance_status (status),
  INDEX idx_game_server_instance_visibility (visibility),
  UNIQUE KEY unique_game_server_instance_project (docker_project_name),
  FOREIGN KEY (deployment_id) REFERENCES game_server_deployments(id) ON DELETE SET NULL,
  FOREIGN KEY (host_id) REFERENCES server_hosts(id) ON DELETE RESTRICT,
  FOREIGN KEY (configuration_id) REFERENCES game_configurations(id) ON DELETE RESTRICT,
  FOREIGN KEY (configuration_version_id) REFERENCES game_configuration_versions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS server_host_port_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  instance_id INT NOT NULL,
  port INT NOT NULL,
  protocol VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_server_host_port_host_id (host_id),
  INDEX idx_server_host_port_instance_id (instance_id),
  UNIQUE KEY unique_server_host_port_protocol (host_id, port, protocol),
  FOREIGN KEY (host_id) REFERENCES server_hosts(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES game_server_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_server_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instance_id INT NOT NULL,
  deployment_id INT,
  bullmq_job_id VARCHAR(255),
  type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  locked_by VARCHAR(255),
  locked_at TIMESTAMP NULL,
  payload JSON,
  error TEXT,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_server_job_status_scheduled (status, scheduled_at),
  INDEX idx_game_server_job_instance_id (instance_id),
  INDEX idx_game_server_job_bullmq_id (bullmq_job_id),
  FOREIGN KEY (instance_id) REFERENCES game_server_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (deployment_id) REFERENCES game_server_deployments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS server_host_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  bullmq_job_id VARCHAR(255),
  type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  payload JSON,
  error TEXT,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_server_host_job_host_id (host_id),
  INDEX idx_server_host_job_status_scheduled (status, scheduled_at),
  INDEX idx_server_host_job_bullmq_id (bullmq_job_id),
  FOREIGN KEY (host_id) REFERENCES server_hosts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_server_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instance_id INT,
  deployment_id INT,
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_game_server_event_instance_id (instance_id),
  INDEX idx_game_server_event_deployment_id (deployment_id),
  FOREIGN KEY (instance_id) REFERENCES game_server_instances(id) ON DELETE SET NULL,
  FOREIGN KEY (deployment_id) REFERENCES game_server_deployments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
