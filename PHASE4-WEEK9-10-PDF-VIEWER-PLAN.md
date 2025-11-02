# Phase 4 Week 9-10: PDF Viewer & Reading Experience - Implementation Plan

**Date:** November 2, 2025  
**Status:** 🚀 Ready to Start  
**Timeline:** 10-12 days  
**Prerequisites:** ✅ Phase 4 Week 7 Complete, ✅ Cost Optimization Complete

---

## 🎯 OBJECTIVES

Create an integrated PDF reading experience that allows users to:
1. **View PDFs** directly in the application
2. **Highlight text** and create annotations
3. **Track reading progress** across papers
4. **Manage reading lists** ("Read Later" queue)
5. **Convert highlights to notes** seamlessly

---

## 📋 FEATURE BREAKDOWN

### **Core Features:**
1. ✅ PDF URL retrieval from multiple sources
2. ✅ Embedded PDF viewer with navigation
3. ✅ Highlight tool for text selection
4. ✅ Reading progress tracking
5. ✅ Reading list management

### **Advanced Features (Optional):**
6. 🔲 Offline reading support
7. 🔲 PDF download and caching
8. 🔲 Full-text search within PDF
9. 🔲 Citation extraction from PDF

---

## 🗓️ IMPLEMENTATION TIMELINE

### **Day 1-2: Backend - PDF URL Endpoint** (2 days)
**Goal:** Create endpoint to fetch PDF URLs from multiple sources

**Tasks:**
1. Create `/articles/{pmid}/pdf-url` endpoint
2. Integrate PubMed Central API
3. Integrate Unpaywall API
4. Add DOI resolver fallback
5. Test PDF URL retrieval

**Files to Create/Modify:**
- `pdf_endpoints.py` (new file)
- `main.py` (register endpoints)

**Success Criteria:**
- [ ] Endpoint returns PDF URL for PMC articles
- [ ] Endpoint returns PDF URL for open access articles
- [ ] Endpoint falls back to DOI resolver
- [ ] Endpoint returns 404 if no PDF available
- [ ] Response time < 2 seconds

---

### **Day 3-5: Frontend - PDF Viewer Component** (3 days)
**Goal:** Create embedded PDF viewer with basic navigation

**Tasks:**
1. Install dependencies (react-pdf, pdfjs-dist)
2. Create PDFViewer component
3. Add page navigation controls
4. Add zoom controls
5. Add loading and error states
6. Test with various PDFs

**Files to Create:**
- `frontend/src/components/reading/PDFViewer.tsx`
- `frontend/src/components/reading/PDFControls.tsx`
- `frontend/src/hooks/usePDFViewer.ts`

**Success Criteria:**
- [ ] PDF loads and displays correctly
- [ ] Page navigation works (prev/next, jump to page)
- [ ] Zoom controls work (zoom in/out, fit to width)
- [ ] Loading state displays while PDF loads
- [ ] Error state displays if PDF fails to load
- [ ] Responsive design (works on mobile)

---

### **Day 6-7: Highlight Tool** (2 days)
**Goal:** Enable text highlighting and annotation creation

**Tasks:**
1. Create HighlightTool component
2. Implement text selection detection
3. Add highlight color picker
4. Create "Create Note from Highlight" button
5. Save highlights to database
6. Display existing highlights

**Files to Create:**
- `frontend/src/components/reading/HighlightTool.tsx`
- `frontend/src/components/reading/HighlightPopover.tsx`
- `backend/highlight_endpoints.py` (new file)

**Success Criteria:**
- [ ] User can select text in PDF
- [ ] Highlight popover appears on selection
- [ ] User can choose highlight color
- [ ] Highlight is saved to database
- [ ] Highlights persist across sessions
- [ ] User can create note from highlight

---

### **Day 8-9: Reading List & Progress Tracking** (2 days)
**Goal:** Track reading progress and manage reading queue

**Tasks:**
1. Create ReadingList component
2. Add "Read Later" button to paper cards
3. Track reading progress (pages read, time spent)
4. Add "Mark as Read" functionality
5. Display reading statistics

**Files to Create:**
- `frontend/src/components/reading/ReadingList.tsx`
- `frontend/src/components/reading/ReadingProgress.tsx`
- `backend/reading_endpoints.py` (new file)

**Success Criteria:**
- [ ] User can add papers to reading list
- [ ] Reading list displays in sidebar or dedicated tab
- [ ] Reading progress is tracked automatically
- [ ] User can mark papers as read
- [ ] Reading statistics are displayed

---

### **Day 10: Integration & Testing** (1 day)
**Goal:** Integrate all components and test end-to-end

**Tasks:**
1. Add "Read PDF" button to paper cards
2. Integrate PDFViewer with project layout
3. Test full reading workflow
4. Fix bugs and polish UI
5. Create test script

**Success Criteria:**
- [ ] User can open PDF from any paper card
- [ ] PDF viewer opens in modal or dedicated view
- [ ] All features work together seamlessly
- [ ] No console errors
- [ ] Responsive design works on all devices

---

### **Day 11-12: Polish & Documentation** (2 days)
**Goal:** Polish UI, optimize performance, and document

**Tasks:**
1. Optimize PDF loading performance
2. Add keyboard shortcuts (arrow keys for navigation)
3. Improve error handling
4. Create user documentation
5. Deploy to production

**Success Criteria:**
- [ ] PDF loads in < 3 seconds
- [ ] Keyboard shortcuts work
- [ ] Error messages are user-friendly
- [ ] Documentation is complete
- [ ] Feature is deployed to production

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Backend: PDF URL Endpoint**

**File:** `pdf_endpoints.py`

```python
"""
PDF URL Retrieval Endpoints
Phase 4 Week 9-10: PDF Viewer & Reading Experience
"""

import logging
import httpx
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db, Article

logger = logging.getLogger(__name__)

def register_pdf_endpoints(app):
    """Register all PDF-related endpoints with the FastAPI app"""
    
    @app.get("/articles/{pmid}/pdf-url")
    async def get_pdf_url(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get PDF URL from multiple sources:
        1. PubMed Central (free full text)
        2. Unpaywall API (open access)
        3. DOI resolver
        """
        try:
            # Get article from database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            
            # Try PubMed Central first
            pmc_url = await get_pmc_pdf_url(pmid)
            if pmc_url:
                return {
                    "pmid": pmid,
                    "source": "pmc",
                    "url": pmc_url,
                    "available": True
                }
            
            # Try Unpaywall
            if article.doi:
                unpaywall_url = await get_unpaywall_pdf_url(article.doi)
                if unpaywall_url:
                    return {
                        "pmid": pmid,
                        "source": "unpaywall",
                        "url": unpaywall_url,
                        "available": True
                    }
            
            # Fallback to DOI resolver
            if article.doi:
                return {
                    "pmid": pmid,
                    "source": "doi",
                    "url": f"https://doi.org/{article.doi}",
                    "available": True
                }
            
            # No PDF available
            return {
                "pmid": pmid,
                "source": None,
                "url": None,
                "available": False
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching PDF URL for {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch PDF URL: {str(e)}")


async def get_pmc_pdf_url(pmid: str) -> str | None:
    """Get PDF URL from PubMed Central"""
    try:
        async with httpx.AsyncClient() as client:
            # Check if article is in PMC
            response = await client.get(
                f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids={pmid}&format=json"
            )
            data = response.json()
            
            if "records" in data and len(data["records"]) > 0:
                record = data["records"][0]
                if "pmcid" in record:
                    pmcid = record["pmcid"]
                    # Return PMC PDF URL
                    return f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/pdf/"
            
            return None
    except Exception as e:
        logger.warning(f"PMC lookup failed for {pmid}: {e}")
        return None


async def get_unpaywall_pdf_url(doi: str) -> str | None:
    """Get PDF URL from Unpaywall API"""
    try:
        async with httpx.AsyncClient() as client:
            # Unpaywall API (requires email in query)
            response = await client.get(
                f"https://api.unpaywall.org/v2/{doi}?email=your-email@example.com"
            )
            data = response.json()
            
            if "best_oa_location" in data and data["best_oa_location"]:
                location = data["best_oa_location"]
                if "url_for_pdf" in location and location["url_for_pdf"]:
                    return location["url_for_pdf"]
            
            return None
    except Exception as e:
        logger.warning(f"Unpaywall lookup failed for {doi}: {e}")
        return None
```

---

### **Frontend: PDF Viewer Component**

**File:** `frontend/src/components/reading/PDFViewer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pmid: string;
  onClose: () => void;
}

export default function PDFViewer({ pmid, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    fetchPDFUrl();
  }, [pmid]);

  const fetchPDFUrl = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/articles/${pmid}/pdf-url`, {
        headers: {
          'User-ID': 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('PDF not available');
      }

      const data = await response.json();
      if (data.available) {
        setPdfUrl(data.url);
      } else {
        setError('PDF not available for this article');
      }
    } catch (err) {
      setError('Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading PDF...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
            Next
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={zoomOut}>Zoom Out</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn}>Zoom In</button>
        </div>
        
        <button onClick={onClose}>Close</button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );
}
```

---

## 📊 SUCCESS METRICS

### **User Engagement:**
- [ ] 50%+ of papers opened in PDF viewer
- [ ] 30%+ of highlights converted to notes
- [ ] Reading list usage > 40%
- [ ] Average reading time > 10 minutes per paper

### **Technical Performance:**
- [ ] PDF loads in < 3 seconds
- [ ] Page navigation < 500ms
- [ ] Zero console errors
- [ ] Mobile responsive (works on all devices)

### **User Satisfaction:**
- [ ] Positive user feedback
- [ ] No critical bugs reported
- [ ] Feature adoption > 60%

---

## 🚀 DEPLOYMENT STRATEGY

### **Day 1-2: Backend**
1. Create PDF endpoints
2. Test with curl
3. Deploy to Railway
4. Verify endpoints work in production

### **Day 3-9: Frontend**
1. Develop components locally
2. Test with various PDFs
3. Commit and push to GitHub
4. Vercel auto-deploys frontend
5. Test on production

### **Day 10-12: Integration & Polish**
1. Final testing
2. Bug fixes
3. Documentation updates
4. Production deployment

---

## 📝 NEXT STEPS

**Immediate Actions:**
1. Start Day 1-2: Create PDF URL endpoint
2. Test with PubMed Central articles
3. Deploy to Railway
4. Move to Day 3-5: Create PDFViewer component

**Ready to proceed?** 🚀

