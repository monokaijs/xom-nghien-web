-- RCON is optional and only exposed to admins. Keep this migration safe to run
-- on every deployment, matching the existing launcher-column migration.
SET @add_rcon_host = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'servers'
      AND column_name = 'rcon_host'
  ),
  'SELECT 1',
  'ALTER TABLE servers ADD COLUMN rcon_host VARCHAR(255) NULL AFTER sort_order'
);
PREPARE add_rcon_host_statement FROM @add_rcon_host;
EXECUTE add_rcon_host_statement;
DEALLOCATE PREPARE add_rcon_host_statement;

SET @add_rcon_port = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'servers'
      AND column_name = 'rcon_port'
  ),
  'SELECT 1',
  'ALTER TABLE servers ADD COLUMN rcon_port INT UNSIGNED NULL AFTER rcon_host'
);
PREPARE add_rcon_port_statement FROM @add_rcon_port;
EXECUTE add_rcon_port_statement;
DEALLOCATE PREPARE add_rcon_port_statement;
