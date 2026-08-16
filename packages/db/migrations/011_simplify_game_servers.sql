-- Migration: Simplify game server listings
-- Description: Store an optional external metadata endpoint for each manually managed server.

ALTER TABLE servers
  ADD COLUMN metadata_url VARCHAR(2048) NULL AFTER description;
