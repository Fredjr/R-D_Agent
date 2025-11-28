-- Migration 012: Erythos Phase 0 - Foundation
-- Date: 2025-11-28
-- Purpose: Add database schema changes for Erythos restructuring
-- - Add collection_id to paper_triage (for collection-centric triage)
-- - Add note_count to collections (for UI display)
-- - Add enhanced fields to protocols (relevance_score, protocol_type, protocol_comparison, key_insights)
-- - Add enhanced fields to experiment_plans (progress_percentage, data_points_collected, data_points_total, metrics)
-- - Create lab_files table (for data management)

-- ============================================================================
-- 1. Add collection_id to paper_triage
-- ============================================================================
-- This enables collection-centric AI triage (scanning across all collections)
-- Keep project_id for backward compatibility

ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS collection_id VARCHAR(255) REFERENCES collections(collection_id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_paper_triage_collection ON paper_triage(collection_id);

-- Add composite index for querying triages by collection
CREATE INDEX IF NOT EXISTS idx_paper_triage_collection_article ON paper_triage(collection_id, article_pmid);

-- ============================================================================
-- 2. Add note_count to collections
-- ============================================================================
-- This enables displaying note count in collection cards without expensive queries

ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS note_count INTEGER DEFAULT 0;

-- Backfill note_count with actual counts from annotations table
UPDATE collections c
SET note_count = (
    SELECT COUNT(*)
    FROM annotations a
    WHERE a.collection_id = c.collection_id
)
WHERE note_count = 0;

-- ============================================================================
-- 3. Enhance protocols table
-- ============================================================================
-- Add fields for enhanced protocol cards in Lab page

-- relevance_score already exists (added in Week 19)
-- protocol_type already exists (added in Week 19)
-- key_insights already exists (added in Week 19)

-- Add protocol_comparison field (NEW)
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS protocol_comparison TEXT;

-- ============================================================================
-- 4. Enhance experiment_plans table
-- ============================================================================
-- Add fields for enhanced experiment cards with progress tracking

ALTER TABLE experiment_plans 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

ALTER TABLE experiment_plans 
ADD COLUMN IF NOT EXISTS data_points_collected INTEGER DEFAULT 0;

ALTER TABLE experiment_plans 
ADD COLUMN IF NOT EXISTS data_points_total INTEGER DEFAULT 0;

ALTER TABLE experiment_plans 
ADD COLUMN IF NOT EXISTS metrics JSON DEFAULT '{}';

-- Add index for filtering by progress
CREATE INDEX IF NOT EXISTS idx_experiment_progress ON experiment_plans(progress_percentage);

-- ============================================================================
-- 5. Create lab_files table
-- ============================================================================
-- New table for Lab Data Management feature

CREATE TABLE IF NOT EXISTS lab_files (
    file_id VARCHAR(255) PRIMARY KEY,
    experiment_id VARCHAR(255) REFERENCES experiment_plans(plan_id) ON DELETE CASCADE,
    
    -- File metadata
    file_type VARCHAR(50) NOT NULL,  -- 'raw_data', 'analysis', 'photo'
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    
    -- Upload metadata
    uploaded_by VARCHAR(255) REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_files_experiment ON lab_files(experiment_id);
CREATE INDEX IF NOT EXISTS idx_lab_files_type ON lab_files(file_type);
CREATE INDEX IF NOT EXISTS idx_lab_files_uploaded_by ON lab_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_lab_files_uploaded_at ON lab_files(uploaded_at);

-- ============================================================================
-- 6. Add counts to projects table
-- ============================================================================
-- Add cached counts for Project Workspace stats grid

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS paper_count INTEGER DEFAULT 0;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS collection_count INTEGER DEFAULT 0;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS note_count INTEGER DEFAULT 0;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS experiment_count INTEGER DEFAULT 0;

-- Backfill paper_count
UPDATE projects p
SET paper_count = (
    SELECT COUNT(DISTINCT ac.article_pmid)
    FROM project_collections pc
    JOIN article_collections ac ON pc.collection_id = ac.collection_id
    WHERE pc.project_id = p.project_id
)
WHERE paper_count = 0;

-- Backfill collection_count
UPDATE projects p
SET collection_count = (
    SELECT COUNT(*)
    FROM project_collections pc
    WHERE pc.project_id = p.project_id
)
WHERE collection_count = 0;

-- Backfill note_count
UPDATE projects p
SET note_count = (
    SELECT COUNT(*)
    FROM annotations a
    WHERE a.project_id = p.project_id
)
WHERE note_count = 0;

-- Backfill report_count
UPDATE projects p
SET report_count = (
    SELECT COUNT(*)
    FROM project_summaries ps
    WHERE ps.project_id = p.project_id
)
WHERE report_count = 0;

-- Backfill experiment_count
UPDATE projects p
SET experiment_count = (
    SELECT COUNT(*)
    FROM experiment_plans ep
    WHERE ep.project_id = p.project_id
)
WHERE experiment_count = 0;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Next steps:
-- 1. Update database.py models to reflect new schema
-- 2. Create feature flags in environment variables
-- 3. Implement new API endpoints

