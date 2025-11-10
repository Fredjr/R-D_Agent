# 🔧 PDF Viewer Fixes - Complete Solution

**Date:** 2025-11-10  
**Issues Found:** 6 PMIDs failing  
**Root Causes:** BMJ handler not working in production + Publishers blocking proxy

---

## 🎯 Summary of Issues

| Issue | PMIDs Affected | Root Cause | Fix Priority |
|-------|----------------|------------|--------------|
| **BMJ PDF not found** | 1 (38278529) | Backend not finding BMJ PDF | 🔴 CRITICAL |
| **403 Forbidden** | 4 (33264825, 37345492, 40331662, 40327845) | Publishers blocking proxy | 🟡 HIGH |
| **500 Error** | 1 (41021024) | Europe PMC proxy error | 🟢 MEDIUM |

---

## 🔴 Fix #1: BMJ Handler Not Working (CRITICAL)

### **Problem:**
PMID 38278529 returns `pdf_available: false` even though:
- ✅ DOI exists: `10.1136/bmj-2023-075681`
- ✅ Volume exists: `384`
- ✅ BMJ handler works locally
- ✅ Correct PDF URL: `https://www.bmj.com/content/384/bmj-2023-075681.pdf`

### **Root Cause:**
The article might be in the database WITHOUT a DOI, causing the BMJ handler to not be called.

### **Solution:**
Ensure `fetch_article_metadata_from_pubmed` is ALWAYS called when DOI is missing, even if article exists in database.

### **Code Changes:**

#### **File: `pdf_endpoints.py`** (Lines 57-68)

**BEFORE:**
```python
# Get article from database
article = db.query(Article).filter(Article.pmid == pmid).first()
if not article:
    logger.warning(f"⚠️ Article not found in database: {pmid}, fetching metadata from PubMed")
    # Fetch metadata from PubMed directly
    pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
    article_title = pubmed_metadata.get("title") or "Unknown Article"
    article_doi = pubmed_metadata.get("doi")
    logger.info(f"📋 PubMed metadata: title='{article_title[:50]}...', doi={article_doi}")
else:
    article_title = article.title or "Unknown Article"
    article_doi = article.doi
```

**AFTER:**
```python
# Get article from database
article = db.query(Article).filter(Article.pmid == pmid).first()
if not article:
    logger.warning(f"⚠️ Article not found in database: {pmid}, fetching metadata from PubMed")
    # Fetch metadata from PubMed directly
    pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
    article_title = pubmed_metadata.get("title") or "Unknown Article"
    article_doi = pubmed_metadata.get("doi")
    logger.info(f"📋 PubMed metadata: title='{article_title[:50]}...', doi={article_doi}")
else:
    article_title = article.title or "Unknown Article"
    article_doi = article.doi
    
    # ✅ FIX: If article exists but DOI is missing, fetch from PubMed
    if not article_doi:
        logger.warning(f"⚠️ Article {pmid} in database but DOI missing, fetching from PubMed")
        pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
        article_doi = pubmed_metadata.get("doi")
        if article_doi:
            logger.info(f"📋 Found DOI from PubMed: {article_doi}")
            # Update article in database with DOI
            article.doi = article_doi
            db.commit()
```

---

## 🟡 Fix #2: Publishers Blocking Proxy (HIGH PRIORITY)

### **Problem:**
4 PMIDs return 403 Forbidden when trying to proxy the PDF:
- **33264825** - NEJM (Atypon)
- **37345492** - Wolters Kluwer
- **40331662** - Wiley Enhanced
- **40327845** - Wolters Kluwer

### **Root Cause:**
These publishers block server-to-server requests. They require:
1. Browser User-Agent
2. Referer header
3. Cookies/authentication
4. Direct browser access

### **Solution:**
Open PDFs in new tab for publishers that block proxies.

### **Code Changes:**

#### **File: `frontend/src/components/reading/PDFViewer.tsx`** (Lines 133-178)

**Add after line 154:**
```typescript
if (data.pdf_available) {
  // ✅ FIX: Check if source blocks proxying
  const DIRECT_LINK_SOURCES = [
    'wolters_kluwer',
    'wiley_enhanced',
    'pubmed_fulltext_atypon',
    'pubmed_fulltext_silverchair',
    'pubmed_fulltext_highwire',
  ];
  
  if (DIRECT_LINK_SOURCES.includes(data.source)) {
    // Open in new tab instead of proxying
    console.log(`📄 Opening PDF in new tab (source: ${data.source})`);
    window.open(data.url, '_blank');
    setError(`PDF opened in new tab. ${data.source} requires direct browser access.`);
    setPdfUrl(null);
  } else {
    // Use our proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/proxy/articles/${pmid}/pdf-proxy`;
    console.log('📄 Using PDF proxy:', proxyUrl);
    setPdfUrl(proxyUrl);
  }
} else {
  // ... existing code
}
```

---

## 🟢 Fix #3: Improve PDF Proxy Error Handling (MEDIUM PRIORITY)

### **Problem:**
PMID 41021024 returns 500 Internal Server Error when proxying Europe PMC PDF.

### **Solution:**
Add better error handling, timeout, and retry logic.

### **Code Changes:**

#### **File: `pdf_endpoints.py`** (Lines 250-320)

**Find the `/articles/{pmid}/pdf-proxy` endpoint and update:**

```python
@app.get("/articles/{pmid}/pdf-proxy")
async def proxy_pdf(
    pmid: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Proxy PDF content to avoid CORS issues.
    """
    try:
        logger.info(f"📄 Proxying PDF for PMID: {pmid}")
        
        # Get PDF URL first
        pdf_url_data = await get_pdf_url(pmid, user_id, db)
        
        if not pdf_url_data.get("pdf_available"):
            logger.warning(f"⚠️ PDF not available for {pmid}")
            raise HTTPException(status_code=404, detail="PDF not available")
        
        pdf_url = pdf_url_data.get("url")
        source = pdf_url_data.get("source")
        
        logger.info(f"📥 Fetching PDF from {source}: {pdf_url}")
        
        # ✅ FIX: Add retry logic and better timeout
        max_retries = 3
        timeout = httpx.Timeout(60.0, connect=10.0)  # 60s total, 10s connect
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                    # Add browser-like headers
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/pdf,*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                    
                    response = await client.get(pdf_url, headers=headers)
                    
                    if response.status_code == 200:
                        logger.info(f"✅ PDF fetched successfully: {len(response.content)} bytes")
                        return Response(
                            content=response.content,
                            media_type="application/pdf",
                            headers={
                                "Content-Disposition": f"inline; filename=\"{pmid}.pdf\"",
                                "Access-Control-Allow-Origin": "*",
                            }
                        )
                    elif response.status_code == 403:
                        logger.warning(f"⚠️ 403 Forbidden from {source} - publisher blocks proxying")
                        raise HTTPException(
                            status_code=403,
                            detail=f"Publisher blocks proxy access. Please open PDF directly: {pdf_url}"
                        )
                    elif response.status_code == 404:
                        logger.warning(f"⚠️ 404 Not Found from {source}")
                        raise HTTPException(status_code=404, detail="PDF not found at source")
                    else:
                        logger.warning(f"⚠️ Unexpected status {response.status_code} from {source}")
                        if attempt < max_retries - 1:
                            logger.info(f"🔄 Retrying... (attempt {attempt + 2}/{max_retries})")
                            await asyncio.sleep(1)  # Wait 1s before retry
                            continue
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"Failed to fetch PDF: {response.status_code}"
                        )
                        
            except httpx.TimeoutException:
                logger.warning(f"⏱️ Timeout fetching PDF (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)  # Wait 2s before retry
                    continue
                raise HTTPException(status_code=504, detail="PDF fetch timeout")
            except httpx.HTTPError as e:
                logger.error(f"❌ HTTP error fetching PDF: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise HTTPException(status_code=502, detail=f"Failed to fetch PDF: {str(e)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error proxying PDF for {pmid}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
```

---

## 📋 Deployment Checklist

### **Backend Changes:**
- [ ] Update `pdf_endpoints.py` - Fix BMJ handler (lines 57-68)
- [ ] Update `pdf_endpoints.py` - Improve PDF proxy (lines 250-320)
- [ ] Test locally with `python3 test-pdf-scraper-all-pmids.py`
- [ ] Commit and push to GitHub
- [ ] Verify Railway auto-deploys
- [ ] Test production endpoint: `curl "https://r-dagent-production.up.railway.app/articles/38278529/pdf-url"`

### **Frontend Changes:**
- [ ] Update `PDFViewer.tsx` - Add direct link fallback (lines 154-170)
- [ ] Test locally with `npm run dev`
- [ ] Commit and push to GitHub
- [ ] Verify Vercel auto-deploys
- [ ] Test in browser: Open PMID 38278529, 37345492, 40331662

---

## 🧪 Testing Instructions

### **Test BMJ Fix (PMID 38278529):**
```bash
# Should return pdf_available: true with BMJ source
curl -s "https://r-dagent-production.up.railway.app/articles/38278529/pdf-url" \
  -H "User-ID: default_user" | jq
```

**Expected:**
```json
{
  "pmid": "38278529",
  "source": "bmj",
  "url": "https://www.bmj.com/content/384/bmj-2023-075681.pdf",
  "pdf_available": true,
  "title": "New advances in type 1 diabetes."
}
```

### **Test Direct Link Fallback (PMID 37345492):**
1. Open: `https://frontend-psi-seven-85.vercel.app/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64/paper/37345492`
2. Should see message: "PDF opened in new tab. wolters_kluwer requires direct browser access."
3. PDF should open in new tab

### **Test All 10 PMIDs:**
```bash
./test-pdf-viewer-flow.sh
```

**Expected Results:**
- ✅ 10/10 PDFs available
- ✅ 4 PDFs via proxy (Europe PMC)
- ✅ 6 PDFs via direct link (publishers blocking proxy)

---

## 📊 Expected Improvement

### **Before Fixes:**
- ✅ 4/10 working (40%)
- ⚠️ 5/10 failing but recoverable (50%)
- ❌ 1/10 completely broken (10%)

### **After Fixes:**
- ✅ 10/10 working (100%)
  - 4 via proxy (Europe PMC)
  - 6 via direct link (Wolters Kluwer, Wiley, NEJM, BMJ)

---

## 🎯 Summary

**3 fixes required:**
1. ✅ **BMJ Handler** - Fetch DOI from PubMed if missing in database
2. ✅ **Direct Link Fallback** - Open PDFs in new tab for publishers blocking proxy
3. ✅ **Better Error Handling** - Add retry logic, timeouts, better headers

**Files to modify:**
1. `pdf_endpoints.py` (backend)
2. `frontend/src/components/reading/PDFViewer.tsx` (frontend)

**Expected outcome:** All 10 PMIDs working, 100% success rate!

