-- Migration 006: Add Project Summaries Table
-- Week 21-22: Living Summaries Feature
-- Date: November 21, 2025

-- Create project_summaries table
CREATE TABLE IF NOT EXISTS project_summaries (
    summary_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Summary content
    summary_text TEXT,
    key_findings JSONB DEFAULT '[]'::jsonb,  -- Array of strings
    protocol_insights JSONB DEFAULT '[]'::jsonb,  -- Array of strings
    experiment_status TEXT,
    next_steps JSONB DEFAULT '[]'::jsonb,  -- Array of {action, priority, estimated_effort}
    
    -- Cache management
    last_updated TIMESTAMP DEFAULT NOW(),
    cache_valid_until TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one summary per project
    UNIQUE(project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_summaries_project ON project_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_summaries_cache ON project_summaries(cache_valid_until);

-- Add comments for documentation
COMMENT ON TABLE project_summaries IS 'Auto-generated project summaries with 24-hour cache';
COMMENT ON COLUMN project_summaries.summary_text IS 'Main project overview text';
COMMENT ON COLUMN project_summaries.key_findings IS 'Array of key findings from papers';
COMMENT ON COLUMN project_summaries.protocol_insights IS 'Array of insights from extracted protocols';
COMMENT ON COLUMN project_summaries.experiment_status IS 'Summary of experiment plan status';
COMMENT ON COLUMN project_summaries.next_steps IS 'Array of recommended next steps with priority';
COMMENT ON COLUMN project_summaries.cache_valid_until IS 'Timestamp when cache expires (24 hours from generation)';

