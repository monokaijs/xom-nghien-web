-- Migration: Update Steam API keys table to use env variable for API key
-- Description: Remove api_key column as it will be stored in environment variables

ALTER TABLE steam_api_keys
  DROP INDEX unique_api_key,
  DROP COLUMN api_key;

