CREATE TABLE IF NOT EXISTS voice_rooms (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  visibility VARCHAR(10) NOT NULL DEFAULT 'public',
  access_code_hash VARCHAR(64) NULL,
  owner_subject VARCHAR(160) NOT NULL,
  owner_name VARCHAR(32) NOT NULL,
  persistent TINYINT NOT NULL DEFAULT 0,
  max_participants TINYINT UNSIGNED NOT NULL DEFAULT 8,
  expires_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_voice_rooms_access_code (access_code_hash),
  KEY idx_voice_rooms_directory (visibility, persistent, created_at),
  KEY idx_voice_rooms_expiry (persistent, expires_at),
  KEY idx_voice_rooms_owner (owner_subject)
);

CREATE TABLE IF NOT EXISTS voice_room_presence (
  participant_id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  subject VARCHAR(160) NOT NULL,
  display_name VARCHAR(32) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  peer_id VARCHAR(128) NOT NULL,
  muted TINYINT NOT NULL DEFAULT 0,
  deafened TINYINT NOT NULL DEFAULT 0,
  force_muted TINYINT NOT NULL DEFAULT 0,
  is_admin TINYINT NOT NULL DEFAULT 0,
  joined_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_voice_presence_room FOREIGN KEY (room_id) REFERENCES voice_rooms(id) ON DELETE CASCADE,
  UNIQUE KEY uq_voice_presence_subject (room_id, subject),
  UNIQUE KEY uq_voice_presence_peer (peer_id),
  KEY idx_voice_presence_lease (room_id, last_seen_at)
);
