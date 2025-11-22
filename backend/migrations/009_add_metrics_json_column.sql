-- Migration 009: Add metrics JSON column to project_insights table
-- This allows storing all metrics (questions, hypotheses, plans, etc.) not just papers

-- Add metrics JSON column
ALTER TABLE project_insights 
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_project_insights_metrics ON project_insights USING gin(metrics);

-- Comment
COMMENT ON COLUMN project_insights.metrics IS 'All project metrics stored as JSON (questions, hypotheses, papers, protocols, plans, results)';

