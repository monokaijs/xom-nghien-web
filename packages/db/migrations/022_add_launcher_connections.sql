-- Structured connection information used by the desktop launcher. The legacy
-- address remains available for browser deep links and unsupported games.
-- Use information_schema checks instead of ADD COLUMN IF NOT EXISTS because
-- the production MySQL version does not support that ALTER TABLE syntax.
SET @add_connection_host = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'servers'
      AND column_name = 'connection_host'
  ),
  'SELECT 1',
  'ALTER TABLE servers ADD COLUMN connection_host VARCHAR(255) NULL AFTER address'
);
PREPARE add_connection_host_statement FROM @add_connection_host;
EXECUTE add_connection_host_statement;
DEALLOCATE PREPARE add_connection_host_statement;

SET @add_connection_port = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'servers'
      AND column_name = 'connection_port'
  ),
  'SELECT 1',
  'ALTER TABLE servers ADD COLUMN connection_port INT UNSIGNED NULL AFTER connection_host'
);
PREPARE add_connection_port_statement FROM @add_connection_port;
EXECUTE add_connection_port_statement;
DEALLOCATE PREPARE add_connection_port_statement;

SET @add_join_password = IF(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'servers'
      AND column_name = 'join_password'
  ),
  'SELECT 1',
  'ALTER TABLE servers ADD COLUMN join_password VARCHAR(255) NULL AFTER connection_port'
);
PREPARE add_join_password_statement FROM @add_join_password;
EXECUTE add_join_password_statement;
DEALLOCATE PREPARE add_join_password_statement;
