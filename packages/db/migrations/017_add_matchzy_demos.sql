-- Metadata for raw .dem files uploaded by MatchZy at the end of each map.
-- No foreign key is used because MatchZy may upload while its final stats write
-- is still in flight.
CREATE TABLE IF NOT EXISTS matchzy_demos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchid INT NOT NULL,
  mapnumber TINYINT NOT NULL,
  roundnumber INT NOT NULL DEFAULT 0,
  file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_matchzy_demos_match_map (matchid, mapnumber),
  INDEX idx_matchzy_demos_match (matchid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
