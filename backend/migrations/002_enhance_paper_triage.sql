-- Migration: 002_enhance_paper_triage.sql
-- Add enhanced fields to paper_triage table for transparent, evidence-based scoring
-- Date: 2025-11-20

-- Add confidence score field
ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.5;

-- Add metadata score field (citations, recency, journal impact)
ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS metadata_score INTEGER DEFAULT 0;

-- Add evidence excerpts (JSON array of quotes from abstract)
ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS evidence_excerpts JSON DEFAULT '[]'::json;

-- Add question relevance scores (JSON object with per-question scores and reasoning)
ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS question_relevance_scores JSON DEFAULT '{}'::json;

-- Add hypothesis relevance scores (JSON object with per-hypothesis scores and reasoning)
ALTER TABLE paper_triage 
ADD COLUMN IF NOT EXISTS hypothesis_relevance_scores JSON DEFAULT '{}'::json;

-- Add comments
COMMENT ON COLUMN paper_triage.confidence_score IS 'AI confidence in assessment (0.0-1.0)';
COMMENT ON COLUMN paper_triage.metadata_score IS 'Score from citations, recency, journal (0-30)';
COMMENT ON COLUMN paper_triage.evidence_excerpts IS 'Array of evidence quotes from abstract with relevance';
COMMENT ON COLUMN paper_triage.question_relevance_scores IS 'Per-question scores with reasoning and evidence';
COMMENT ON COLUMN paper_triage.hypothesis_relevance_scores IS 'Per-hypothesis scores with support type and evidence';

-- Create index on confidence score for filtering
CREATE INDEX IF NOT EXISTS idx_triage_confidence ON paper_triage(confidence_score);

-- Rollback script (save for reference)
-- ALTER TABLE paper_triage DROP COLUMN IF EXISTS confidence_score;
-- ALTER TABLE paper_triage DROP COLUMN IF EXISTS metadata_score;
-- ALTER TABLE paper_triage DROP COLUMN IF EXISTS evidence_excerpts;
-- ALTER TABLE paper_triage DROP COLUMN IF EXISTS question_relevance_scores;
-- ALTER TABLE paper_triage DROP COLUMN IF EXISTS hypothesis_relevance_scores;
-- DROP INDEX IF EXISTS idx_triage_confidence;

