-- Migration: Fix hypothesis_evidence.added_by to allow NULL for AI-generated links
-- Date: 2025-11-24
-- Issue: Auto evidence linking fails because 'ai_triage' user doesn't exist
-- Solution: Make added_by nullable so AI can create evidence links without a user

-- Step 1: Make added_by nullable
ALTER TABLE hypothesis_evidence 
ALTER COLUMN added_by DROP NOT NULL;

-- Step 2: Update existing records with 'ai_triage' to NULL (if any exist)
UPDATE hypothesis_evidence 
SET added_by = NULL 
WHERE added_by = 'ai_triage';

-- Step 3: Add a check constraint to ensure added_by is either NULL or a valid user
-- (This will be enforced by the foreign key constraint when added_by is not NULL)

-- Verification queries
SELECT 
    COUNT(*) as total_evidence_links,
    COUNT(added_by) as links_with_user,
    COUNT(*) - COUNT(added_by) as links_without_user
FROM hypothesis_evidence;

SELECT * FROM hypothesis_evidence WHERE added_by IS NULL LIMIT 5;

