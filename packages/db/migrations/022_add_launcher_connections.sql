-- Structured connection information used by the desktop launcher. The legacy
-- address remains available for browser deep links and unsupported games.
ALTER TABLE servers
  ADD COLUMN IF NOT EXISTS connection_host VARCHAR(255) NULL AFTER address,
  ADD COLUMN IF NOT EXISTS connection_port INT UNSIGNED NULL AFTER connection_host,
  ADD COLUMN IF NOT EXISTS join_password VARCHAR(255) NULL AFTER connection_port;
