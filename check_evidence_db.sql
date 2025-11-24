-- Check for existing evidence links
SELECT * FROM hypothesis_evidence 
WHERE hypothesis_id = '28777578-e417-4fae-9b76-b510fc2a3e5f'
AND article_pmid = '38924432';

-- Check hypothesis exists
SELECT hypothesis_id, hypothesis_text, status, confidence_level 
FROM hypotheses 
WHERE hypothesis_id = '28777578-e417-4fae-9b76-b510fc2a3e5f';
