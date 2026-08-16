ALTER TABLE user_info
ADD COLUMN google_id VARCHAR(255) NULL,
ADD COLUMN discord_id VARCHAR(255) NULL,
ADD COLUMN github_oauth_id VARCHAR(255) NULL,
ADD INDEX idx_google_id (google_id),
ADD INDEX idx_discord_id (discord_id),
ADD INDEX idx_github_oauth_id (github_oauth_id);

