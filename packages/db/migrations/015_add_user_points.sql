-- Store community points separately from cached profile metadata.
-- Users without a row are treated as having zero points by leaderboard reads.
CREATE TABLE IF NOT EXISTS user_points (
  user_id VARCHAR(64) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  INDEX idx_user_points_ranking (points, user_id),
  CONSTRAINT fk_user_points_user
    FOREIGN KEY (user_id) REFERENCES user_info(steamid64)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
