-- Migration: Add timeline_events column to project_summaries table
-- Date: 2025-11-21
-- Description: Add timeline_events JSON column to store structured timeline data for Research Journey visualization

-- Add timeline_events column to project_summaries table
ALTER TABLE project_summaries 
ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;

-- Add comment to document the column
COMMENT ON COLUMN project_summaries.timeline_events IS 'Array of timeline event objects with id, timestamp, type, title, description, status, rationale, score, confidence, and metadata for Research Journey visualization';

