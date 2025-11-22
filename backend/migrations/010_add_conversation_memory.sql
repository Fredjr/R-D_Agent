-- Migration: Add conversation_memory table for Week 2 Memory System
-- Date: 2025-11-22
-- Description: Stores conversation memories for AI context retention across the research journey

CREATE TABLE IF NOT EXISTS conversation_memory (
    memory_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Interaction details
    interaction_type VARCHAR NOT NULL,  -- insights, summary, triage, protocol, experiment, question, hypothesis
    interaction_subtype VARCHAR,  -- More specific categorization
    
    -- Memory content (stored as JSON for flexibility)
    content JSONB NOT NULL,  -- The actual interaction data
    summary TEXT,  -- Human-readable summary of the interaction
    
    -- Context linkage (arrays of IDs)
    linked_question_ids JSONB DEFAULT '[]'::jsonb,  -- Questions involved in this interaction
    linked_hypothesis_ids JSONB DEFAULT '[]'::jsonb,  -- Hypotheses involved
    linked_paper_ids JSONB DEFAULT '[]'::jsonb,  -- Papers involved (PMIDs)
    linked_protocol_ids JSONB DEFAULT '[]'::jsonb,  -- Protocols involved
    linked_experiment_ids JSONB DEFAULT '[]'::jsonb,  -- Experiments involved
    
    -- Relevance scoring (for retrieval)
    relevance_score FLOAT DEFAULT 1.0,  -- Base relevance (can be updated)
    access_count INTEGER DEFAULT 0,  -- How many times this memory was retrieved
    last_accessed_at TIMESTAMP WITH TIME ZONE,  -- Last retrieval time
    
    -- Memory lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration
    is_archived BOOLEAN DEFAULT FALSE,  -- Archived memories (kept but not actively retrieved)
    
    -- Metadata
    created_by VARCHAR NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_project ON conversation_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON conversation_memory(interaction_type);
CREATE INDEX IF NOT EXISTS idx_memory_created ON conversation_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_relevance ON conversation_memory(relevance_score);
CREATE INDEX IF NOT EXISTS idx_memory_archived ON conversation_memory(is_archived);
CREATE INDEX IF NOT EXISTS idx_memory_expires ON conversation_memory(expires_at);
CREATE INDEX IF NOT EXISTS idx_memory_project_type ON conversation_memory(project_id, interaction_type);

-- Comments for documentation
COMMENT ON TABLE conversation_memory IS 'Week 2 Memory System: Stores conversation memories for AI context retention';
COMMENT ON COLUMN conversation_memory.content IS 'JSON content of the interaction (flexible schema)';
COMMENT ON COLUMN conversation_memory.relevance_score IS 'Relevance score for retrieval ranking (higher = more relevant)';
COMMENT ON COLUMN conversation_memory.access_count IS 'Number of times this memory was retrieved (popularity metric)';
COMMENT ON COLUMN conversation_memory.is_archived IS 'Archived memories are kept but not actively retrieved';
COMMENT ON COLUMN conversation_memory.expires_at IS 'Optional expiration date (NULL = never expires)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_memory TO your_app_user;

