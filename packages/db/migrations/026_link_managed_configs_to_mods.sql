-- Attach managed config files to a stable Thunderstore package identity.
-- Empty ownership values preserve configs created before per-mod management;
-- the admin UI requires those files to be assigned before the next save.
-- Every operation is guarded because deployment replays migrations 017+.

SET @add_managed_config_provider = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND column_name = 'mod_provider'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD COLUMN mod_provider VARCHAR(32) NOT NULL DEFAULT '''' AFTER server_id'
);
PREPARE add_managed_config_provider_statement FROM @add_managed_config_provider;
EXECUTE add_managed_config_provider_statement;
DEALLOCATE PREPARE add_managed_config_provider_statement;

SET @add_managed_config_namespace = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND column_name = 'mod_namespace'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD COLUMN mod_namespace VARCHAR(128) NOT NULL DEFAULT '''' AFTER mod_provider'
);
PREPARE add_managed_config_namespace_statement FROM @add_managed_config_namespace;
EXECUTE add_managed_config_namespace_statement;
DEALLOCATE PREPARE add_managed_config_namespace_statement;

SET @add_managed_config_package = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND column_name = 'mod_package_name'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD COLUMN mod_package_name VARCHAR(128) NOT NULL DEFAULT '''' AFTER mod_namespace'
);
PREPARE add_managed_config_package_statement FROM @add_managed_config_package;
EXECUTE add_managed_config_package_statement;
DEALLOCATE PREPARE add_managed_config_package_statement;

SET @add_managed_config_source_version = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND column_name = 'source_version'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD COLUMN source_version VARCHAR(64) NULL AFTER mod_package_name'
);
PREPARE add_managed_config_source_version_statement FROM @add_managed_config_source_version;
EXECUTE add_managed_config_source_version_statement;
DEALLOCATE PREPARE add_managed_config_source_version_statement;

SET @add_managed_config_target = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND column_name = 'target'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD COLUMN target VARCHAR(16) NOT NULL DEFAULT ''server'' AFTER sha256'
);
PREPARE add_managed_config_target_statement FROM @add_managed_config_target;
EXECUTE add_managed_config_target_statement;
DEALLOCATE PREPARE add_managed_config_target_statement;

SET @add_managed_config_mod_index = IF(
  EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'server_managed_configs'
      AND index_name = 'idx_server_managed_configs_mod'
  ),
  'SELECT 1',
  'ALTER TABLE server_managed_configs ADD INDEX idx_server_managed_configs_mod (server_id, mod_provider, mod_namespace, mod_package_name)'
);
PREPARE add_managed_config_mod_index_statement FROM @add_managed_config_mod_index;
EXECUTE add_managed_config_mod_index_statement;
DEALLOCATE PREPARE add_managed_config_mod_index_statement;
