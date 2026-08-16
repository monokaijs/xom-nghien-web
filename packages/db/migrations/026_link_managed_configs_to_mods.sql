-- Attach managed config files to a stable Thunderstore package identity.
-- Empty ownership values preserve configs created before per-mod management;
-- the admin UI requires those files to be assigned before the next save.
ALTER TABLE server_managed_configs
  ADD COLUMN mod_provider VARCHAR(32) NOT NULL DEFAULT '' AFTER server_id,
  ADD COLUMN mod_namespace VARCHAR(128) NOT NULL DEFAULT '' AFTER mod_provider,
  ADD COLUMN mod_package_name VARCHAR(128) NOT NULL DEFAULT '' AFTER mod_namespace,
  ADD COLUMN source_version VARCHAR(64) NULL AFTER mod_package_name,
  ADD COLUMN target VARCHAR(16) NOT NULL DEFAULT 'server' AFTER sha256,
  ADD KEY idx_server_managed_configs_mod (server_id, mod_provider, mod_namespace, mod_package_name);
