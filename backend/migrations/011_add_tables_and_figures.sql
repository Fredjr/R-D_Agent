-- Migration 011: Add tables and figures support to protocols and articles
-- Week 22: Enhanced PDF extraction with tables and figures
-- Date: 2025-11-22

-- Add tables and figures columns to articles table (for caching)
-- Split into separate statements for better error handling
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_tables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_figures JSONB DEFAULT '[]'::jsonb;

-- Add tables and figures columns to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS tables_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS figures_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS figures_analysis TEXT;

-- Create indexes for JSON columns for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_pdf_tables ON articles USING GIN (pdf_tables);
CREATE INDEX IF NOT EXISTS idx_articles_pdf_figures ON articles USING GIN (pdf_figures);
CREATE INDEX IF NOT EXISTS idx_protocols_tables_data ON protocols USING GIN (tables_data);
CREATE INDEX IF NOT EXISTS idx_protocols_figures_data ON protocols USING GIN (figures_data);

-- Add comment for documentation
COMMENT ON COLUMN articles.pdf_tables IS 'Extracted tables from PDF (Week 22)';
COMMENT ON COLUMN articles.pdf_figures IS 'Extracted figures from PDF (Week 22)';
COMMENT ON COLUMN protocols.tables_data IS 'Tables extracted from source paper (Week 22)';
COMMENT ON COLUMN protocols.figures_data IS 'Figures extracted from source paper (Week 22)';
COMMENT ON COLUMN protocols.figures_analysis IS 'GPT-4 Vision analysis of figures (Week 22)';

