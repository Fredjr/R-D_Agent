-- Migration: Add ExperimentResults table for tracking experiment outcomes
-- This enables complete research loop tracking: Question → Hypothesis → Paper → Protocol → Experiment → Result

CREATE TABLE IF NOT EXISTS experiment_results (
    result_id VARCHAR PRIMARY KEY,
    plan_id VARCHAR NOT NULL REFERENCES experiment_plans(plan_id) ON DELETE CASCADE,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) DEFAULT 'planned',  -- planned, in_progress, completed, failed

    -- Results
    outcome TEXT,  -- What happened
    observations JSONB DEFAULT '[]'::json,  -- Array of observations
    measurements JSONB DEFAULT '[]'::json,  -- Array of {metric, value, unit}
    success_criteria_met JSONB DEFAULT '{}'::json,  -- {criterion: true/false}

    -- Analysis
    interpretation TEXT,  -- What it means
    supports_hypothesis BOOLEAN,  -- Does it support the hypothesis?
    confidence_change FLOAT,  -- How much did hypothesis confidence change?

    -- Learnings
    what_worked TEXT,
    what_didnt_work TEXT,
    next_steps TEXT,

    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(plan_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiment_results_plan ON experiment_results(plan_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_project ON experiment_results(project_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_status ON experiment_results(status);

-- Comments for documentation
COMMENT ON TABLE experiment_results IS 'Stores outcomes and learnings from experiments, completing the research loop';
COMMENT ON COLUMN experiment_results.outcome IS 'High-level summary of what happened in the experiment';
COMMENT ON COLUMN experiment_results.observations IS 'Array of specific observations made during the experiment';
COMMENT ON COLUMN experiment_results.measurements IS 'Quantitative measurements: [{metric: "cell_viability", value: 85.3, unit: "%"}]';
COMMENT ON COLUMN experiment_results.success_criteria_met IS 'JSON object mapping success criteria to boolean results';
COMMENT ON COLUMN experiment_results.interpretation IS 'What the results mean in the context of the hypothesis';
COMMENT ON COLUMN experiment_results.supports_hypothesis IS 'Whether results support or refute the hypothesis';
COMMENT ON COLUMN experiment_results.confidence_change IS 'How much hypothesis confidence should change based on results (e.g., +15 or -20)';

