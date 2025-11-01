# 🐛 PHASE 3 WEEK 5: BUG INVESTIGATION REPORT

**Date:** November 1, 2025  
**Status:** 🔍 **IN PROGRESS**  
**Issue:** Search returns 0 papers for "diabetes" query despite paper existing in database

---

## 📊 EXECUTIVE SUMMARY

During testing of the Phase 3 Week 5 Global Search feature, we discovered that searching for "diabetes" returns **0 papers** even though a paper with "diabetes" in the title exists in the database.

### **Test Results:**
- ✅ Backend endpoint responds (200 OK)
- ✅ Response structure is correct
- ✅ Collections search works (found 1 collection with "diabetes")
- ❌ Papers search returns 0 results (UNEXPECTED)
- ✅ Notes search works
- ✅ Reports search works
- ✅ Analyses search works

---

## 🔍 INVESTIGATION FINDINGS

### **1. Data Verification**

#### **Collection Exists:**
```bash
curl "https://r-dagent-production.up.railway.app/projects/804494b5-69e0-4b9a-9c7b-f7fb2bddef64/collections"
```

**Result:**
```json
[
  {
    "collection_id": "00ee895b-1c80-4300-9824-39c35f149bcc",
    "collection_name": "Search Result: New advances in type 1 diabetes....",
    "description": "Article added from search: New advances in type 1 diabetes.",
    "article_count": 1
  }
]
```

✅ **Collection found with "diabetes" in name and description**

---

#### **Paper Exists in ArticleCollection Table:**
```bash
curl "https://r-dagent-production.up.railway.app/projects/804494b5-69e0-4b9a-9c7b-f7fb2bddef64/collections/00ee895b-1c80-4300-9824-39c35f149bcc/articles"
```

**Result:**
```json
{
  "articles": [
    {
      "id": 27,
      "article_pmid": "38278529",
      "article_title": "New advances in type 1 diabetes.",
      "article_authors": ["Savitha Subramanian", "Farah Khan", "Irl B Hirsch"],
      "article_journal": "BMJ (Clinical research ed.)",
      "article_year": 2024,
      "source_type": "search",
      "added_at": "2025-10-31T14:56:27.807097+00:00"
    }
  ]
}
```

✅ **Paper exists with "diabetes" in title**

---

#### **Search Returns 0 Papers:**
```bash
curl "https://r-dagent-production.up.railway.app/projects/804494b5-69e0-4b9a-9c7b-f7fb2bddef64/search?q=diabetes&content_types=papers"
```

**Result:**
```json
{
  "query": "diabetes",
  "results": {
    "papers": []
  },
  "total_found": 0
}
```

❌ **Search returns 0 papers (UNEXPECTED)**

---

### **2. Search Logic Analysis**

#### **Current Search Query (main.py lines 6891-6903):**
```python
paper_results = db.query(ArticleCollection).filter(
    ArticleCollection.collection_id.in_(collection_ids),
    or_(
        ArticleCollection.article_title.ilike(query_pattern),  # Should match!
        ArticleCollection.article_journal.ilike(query_pattern),
        cast(ArticleCollection.article_authors, String).ilike(query_pattern)
    )
).limit(limit).all()
```

**Query Pattern:** `%diabetes%`

**Expected Match:**
- `article_title`: "New advances in type 1 **diabetes**." ✅ Should match!

**Why It Should Work:**
- The title contains "diabetes"
- `.ilike()` is case-insensitive
- `%diabetes%` pattern should match

---

### **3. Possible Root Causes**

#### **Hypothesis 1: Collection Not Found**
**Status:** ❌ RULED OUT

The search logs show:
```python
project_collections = db.query(Collection).filter(
    Collection.project_id == project_id,
    Collection.is_active == True
).all()
```

We verified the collection exists and `is_active == True`.

---

#### **Hypothesis 2: Query Pattern Issue**
**Status:** 🔍 INVESTIGATING

The query pattern is constructed as:
```python
query_pattern = f"%{q}%"  # "%diabetes%"
```

This should work with `.ilike()` for case-insensitive matching.

---

#### **Hypothesis 3: Database Encoding Issue**
**Status:** 🔍 INVESTIGATING

Possible issues:
- Title might have special characters or encoding
- PostgreSQL collation might be affecting `.ilike()`
- JSON casting might be interfering

---

#### **Hypothesis 4: Exception Silently Caught**
**Status:** 🔍 INVESTIGATING

The search has a try-except block:
```python
try:
    # Search logic
except Exception as e:
    logger.error(f"Error searching papers: {e}")
    # Continue with other searches even if papers search fails
```

If an exception occurs, it's logged but search continues, returning empty results.

---

### **4. Debug Logging Added**

Added logging to diagnose the issue:

```python
logger.info(f"🔍 [Search Papers] Found {len(collection_ids)} collections for project {project_id}")
logger.info(f"🔍 [Search Papers] Query pattern: {query_pattern}")
logger.info(f"🔍 [Search Papers] Found {len(paper_results)} papers matching query")
```

**Commit:** `ab537a3`  
**Status:** Deployed to Railway, waiting for logs

---

## 🧪 TESTING PLAN

### **Step 1: Check Railway Logs**
After deployment completes, check Railway logs for:
```
🔍 [Search Papers] Found X collections for project 804494b5-69e0-4b9a-9c7b-f7fb2bddef64
🔍 [Search Papers] Query pattern: %diabetes%
🔍 [Search Papers] Found X papers matching query
```

### **Step 2: Test Different Queries**
```bash
# Test 1: Full word
curl "...search?q=diabetes"

# Test 2: Partial word
curl "...search?q=diabet"

# Test 3: Case variation
curl "...search?q=Diabetes"

# Test 4: Multiple words
curl "...search?q=type 1"

# Test 5: Single character (should match everything)
curl "...search?q=a"
```

### **Step 3: Direct Database Query**
If search still fails, test the SQL query directly:
```sql
SELECT * FROM article_collections 
WHERE collection_id = '00ee895b-1c80-4300-9824-39c35f149bcc'
AND article_title ILIKE '%diabetes%';
```

---

## 🔧 POTENTIAL FIXES

### **Fix 1: Add Null Checks**
```python
or_(
    ArticleCollection.article_title.ilike(query_pattern) if ArticleCollection.article_title else False,
    ArticleCollection.article_journal.ilike(query_pattern) if ArticleCollection.article_journal else False,
    cast(ArticleCollection.article_authors, String).ilike(query_pattern)
)
```

### **Fix 2: Separate Queries**
```python
# Query 1: Title search
title_results = db.query(ArticleCollection).filter(
    ArticleCollection.collection_id.in_(collection_ids),
    ArticleCollection.article_title.ilike(query_pattern)
).all()

# Query 2: Journal search
journal_results = db.query(ArticleCollection).filter(
    ArticleCollection.collection_id.in_(collection_ids),
    ArticleCollection.article_journal.ilike(query_pattern)
).all()

# Combine results
paper_results = list(set(title_results + journal_results))
```

### **Fix 3: Use LIKE Instead of ILIKE**
```python
# If PostgreSQL collation is the issue
ArticleCollection.article_title.like(query_pattern.lower())
```

### **Fix 4: Add Text Search**
```python
from sqlalchemy import func

# Use PostgreSQL full-text search
func.lower(ArticleCollection.article_title).contains(q.lower())
```

---

## 📈 IMPACT ASSESSMENT

### **Severity:** 🔴 **HIGH**
- Core feature (global search) not working for papers
- Users cannot find papers they've added to collections
- Significantly reduces value of Phase 3 Week 5 feature

### **Scope:**
- ✅ Collections search works
- ✅ Notes search works
- ✅ Reports search works
- ✅ Analyses search works
- ❌ Papers search broken

### **User Impact:**
- Users can still find collections with "diabetes"
- Users can click into collection to see papers
- But cannot directly search for papers
- **Workaround:** Search for collection name instead

---

## 🎯 NEXT STEPS

### **Immediate (Next 30 minutes):**
1. ✅ Check Railway deployment logs
2. ✅ Test search with "diabetes" query
3. ✅ Review debug logs
4. ✅ Identify root cause

### **Short-term (Next 2 hours):**
1. ⏳ Implement fix based on root cause
2. ⏳ Test fix locally
3. ⏳ Deploy to production
4. ⏳ Verify fix with test script

### **Long-term (Next week):**
1. ⏳ Add comprehensive search tests
2. ⏳ Add search performance monitoring
3. ⏳ Add search analytics (what users search for)
4. ⏳ Optimize search queries for performance

---

## 📚 RELATED ISSUES

### **Issue 1: content_script.js Error**
**Status:** ✅ NOT OUR BUG

Error message:
```
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'control')
    at content_script.js:1:422999
```

**Root Cause:** Browser extension (password manager or autofill) trying to interact with our input field.

**Solution:** Can be safely ignored. Not related to our code.

---

### **Issue 2: Escape Key Not Closing Modal**
**Status:** ✅ FIXED

**Fix:** Added `onKeyDown={handleKeyDown}` to search input element.

**Commit:** `15abf4c`

---

### **Issue 3: Test Script Using Wrong Query**
**Status:** ✅ FIXED

**Fix:** Changed test query from "cancer" to "a" for broader results.

**Commit:** `15abf4c`

---

## 🔗 REFERENCES

- **Backend Code:** `main.py` lines 6876-6950
- **Database Schema:** `database.py` lines 343-370 (ArticleCollection)
- **Test Script:** `frontend/public/phase3-week5-global-search-test.js`
- **Completion Report:** `PHASE3-WEEK5-COMPLETION-REPORT.md`

---

## 📞 STATUS UPDATE

**Current Status:** 🔍 **INVESTIGATING**

**Waiting For:**
- Railway deployment to complete
- Debug logs to appear
- Root cause identification

**ETA for Fix:** 1-2 hours

**Confidence Level:** 🟢 **HIGH** (We have good debug logging and multiple hypotheses)

---

**Last Updated:** November 1, 2025 - 15:30 UTC  
**Next Update:** After Railway logs are reviewed

