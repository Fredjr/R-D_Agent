-- Migration: Add seed paper fields to article_collections table
-- Date: 2025-11-16
-- Description: Add is_seed and seed_marked_at fields to support ResearchRabbit-style seed paper system

-- Add is_seed column (default FALSE)
ALTER TABLE article_collections 
ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;

-- Add seed_marked_at column (nullable timestamp)
ALTER TABLE article_collections 
ADD COLUMN IF NOT EXISTS seed_marked_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster seed paper queries
CREATE INDEX IF NOT EXISTS idx_article_collections_is_seed 
ON article_collections(is_seed) 
WHERE is_seed = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN article_collections.is_seed IS 'Mark as seed paper for ResearchRabbit-style recommendations';
COMMENT ON COLUMN article_collections.seed_marked_at IS 'Timestamp when paper was marked as seed';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'article_collections' 
AND column_name IN ('is_seed', 'seed_marked_at');

