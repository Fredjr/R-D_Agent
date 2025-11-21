-- Migration 007: Add project_insights table for caching AI insights
-- Week 21-22: AI Insights Feature Enhancement
-- Date: 2025-11-21

-- Create project_insights table
CREATE TABLE IF NOT EXISTS project_insights (
    insight_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Insights content (JSON arrays)
    progress_insights JSON DEFAULT '[]'::json,
    connection_insights JSON DEFAULT '[]'::json,
    gap_insights JSON DEFAULT '[]'::json,
    trend_insights JSON DEFAULT '[]'::json,
    recommendations JSON DEFAULT '[]'::json,
    
    -- Metrics
    total_papers INTEGER DEFAULT 0,
    must_read_papers INTEGER DEFAULT 0,
    avg_paper_score FLOAT DEFAULT 0.0,
    
    -- Cache management
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_insights_project ON project_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_cache ON project_insights(cache_valid_until);

-- Add comment
COMMENT ON TABLE project_insights IS 'Cached AI-generated project insights with 24-hour TTL';

