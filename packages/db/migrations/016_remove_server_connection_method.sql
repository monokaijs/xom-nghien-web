-- Migration: Remove server connection method
-- Description: Connection link and guidance are independent server fields.

ALTER TABLE servers
  DROP COLUMN connection_method;
