# 🚨 CRITICAL: PDF Full Text Extraction Missing

## 📋 Issue Summary

**CRITICAL BUG**: Protocol extraction and AI triage are using **ONLY abstracts**, not full PDF text!

**Impact**:
- Protocol extraction fails for papers with detailed methods in PDF (not abstract)
- AI triage misses critical information in full paper
- Empty protocols generated from papers that actually have detailed methods
- Poor relevance scoring due to limited context

**Example**: PMID 35650602 - Has detailed methods in PDF but extraction only sees abstract

---

## 🔍 Root Cause Analysis

### **1. Database Schema Missing Full Text Field**

**Current `Article` model** (`database.py` lines 428-474):
```python
class Article(Base):
    pmid = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    abstract = Column(Text, nullable=True)  # ✅ Has abstract
    # ❌ NO pdf_text field!
    # ❌ NO full_text field!
```

### **2. Protocol Extraction Uses Only Abstract**

**File**: `backend/app/services/protocol_extractor_service.py` (line 178)
```python
async def _extract_with_ai(self, article: Article, protocol_type: Optional[str]) -> Dict:
    """
    Use AI to extract protocol from article abstract.  # ← ONLY ABSTRACT!
    
    Optimizations:
    - Use abstract only (methods section if available in future)  # ← TODO never done!
    ```

**File**: `backend/app/services/protocol_extractor_service.py` (line 264)
```python
**Abstract:**
{abstract}  # ← Only using abstract!
```

### **3. AI Triage Uses Only Abstract**

**File**: `backend/app/services/ai_triage_service.py` (line 241)
```python
Abstract: {article.abstract or 'No abstract available'}  # ← Only abstract!
```

**File**: `backend/app/services/enhanced_ai_triage_service.py` (line 476)
```python
Abstract: {abstract_text}  # ← Only abstract!
```

### **4. PDF Infrastructure Exists But Not Used**

We have:
- ✅ PDF URL fetching (`pdf_endpoints.py`)
- ✅ PDF proxy (`/articles/{pmid}/pdf-proxy`)
- ✅ Multiple PDF sources (PMC, Europe PMC, Unpaywall, etc.)
- ✅ Frontend PDF viewer with text extraction

But:
- ❌ No backend PDF text extraction
- ❌ No storage of extracted PDF text
- ❌ No integration with protocol/triage services

---

## ✅ Solution: Complete PDF Text Extraction Pipeline

### **Phase 1: Database Migration** (REQUIRED FIRST)

**File**: `backend/migrations/006_add_pdf_text_fields.sql`

```sql
-- Add PDF text storage to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_text TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_extracted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_extraction_method VARCHAR(50);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_source VARCHAR(50);

-- Add index for full-text search
CREATE INDEX IF NOT EXISTS idx_article_pdf_text ON articles USING gin(to_tsvector('english', pdf_text));

-- Add comment
COMMENT ON COLUMN articles.pdf_text IS 'Full text extracted from PDF';
COMMENT ON COLUMN articles.pdf_extracted_at IS 'When PDF text was extracted';
COMMENT ON COLUMN articles.pdf_extraction_method IS 'Method used: pypdf, pdfplumber, ocr, etc.';
COMMENT ON COLUMN articles.pdf_url IS 'URL where PDF was fetched from';
COMMENT ON COLUMN articles.pdf_source IS 'Source: pmc, europepmc, unpaywall, etc.';
```

### **Phase 2: Update Database Model**

**File**: `database.py` (add to Article class around line 441)

```python
class Article(Base):
    # ... existing fields ...
    abstract = Column(Text, nullable=True)
    
    # PDF full text extraction (Week 19-20 Fix)
    pdf_text = Column(Text, nullable=True)  # Full text extracted from PDF
    pdf_extracted_at = Column(DateTime(timezone=True), nullable=True)
    pdf_extraction_method = Column(String(50), nullable=True)  # pypdf, pdfplumber, ocr
    pdf_url = Column(Text, nullable=True)  # URL where PDF was fetched
    pdf_source = Column(String(50), nullable=True)  # pmc, europepmc, unpaywall, etc.
```

### **Phase 3: Create PDF Text Extraction Service**

**File**: `backend/app/services/pdf_text_extractor.py` (NEW)

```python
"""
PDF Text Extraction Service
Extracts full text from PDFs for protocol extraction and AI triage.
"""

import logging
import httpx
import PyPDF2
import io
from typing import Optional, Dict
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class PDFTextExtractor:
    """Extract text from PDF files."""
    
    async def extract_and_store(
        self,
        pmid: str,
        db: Session,
        force_refresh: bool = False
    ) -> Optional[str]:
        """
        Extract PDF text and store in database.
        
        Steps:
        1. Check if already extracted (unless force_refresh)
        2. Get PDF URL using existing pdf_endpoints logic
        3. Download PDF
        4. Extract text using PyPDF2/pdfplumber
        5. Store in database
        6. Return extracted text
        """
        from database import Article
        from pdf_endpoints import get_pdf_url_internal  # We'll create this
        
        # Check cache
        article = db.query(Article).filter(Article.pmid == pmid).first()
        if not article:
            raise ValueError(f"Article {pmid} not found")
        
        if article.pdf_text and not force_refresh:
            logger.info(f"✅ Using cached PDF text for {pmid}")
            return article.pdf_text
        
        # Get PDF URL
        pdf_info = await get_pdf_url_internal(pmid, db)
        if not pdf_info or not pdf_info.get('url'):
            logger.warning(f"⚠️ No PDF available for {pmid}")
            return None
        
        # Download and extract
        try:
            pdf_text = await self._download_and_extract(pdf_info['url'])
            
            # Store in database
            article.pdf_text = pdf_text
            article.pdf_extracted_at = func.now()
            article.pdf_extraction_method = 'pypdf2'
            article.pdf_url = pdf_info['url']
            article.pdf_source = pdf_info['source']
            
            db.commit()
            logger.info(f"✅ Extracted {len(pdf_text)} characters from PDF {pmid}")
            return pdf_text
            
        except Exception as e:
            logger.error(f"❌ PDF extraction failed for {pmid}: {e}")
            return None
    
    async def _download_and_extract(self, pdf_url: str) -> str:
        """Download PDF and extract text."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(pdf_url)
            response.raise_for_status()
            
            # Extract text using PyPDF2
            pdf_file = io.BytesIO(response.content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            
            return "\n\n".join(text_parts)
```

### **Phase 4: Update Protocol Extraction to Use PDF Text**

**File**: `backend/app/services/protocol_extractor_service.py`

**Change line 107-110**:
```python
# OLD:
protocol_data = await self._extract_with_ai(
    article=article,
    protocol_type=protocol_type
)

# NEW:
# Extract PDF text first
from backend.app.services.pdf_text_extractor import PDFTextExtractor
pdf_extractor = PDFTextExtractor()
pdf_text = await pdf_extractor.extract_and_store(article_pmid, db, force_refresh)

protocol_data = await self._extract_with_ai(
    article=article,
    protocol_type=protocol_type,
    pdf_text=pdf_text  # ← Pass PDF text!
)
```

**Change line 172-176**:
```python
# OLD:
async def _extract_with_ai(
    self,
    article: Article,
    protocol_type: Optional[str]
) -> Dict:

# NEW:
async def _extract_with_ai(
    self,
    article: Article,
    protocol_type: Optional[str],
    pdf_text: Optional[str] = None  # ← Add parameter!
) -> Dict:
```

**Change line 264-266**:
```python
# OLD:
**Abstract:**
{abstract}

# NEW:
**Abstract:**
{abstract}

**Full Paper Text (Methods Section):**
{self._extract_methods_section(pdf_text) if pdf_text else "Not available - using abstract only"}
```

---

## 📊 Implementation Priority

### **CRITICAL (Do First)**:
1. ✅ Database migration 006
2. ✅ Update Article model
3. ✅ Create PDFTextExtractor service
4. ✅ Update protocol extraction to use PDF text
5. ✅ Update AI triage to use PDF text

### **HIGH (Do Next)**:
6. ✅ Add admin endpoint to trigger PDF extraction for existing articles
7. ✅ Add background job to extract PDFs for all triaged papers
8. ✅ Update intelligent protocol extractor

### **MEDIUM (Nice to Have)**:
9. ⚠️ Add PDF text preview in UI
10. ⚠️ Add "Re-extract with PDF" button
11. ⚠️ Add PDF extraction status indicator

---

## 🎯 Expected Improvements

**Before** (Abstract only):
- Empty protocols from papers with detailed methods
- Low confidence scores
- Missing critical details
- Poor triage accuracy

**After** (Full PDF text):
- ✅ Complete protocols with all materials and steps
- ✅ High confidence scores (80-95%)
- ✅ Detailed experimental procedures
- ✅ Accurate triage based on full paper content
- ✅ Better relevance scoring

---

## 📝 Next Steps

1. Create migration 006
2. Update database.py
3. Create pdf_text_extractor.py
4. Update protocol_extractor_service.py
5. Update intelligent_protocol_extractor.py
6. Update ai_triage_service.py
7. Test with PMID 35650602
8. Deploy to production

**Estimated Time**: 4-6 hours
**Impact**: CRITICAL - Fixes core functionality

