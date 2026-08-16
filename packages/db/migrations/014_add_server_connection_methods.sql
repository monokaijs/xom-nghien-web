-- Migration: Add server connection methods
-- Description: Allow direct links or admin-authored connection guidance for game servers.

ALTER TABLE servers
  MODIFY COLUMN address VARCHAR(255) NULL,
  ADD COLUMN connection_method VARCHAR(32) NOT NULL DEFAULT 'direct' AFTER address,
  ADD COLUMN connection_guide TEXT NULL AFTER connection_method;
