-- Migration 006: Add PDF Text Extraction Fields
-- Week 19-20: Critical Fix for Protocol Extraction
-- 
-- This migration adds fields to store full PDF text for:
-- 1. Protocol extraction from full paper (not just abstract)
-- 2. AI triage with complete paper content
-- 3. Better relevance scoring and analysis
--
-- Author: R-D Agent Team
-- Date: 2025-01-21

-- Add PDF text storage columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_text TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_extracted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_extraction_method VARCHAR(50);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_source VARCHAR(50);

-- Add full-text search index for PDF text
-- This enables fast searching through PDF content
CREATE INDEX IF NOT EXISTS idx_article_pdf_text 
ON articles USING gin(to_tsvector('english', COALESCE(pdf_text, '')));

-- Add regular index for PDF extraction tracking
CREATE INDEX IF NOT EXISTS idx_article_pdf_extracted 
ON articles(pdf_extracted_at) 
WHERE pdf_extracted_at IS NOT NULL;

-- Add index for PDF source tracking
CREATE INDEX IF NOT EXISTS idx_article_pdf_source 
ON articles(pdf_source) 
WHERE pdf_source IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN articles.pdf_text IS 'Full text extracted from PDF for protocol extraction and AI analysis';
COMMENT ON COLUMN articles.pdf_extracted_at IS 'Timestamp when PDF text was extracted';
COMMENT ON COLUMN articles.pdf_extraction_method IS 'Extraction method used: pypdf2, pdfplumber, ocr, etc.';
COMMENT ON COLUMN articles.pdf_url IS 'URL where PDF was fetched from';
COMMENT ON COLUMN articles.pdf_source IS 'PDF source: pmc, europepmc, unpaywall, doi, etc.';

-- Migration complete
-- Next steps:
-- 1. Update database.py Article model
-- 2. Create PDFTextExtractor service
-- 3. Update protocol extraction to use PDF text
-- 4. Update AI triage to use PDF text

