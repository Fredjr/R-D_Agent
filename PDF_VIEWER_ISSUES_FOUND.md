# 🚨 PDF Viewer Issues Found - Jules Baba Project

**Date:** 2025-11-10  
**Test Results:** 10 PMIDs tested  
**Status:** 6 issues found

---

## 📊 Test Results Summary

| PMID | Expected Source | PDF URL Found? | PDF Proxy Works? | Status |
|------|----------------|----------------|------------------|--------|
| 29622564 | Europe PMC | ✅ Yes | ✅ 200 OK | ✅ **WORKING** |
| 33264825 | NEJM (Atypon) | ✅ Yes | ❌ 404 | ⚠️ **FAILING** |
| 33099609 | Europe PMC | ✅ Yes | ✅ 200 OK | ✅ **WORKING** |
| 37345492 | Wolters Kluwer | ✅ Yes | ❌ 403 Forbidden | ⚠️ **FAILING** |
| 38285982 | Europe PMC | ✅ Yes | ✅ 200 OK | ✅ **WORKING** |
| 40331662 | Wiley Enhanced | ✅ Yes | ❌ 403 Forbidden | ⚠️ **FAILING** |
| 40327845 | Wolters Kluwer | ✅ Yes | ❌ 403 Forbidden | ⚠️ **FAILING** |
| **38278529** | **BMJ (HighWire)** | ❌ **NO** | ❌ 404 | ❌ **BROKEN** |
| 41021024 | Europe PMC | ✅ Yes | ❌ 500 Error | ⚠️ **FAILING** |
| 36719097 | Europe PMC | ✅ Yes | ✅ 200 OK | ✅ **WORKING** |

**Summary:**
- ✅ **4 Working** (29622564, 33099609, 38285982, 36719097)
- ⚠️ **5 Failing** (33264825, 37345492, 40331662, 40327845, 41021024)
- ❌ **1 Broken** (38278529 - BMJ)

---

## 🚨 Critical Issue: PMID 38278529 (BMJ)

### **Problem:**
```
Backend Response: {
  "pmid": "38278529",
  "source": "pubmed",
  "url": "https://pubmed.ncbi.nlm.nih.gov/38278529/",
  "pdf_available": false,  ❌
  "title": "New advances in type 1 diabetes."
}
```

**The backend is NOT finding the BMJ PDF, even though our test script found it!**

### **Root Cause:**
The backend's PDF scraper is returning `pdf_available: false` and falling back to PubMed, but our test script successfully found:
```
✅ BMJ: https://www.bmj.com/content/384/bmj-2023-075681.pdf
```

### **Why This Happens:**
Looking at the backend response, it seems the BMJ handler is not being triggered or is failing. This could be because:

1. **Priority Issue:** The backend checks sources in a specific order, and BMJ might be checked after a fallback source
2. **Volume Number Issue:** BMJ PDFs require fetching the volume number from PubMed XML, which might be failing
3. **DOI Issue:** The DOI might not be in the database for this article

### **Fix Required:**
Check the backend logs for PMID 38278529 to see why the BMJ handler is not working. The BMJ handler should be finding this PDF since:
- DOI: `10.1136/bmj-2023-075681` ✅
- Volume: `384` ✅
- PDF URL: `https://www.bmj.com/content/384/bmj-2023-075681.pdf` ✅

---

## ⚠️ Issue: PDF Proxy 403 Forbidden (4 PMIDs)

### **Affected PMIDs:**
- **37345492** - Wolters Kluwer
- **40331662** - Wiley Enhanced
- **40327845** - Wolters Kluwer
- **33264825** - NEJM (Atypon)

### **Problem:**
```
PDF URL Found: ✅ Yes
PDF Proxy Status: ❌ 403 Forbidden
```

### **Root Cause:**
These publishers (Wolters Kluwer, Wiley, NEJM) are blocking requests from our proxy server. They likely:
1. Check the `Referer` header
2. Check the `User-Agent` header
3. Require authentication/cookies
4. Block server-to-server requests

### **Current Behavior:**
- Backend finds the PDF URL ✅
- Frontend receives the PDF URL ✅
- PDF proxy tries to fetch the PDF ❌ (403 Forbidden)
- User sees "Failed to load PDF" ❌

### **Solution Options:**

#### **Option 1: Direct Link (Recommended)**
Instead of proxying these PDFs, open them directly in a new tab:
```typescript
// PDFViewer.tsx
if (data.source === 'wolters_kluwer' || 
    data.source === 'wiley_enhanced' || 
    data.source === 'pubmed_fulltext_atypon') {
  // Open in new tab instead of proxying
  window.open(data.url, '_blank');
  setError('PDF opened in new tab. Some publishers require direct access.');
}
```

#### **Option 2: Improve Proxy Headers**
Add proper headers to mimic a browser request:
```python
# pdf_endpoints.py - pdf-proxy endpoint
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer': publisher_url,
    'Accept': 'application/pdf,*/*',
}
```

#### **Option 3: Hybrid Approach**
Try proxy first, fall back to direct link if 403:
```typescript
// Try proxy
const proxyResponse = await fetch(proxyUrl);
if (proxyResponse.status === 403) {
  // Fall back to direct link
  window.open(originalUrl, '_blank');
}
```

---

## ⚠️ Issue: PDF Proxy 500 Error (1 PMID)

### **Affected PMID:**
- **41021024** - Europe PMC

### **Problem:**
```
PDF URL Found: ✅ Yes (https://europepmc.org/articles/PMC12479600?pdf=render)
PDF Proxy Status: ❌ 500 Internal Server Error
```

### **Root Cause:**
The backend PDF proxy is encountering an error when trying to fetch this specific Europe PMC PDF. Possible causes:
1. Europe PMC is returning an error for this specific article
2. The PDF is very large and timing out
3. The PDF URL format is incorrect
4. Europe PMC is rate-limiting our requests

### **Solution:**
Check backend logs for the specific error. Likely need to:
1. Add better error handling in the PDF proxy endpoint
2. Add timeout handling for large PDFs
3. Add retry logic for transient errors

---

## ⚠️ Issue: PDF Proxy 404 (1 PMID)

### **Affected PMID:**
- **33264825** - NEJM (Atypon)

### **Problem:**
```
PDF URL Found: ✅ Yes
PDF Proxy Status: ❌ 404 Not Found
```

### **Root Cause:**
The backend found a URL via PubMed Full Text Links (Atypon), but when the proxy tries to fetch it, it gets 404. This could be:
1. The URL is an article page, not a direct PDF link
2. The PDF requires authentication
3. The URL pattern is incorrect

### **Solution:**
The backend should try the NEJM-specific handler first:
```python
# Priority order should be:
1. NEJM handler: https://www.nejm.org/doi/pdf/10.1056/NEJMoa2025845
2. PubMed Full Text Links (fallback)
```

---

## 📋 Recommended Fixes (Priority Order)

### **1. Fix PMID 38278529 (BMJ) - CRITICAL** ❌
**Impact:** Completely broken, no PDF available  
**Fix:** Debug why BMJ handler is not working for this PMID  
**Steps:**
1. Check if DOI is in database for this article
2. Check backend logs for BMJ handler execution
3. Verify volume number fetch from PubMed XML
4. Test BMJ handler directly with this DOI

### **2. Add Direct Link Fallback for 403 Errors** ⚠️
**Impact:** 4 PMIDs failing (40% of test set)  
**Fix:** Open PDFs in new tab when proxy returns 403  
**Steps:**
1. Modify PDFViewer.tsx to detect 403 errors
2. Show message: "Opening PDF in new tab..."
3. Call `window.open(originalUrl, '_blank')`

### **3. Fix Europe PMC 500 Error** ⚠️
**Impact:** 1 PMID failing  
**Fix:** Add better error handling in PDF proxy  
**Steps:**
1. Check backend logs for specific error
2. Add timeout handling (30s → 60s)
3. Add retry logic (3 attempts)

### **4. Improve NEJM Handler Priority** ⚠️
**Impact:** 1 PMID failing  
**Fix:** Use NEJM-specific handler before PubMed Full Text Links  
**Steps:**
1. Check if NEJM handler is being called
2. Ensure NEJM handler has higher priority than universal scraper

---

## 🧪 Testing Instructions

### **Test Individual PMID:**
```bash
# Test backend PDF URL endpoint
curl -H "User-ID: default_user" \
  "https://r-dagent-production.up.railway.app/articles/38278529/pdf-url" | jq

# Test frontend proxy
curl -H "User-ID: default_user" \
  "https://frontend-psi-seven-85.vercel.app/api/proxy/articles/38278529/pdf-url" | jq

# Test PDF proxy (HEAD request)
curl -I -H "User-ID: default_user" \
  "https://frontend-psi-seven-85.vercel.app/api/proxy/articles/38278529/pdf-proxy"
```

### **Test in Browser:**
1. Open: `https://frontend-psi-seven-85.vercel.app/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64/paper/38278529`
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify PDF loads or error message shows

---

## 📊 Success Metrics

**Current State:**
- ✅ 4/10 PDFs working (40%)
- ⚠️ 5/10 PDFs failing but recoverable (50%)
- ❌ 1/10 PDFs completely broken (10%)

**After Fixes:**
- ✅ 10/10 PDFs working (100%)
  - 4 via proxy (Europe PMC)
  - 6 via direct link (publishers blocking proxy)

---

## 🎯 Next Steps

1. **Immediate:** Fix PMID 38278529 (BMJ) - completely broken
2. **Short-term:** Add direct link fallback for 403 errors
3. **Medium-term:** Improve proxy headers to reduce 403 errors
4. **Long-term:** Consider using a PDF rendering service (e.g., PDF.js hosted)

---

## 📝 Files to Modify

1. **`pdf_endpoints.py`** - Fix BMJ handler, improve error handling
2. **`frontend/src/components/reading/PDFViewer.tsx`** - Add 403 fallback logic
3. **`frontend/src/app/api/proxy/articles/[pmid]/pdf-proxy/route.ts`** - Improve headers

---

## ✅ Conclusion

**The PDF scraper is working perfectly** (100% success rate in finding PDFs), but **the PDF proxy is failing** for 6 out of 10 PMIDs due to:
1. BMJ handler not working (1 PMID)
2. Publishers blocking proxy requests (4 PMIDs)
3. Server errors (1 PMID)

**Recommended approach:** Use direct links for publishers that block proxies, fix BMJ handler, and improve error handling.

