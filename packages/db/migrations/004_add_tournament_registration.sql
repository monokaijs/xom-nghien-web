-- Migration: Add tournament registration deadline
-- Description: Add registration_deadline field to cs2_tournaments table

ALTER TABLE cs2_tournaments 
ADD COLUMN registration_deadline TIMESTAMP NULL AFTER cvars;

