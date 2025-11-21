-- Migration 005: Add Experiment Plans Table
-- Week 19-20: Experiment Planning Feature
-- Date: November 21, 2025

-- Create experiment_plans table
CREATE TABLE IF NOT EXISTS experiment_plans (
    plan_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    protocol_id VARCHAR(255) REFERENCES protocols(protocol_id) ON DELETE SET NULL,
    
    -- Plan identification
    plan_name VARCHAR(500) NOT NULL,
    objective TEXT NOT NULL,
    
    -- Context linkage
    linked_questions JSONB DEFAULT '[]'::jsonb,  -- Array of question IDs
    linked_hypotheses JSONB DEFAULT '[]'::jsonb,  -- Array of hypothesis IDs
    
    -- Plan content
    materials JSONB DEFAULT '[]'::jsonb,  -- Array of {name, amount, source, notes}
    procedure JSONB DEFAULT '[]'::jsonb,  -- Array of {step_number, description, duration, critical_notes}
    expected_outcomes JSONB DEFAULT '[]'::jsonb,  -- Array of outcome descriptions
    success_criteria JSONB DEFAULT '[]'::jsonb,  -- Array of {criterion, measurement_method, target_value}
    
    -- Planning details
    timeline_estimate VARCHAR(200),  -- e.g., "5-7 days", "2 weeks"
    estimated_cost VARCHAR(200),  -- e.g., "$500-1000"
    difficulty_level VARCHAR(50) DEFAULT 'moderate',  -- easy, moderate, difficult, expert
    
    -- Risk management
    risk_assessment JSONB DEFAULT '{}'::jsonb,  -- {risks: [], mitigation_strategies: []}
    troubleshooting_guide JSONB DEFAULT '[]'::jsonb,  -- Array of {issue, solution, prevention}
    
    -- Additional notes
    notes TEXT,
    safety_considerations JSONB DEFAULT '[]'::jsonb,  -- Array of safety notes
    required_expertise JSONB DEFAULT '[]'::jsonb,  -- Array of required skills/knowledge
    
    -- AI generation metadata
    generated_by VARCHAR(50) DEFAULT 'ai',  -- 'ai' or 'manual'
    generation_confidence FLOAT,  -- 0.0-1.0 confidence in AI generation
    generation_model VARCHAR(100),  -- Model used for generation
    
    -- Execution tracking
    status VARCHAR(50) DEFAULT 'draft',  -- draft, approved, in_progress, completed, cancelled
    execution_notes TEXT,  -- Notes during execution
    actual_duration VARCHAR(200),  -- Actual time taken
    actual_cost VARCHAR(200),  -- Actual cost incurred
    
    -- Results (after execution)
    results_summary TEXT,
    outcome VARCHAR(50),  -- success, partial_success, failure, inconclusive
    lessons_learned TEXT,
    
    -- Metadata
    created_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(255) REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiment_plans_project ON experiment_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_experiment_plans_protocol ON experiment_plans(protocol_id);
CREATE INDEX IF NOT EXISTS idx_experiment_plans_status ON experiment_plans(status);
CREATE INDEX IF NOT EXISTS idx_experiment_plans_created_by ON experiment_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_experiment_plans_created_at ON experiment_plans(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_experiment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_experiment_plans_updated_at
    BEFORE UPDATE ON experiment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_plans_updated_at();

-- Add comment to table
COMMENT ON TABLE experiment_plans IS 'AI-generated experiment plans based on protocols and research context (Week 19-20)';

