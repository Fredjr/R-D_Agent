-- Migration: Enhance Protocols with Context-Aware Fields
-- Week 19: Intelligent Protocol Extraction
-- Date: 2025-11-20

-- Add new fields to protocols table for context-aware extraction
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 50;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS affected_questions JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS affected_hypotheses JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS relevance_reasoning TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS key_insights JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS potential_applications JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS recommendations JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS key_parameters JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS expected_outcomes JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS troubleshooting_tips JSON DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS context_relevance TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'basic';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS context_aware BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocols_relevance_score ON protocols(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_protocols_context_aware ON protocols(context_aware);
CREATE INDEX IF NOT EXISTS idx_protocols_extraction_method ON protocols(extraction_method);

-- Add comments
COMMENT ON COLUMN protocols.relevance_score IS 'Relevance score (0-100) to project questions/hypotheses';
COMMENT ON COLUMN protocols.affected_questions IS 'Array of research question IDs this protocol addresses';
COMMENT ON COLUMN protocols.affected_hypotheses IS 'Array of hypothesis IDs this protocol can test';
COMMENT ON COLUMN protocols.relevance_reasoning IS 'AI explanation of why protocol is relevant';
COMMENT ON COLUMN protocols.key_insights IS 'Key insights for the project from this protocol';
COMMENT ON COLUMN protocols.potential_applications IS 'Potential applications in the project';
COMMENT ON COLUMN protocols.recommendations IS 'Actionable recommendations for using protocol';
COMMENT ON COLUMN protocols.key_parameters IS 'Critical parameters to control';
COMMENT ON COLUMN protocols.expected_outcomes IS 'Expected results from protocol';
COMMENT ON COLUMN protocols.troubleshooting_tips IS 'Common issues and solutions';
COMMENT ON COLUMN protocols.context_relevance IS 'How protocol relates to project context';
COMMENT ON COLUMN protocols.extraction_method IS 'Extraction method: basic or intelligent_multi_agent';
COMMENT ON COLUMN protocols.context_aware IS 'Whether extraction used project context';

