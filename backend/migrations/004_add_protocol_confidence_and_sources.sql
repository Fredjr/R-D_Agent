-- Migration 004: Add confidence scoring and source citations to protocols
-- Date: 2025-11-21
-- Purpose: Add explainable confidence scores and source citations for protocol extraction

-- Add confidence score (0-100)
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER DEFAULT NULL;

-- Add confidence explanation (JSON breakdown)
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS confidence_explanation JSONB DEFAULT NULL;

-- Add material sources (JSON mapping materials to abstract excerpts)
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS material_sources JSONB DEFAULT NULL;

-- Add step sources (JSON mapping steps to abstract excerpts)
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS step_sources JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN protocols.extraction_confidence IS 'Confidence score (0-100) based on specificity and evidence quality';
COMMENT ON COLUMN protocols.confidence_explanation IS 'JSON breakdown explaining the confidence score with specific criteria';
COMMENT ON COLUMN protocols.material_sources IS 'JSON mapping each material to its source excerpt from the abstract';
COMMENT ON COLUMN protocols.step_sources IS 'JSON mapping each step to its source excerpt from the abstract';

-- Create index for querying by confidence
CREATE INDEX IF NOT EXISTS idx_protocols_confidence ON protocols(extraction_confidence);

-- Example confidence_explanation structure:
-- {
--   "overall_score": 85,
--   "criteria": {
--     "has_quantitative_details": true,
--     "has_specific_materials": true,
--     "has_specific_steps": true,
--     "materials_with_amounts": 4,
--     "steps_with_timing": 3,
--     "specificity_score": 90,
--     "evidence_score": 80
--   },
--   "explanation": "High confidence: Protocol contains specific quantitative details (4/5 materials have amounts, 3/4 steps have timing). All information directly extracted from abstract."
-- }

-- Example material_sources structure:
-- {
--   "SpCas9 with sgRNA targeting INSR exon 3": {
--     "source_text": "We used SpCas9 with sgRNA targeting INSR exon 3 to edit the insulin receptor gene",
--     "confidence": "high",
--     "has_quantitative_details": true
--   }
-- }

-- Example step_sources structure:
-- {
--   "HEK293T cells were transfected with 500 ng plasmid DNA": {
--     "source_text": "HEK293T cells were transfected with 500 ng plasmid DNA and incubated for 48h at 37°C",
--     "confidence": "high",
--     "has_quantitative_details": true
--   }
-- }

