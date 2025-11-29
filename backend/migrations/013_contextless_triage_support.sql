-- Migration 013: Add contextless triage support to paper_triage table
-- Phase 1 of AI Triage Architecture Redesign

-- Make project_id nullable (for contextless triages)
ALTER TABLE paper_triage ALTER COLUMN project_id DROP NOT NULL;

-- Add new columns for contextless triage support
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS collection_id VARCHAR REFERENCES collections(collection_id) ON DELETE CASCADE;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS context_type VARCHAR DEFAULT 'project';
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS triage_context JSONB;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(user_id);
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS key_findings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS relevance_aspects JSONB DEFAULT '{}'::jsonb;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS how_it_helps TEXT;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS project_scores JSONB;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS collection_scores JSONB;
ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS best_match JSONB;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_paper_triage_collection_id ON paper_triage(collection_id);
CREATE INDEX IF NOT EXISTS idx_paper_triage_context_type ON paper_triage(context_type);
CREATE INDEX IF NOT EXISTS idx_paper_triage_user_id ON paper_triage(user_id);

-- Add composite index for contextless triages
CREATE INDEX IF NOT EXISTS idx_paper_triage_user_context ON paper_triage(user_id, context_type) WHERE project_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN paper_triage.context_type IS 'Type of triage context: project, collection, search_query, ad_hoc, multi_project';
COMMENT ON COLUMN paper_triage.triage_context IS 'JSON containing context-specific data like search_query, ad_hoc_question, best_match';
COMMENT ON COLUMN paper_triage.user_id IS 'Owner of contextless triages (when project_id is null)';

