-- Migration: Remove foreign key constraint from user_interactions.user_id
-- Date: 2025-10-25
-- Reason: Allow event tracking for users before full registration

-- PostgreSQL: Drop the foreign key constraint
ALTER TABLE user_interactions 
DROP CONSTRAINT IF EXISTS user_interactions_user_id_fkey;

-- Add comment to document the change
COMMENT ON COLUMN user_interactions.user_id IS 'User identifier (no FK constraint for flexibility)';

