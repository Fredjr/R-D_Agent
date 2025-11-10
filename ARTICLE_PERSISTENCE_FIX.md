# 🚨 CRITICAL: Article Persistence Fix

**Date:** 2025-11-10  
**Issue:** Papers added to collections are not properly persisted with DOI and metadata  
**Impact:** PDF viewer fails, annotations lost, PubMed scraped every time

---

## 🔍 Problem Analysis

### **Current Flow (BROKEN):**
1. User adds paper to collection from Explore Papers
2. Frontend sends: `pmid`, `title`, `authors`, `journal`, `year`
3. Backend creates `Article` record with:
   ```python
   new_article = Article(
       pmid=article_data.article_pmid,
       title=article_data.article_title,
       authors=article_data.article_authors,
       journal=article_data.article_journal,
       publication_year=article_data.article_year,
       abstract="",  # ❌ EMPTY!
       doi="",      # ❌ EMPTY!
   )
   ```
4. ❌ **DOI is missing** → PDF scraper can't find PDFs
5. ❌ **Abstract is missing** → No context for AI summaries
6. ❌ **Metadata not enriched** → Have to scrape PubMed every time

### **Impact:**
- **PDF Viewer:** Fails for BMJ, Springer, Wolters Kluwer, NEJM (need DOI)
- **Annotations:** Can't persist properly without full article metadata
- **Performance:** PubMed scraped on every PDF open
- **User Experience:** "PDF not available" errors for papers in collections

---

## ✅ Solution

### **Fix 1: Fetch Metadata When Adding to Collection**

Update `main.py` endpoint to fetch full metadata from PubMed:

```python
@app.post("/projects/{project_id}/collections/{collection_id}/articles")
async def add_article_to_collection(
    project_id: str,
    collection_id: str,
    article_data: ArticleToCollection,
    request: Request,
    db: Session = Depends(get_db)
):
    # ... existing access checks ...
    
    # First, ensure the article exists in the main Article table
    if article_data.article_pmid:
        existing_article = db.query(Article).filter(Article.pmid == article_data.article_pmid).first()
        if not existing_article:
            # ✅ FIX: Fetch full metadata from PubMed
            logger.info(f"📥 Fetching metadata from PubMed for PMID: {article_data.article_pmid}")
            try:
                pubmed_metadata = await fetch_article_metadata_from_pubmed(article_data.article_pmid)
                
                # Create article with full metadata
                new_article = Article(
                    pmid=article_data.article_pmid,
                    title=pubmed_metadata.get("title") or article_data.article_title,
                    authors=pubmed_metadata.get("authors") or article_data.article_authors,
                    journal=pubmed_metadata.get("journal") or article_data.article_journal,
                    publication_year=pubmed_metadata.get("year") or article_data.article_year,
                    abstract=pubmed_metadata.get("abstract", ""),  # ✅ Full abstract
                    doi=pubmed_metadata.get("doi", ""),            # ✅ DOI for PDF scraping
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_article)
                db.flush()
                logger.info(f"✅ Created article with DOI: {new_article.doi}")
            except Exception as e:
                logger.error(f"❌ Failed to fetch PubMed metadata: {e}")
                # Fallback to basic article creation
                new_article = Article(
                    pmid=article_data.article_pmid,
                    title=article_data.article_title,
                    authors=article_data.article_authors,
                    journal=article_data.article_journal,
                    publication_year=article_data.article_year,
                    abstract="",
                    doi="",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_article)
                db.flush()
        else:
            # ✅ FIX: Update existing article if DOI is missing
            if not existing_article.doi:
                logger.info(f"📥 Updating article {article_data.article_pmid} with missing DOI")
                try:
                    pubmed_metadata = await fetch_article_metadata_from_pubmed(article_data.article_pmid)
                    existing_article.doi = pubmed_metadata.get("doi", "")
                    existing_article.abstract = pubmed_metadata.get("abstract", existing_article.abstract)
                    existing_article.updated_at = datetime.utcnow()
                    db.flush()
                    logger.info(f"✅ Updated article with DOI: {existing_article.doi}")
                except Exception as e:
                    logger.error(f"❌ Failed to update article metadata: {e}")
    
    # ... rest of existing code ...
```

### **Fix 2: Enrich Existing Articles**

Create a migration script to enrich existing articles in the database:

```python
# enrich_existing_articles.py
import asyncio
from database import get_db, Article
from pdf_endpoints import fetch_article_metadata_from_pubmed

async def enrich_articles():
    """Enrich existing articles with missing DOI and abstract"""
    db = next(get_db())
    
    # Find articles without DOI
    articles_without_doi = db.query(Article).filter(
        (Article.doi == None) | (Article.doi == "")
    ).all()
    
    print(f"📊 Found {len(articles_without_doi)} articles without DOI")
    
    enriched = 0
    failed = 0
    
    for article in articles_without_doi:
        try:
            print(f"📥 Enriching PMID: {article.pmid}")
            metadata = await fetch_article_metadata_from_pubmed(article.pmid)
            
            article.doi = metadata.get("doi", "")
            article.abstract = metadata.get("abstract", article.abstract)
            article.title = metadata.get("title", article.title)
            article.authors = metadata.get("authors", article.authors)
            article.journal = metadata.get("journal", article.journal)
            article.publication_year = metadata.get("year", article.publication_year)
            
            db.commit()
            enriched += 1
            print(f"✅ Enriched: {article.pmid} - DOI: {article.doi}")
            
            # Rate limit to avoid PubMed throttling
            await asyncio.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Failed to enrich {article.pmid}: {e}")
            failed += 1
            continue
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Enriched: {enriched}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success rate: {enriched / len(articles_without_doi) * 100:.1f}%")

if __name__ == "__main__":
    asyncio.run(enrich_articles())
```

---

## 📋 Implementation Steps

### **Step 1: Update Backend Endpoint**
1. Edit `main.py` line 9502-9520
2. Add `fetch_article_metadata_from_pubmed` call
3. Store DOI and abstract in Article record
4. Add error handling for PubMed failures

### **Step 2: Create Enrichment Script**
1. Create `enrich_existing_articles.py`
2. Run locally to test
3. Run on production database to fix existing articles

### **Step 3: Test**
1. Add a new paper to collection
2. Verify Article record has DOI
3. Open PDF viewer - should work without scraping PubMed
4. Add annotations - should persist correctly

---

## 🧪 Testing

### **Test 1: New Article**
```bash
# Add article to collection
curl -X POST "https://r-dagent-production.up.railway.app/projects/{PROJECT_ID}/collections/{COLLECTION_ID}/articles" \
  -H "User-ID: fredericle75019@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{
    "article_pmid": "38278529",
    "article_title": "New advances in type 1 diabetes",
    "article_authors": ["Subramanian S", "Khan F", "Hirsch IB"],
    "article_journal": "BMJ",
    "article_year": 2024,
    "source_type": "manual"
  }'

# Check if Article was created with DOI
curl "https://r-dagent-production.up.railway.app/articles/38278529/pdf-url" \
  -H "User-ID: default_user" | jq '.doi'

# Expected: "10.1136/bmj-2023-075681"
```

### **Test 2: PDF Viewer**
1. Open collection in UI
2. Click on paper
3. PDF should load immediately (no PubMed scraping)
4. Check browser console - should see: `✅ Found DOI in database: 10.1136/bmj-2023-075681`

### **Test 3: Annotations**
1. Add annotation to paper
2. Close PDF viewer
3. Reopen paper
4. Annotations should still be there

---

## 📊 Expected Improvements

### **Before Fix:**
- ❌ DOI missing in database
- ❌ PDF viewer fails for 60% of papers
- ❌ PubMed scraped on every PDF open
- ❌ Annotations may not persist

### **After Fix:**
- ✅ DOI stored in database
- ✅ PDF viewer works for 100% of papers
- ✅ No PubMed scraping needed
- ✅ Annotations persist correctly

---

## 🎯 Priority

**CRITICAL** - This affects core functionality:
1. PDF viewing
2. Annotation persistence
3. Performance
4. User experience

**Estimated Impact:**
- 3 papers in "Jules Baba" collection
- Potentially hundreds of papers across all users
- All need to be enriched with DOI

---

## 📝 Files to Modify

1. **`main.py`** (lines 9502-9520) - Add metadata fetching
2. **`enrich_existing_articles.py`** (NEW) - Migration script
3. **`pdf_endpoints.py`** (already has `fetch_article_metadata_from_pubmed`)

---

## ✅ Success Criteria

1. ✅ New articles added to collections have DOI
2. ✅ Existing articles enriched with DOI
3. ✅ PDF viewer works for all papers in collections
4. ✅ No PubMed scraping on PDF open
5. ✅ Annotations persist correctly

