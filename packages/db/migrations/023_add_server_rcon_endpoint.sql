ALTER TABLE servers
  ADD COLUMN rcon_host VARCHAR(255) NULL AFTER sort_order,
  ADD COLUMN rcon_port INT UNSIGNED NULL AFTER rcon_host;
