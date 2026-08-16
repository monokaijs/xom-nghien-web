-- Add role and banned columns to user_info table
ALTER TABLE user_info 
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER github,
ADD COLUMN banned TINYINT NOT NULL DEFAULT 0 AFTER role;

-- Add index on role for faster queries
CREATE INDEX idx_role ON user_info(role);

-- Add index on banned for faster queries
CREATE INDEX idx_banned ON user_info(banned);

