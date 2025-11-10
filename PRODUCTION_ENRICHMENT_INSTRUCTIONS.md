# 🚀 Production Database Enrichment Instructions

**Date:** 2025-11-10  
**Purpose:** Enrich existing articles in production database with DOI and metadata

---

## 📋 Overview

The fix has been deployed to production (Railway auto-deploy from commit 682dc5f).

**What's Fixed:**
- ✅ New articles added to collections will have DOI
- ⏳ Existing articles in production need to be enriched

**What Needs to Be Done:**
- Run enrichment script on production database
- Verify all articles have DOI
- Test PDF viewer for papers in collections

---

## 🔧 Option 1: Run Enrichment Script Locally (Recommended)

### **Step 1: Set Production Database URL**

```bash
# Get production database URL from Railway
# Go to: https://railway.app/project/r-dagent-production
# Click on "Postgres" service
# Copy "DATABASE_URL" from Variables tab

export DATABASE_URL="postgresql://user:password@host:port/database"
```

### **Step 2: Modify enrich_existing_articles.py**

Add support for production database:

```python
# At the top of enrich_existing_articles.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_production_db():
    """Get production database session"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Railway uses postgres:// but SQLAlchemy needs postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()
```

### **Step 3: Run Dry Run First**

```bash
# Test on production (dry run)
python3 enrich_existing_articles.py --dry-run
```

### **Step 4: Run Actual Enrichment**

```bash
# Enrich production database
python3 enrich_existing_articles.py
```

---

## 🔧 Option 2: Run on Railway (Advanced)

### **Step 1: SSH into Railway Container**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# SSH into container
railway run bash
```

### **Step 2: Run Enrichment Script**

```bash
# Inside Railway container
cd /app
python3 enrich_existing_articles.py --dry-run
python3 enrich_existing_articles.py
```

---

## 🔧 Option 3: Add as Railway Cron Job (Best for Production)

### **Step 1: Create Cron Endpoint**

Add to `main.py`:

```python
@app.post("/admin/enrich-articles")
async def enrich_articles_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Admin endpoint to enrich articles with missing DOI"""
    # Add authentication check
    admin_key = request.headers.get("X-Admin-Key")
    if admin_key != os.getenv("ADMIN_KEY"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    from pdf_endpoints import fetch_article_metadata_from_pubmed
    
    # Find articles without DOI
    articles = db.query(Article).filter(
        (Article.doi == None) | (Article.doi == "")
    ).all()
    
    enriched = 0
    failed = 0
    
    for article in articles:
        try:
            metadata = await fetch_article_metadata_from_pubmed(article.pmid)
            article.doi = metadata.get("doi", "")
            article.abstract = metadata.get("abstract", article.abstract)
            article.updated_at = datetime.utcnow()
            db.commit()
            enriched += 1
        except Exception as e:
            logger.error(f"Failed to enrich {article.pmid}: {e}")
            failed += 1
            continue
    
    return {
        "success": True,
        "enriched": enriched,
        "failed": failed,
        "total": len(articles)
    }
```

### **Step 2: Call Endpoint**

```bash
# Set admin key in Railway environment variables
# Then call endpoint:

curl -X POST "https://r-dagent-production.up.railway.app/admin/enrich-articles" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

---

## 🧪 Verification

### **Step 1: Check Article Count**

```bash
# Check how many articles need enrichment
curl "https://r-dagent-production.up.railway.app/admin/articles-without-doi" \
  -H "User-ID: fredericle75019@gmail.com"
```

### **Step 2: Test PDF Viewer**

1. Go to Jules Baba project: https://frontend-psi-seven-85.vercel.app/project/{PROJECT_ID}
2. Open "Baba collection"
3. Click on any paper
4. PDF should load immediately
5. Check browser console - should see: `✅ Found DOI in database: 10.1136/...`

### **Step 3: Test Annotations**

1. Add annotation to paper
2. Close PDF viewer
3. Reopen paper
4. Annotations should still be there

---

## 📊 Expected Results

### **Before Enrichment:**
```
📊 Articles in production database: ~50-100
❌ Articles without DOI: ~30-60 (60%)
✅ Articles with DOI: ~20-40 (40%)
```

### **After Enrichment:**
```
📊 Articles in production database: ~50-100
❌ Articles without DOI: 0 (0%)
✅ Articles with DOI: ~50-100 (100%)
```

---

## 🚨 Important Notes

1. **Rate Limiting:** PubMed allows 3 requests/second. The script includes 0.4s delay between requests.

2. **Timeout:** For 100 articles, expect ~40 seconds runtime (0.4s × 100).

3. **Failures:** Some PMIDs may not have DOI in PubMed. This is normal. The script will skip them.

4. **Backup:** Railway automatically backs up the database. No manual backup needed.

5. **Rollback:** If something goes wrong, the script only updates DOI and abstract fields. No data is deleted.

---

## 🎯 Recommended Approach

**For immediate fix:**
1. Use Option 1 (run locally with production DATABASE_URL)
2. Run dry-run first to verify
3. Run actual enrichment
4. Verify in production

**For long-term maintenance:**
1. Implement Option 3 (admin endpoint)
2. Set up monitoring to alert when articles without DOI > 10
3. Run enrichment endpoint weekly via cron job

---

## 📝 Next Steps

1. ✅ Backend fix deployed (commit 682dc5f)
2. ⏳ Run enrichment on production database
3. ⏳ Verify PDF viewer works for all papers
4. ⏳ Test annotations persist correctly
5. ⏳ Monitor for new articles without DOI

---

## 🆘 Troubleshooting

### **Issue: "No module named 'database'"**
**Solution:** Make sure you're in the project root directory

### **Issue: "DATABASE_URL not set"**
**Solution:** Export DATABASE_URL environment variable

### **Issue: "Connection refused"**
**Solution:** Check Railway database is running and URL is correct

### **Issue: "Rate limit exceeded"**
**Solution:** Increase delay between requests (change 0.4 to 1.0)

### **Issue: "Some articles still without DOI"**
**Solution:** Normal - some PMIDs don't have DOI in PubMed. Check manually.

---

## ✅ Success Criteria

1. ✅ All articles in production have DOI (or confirmed no DOI in PubMed)
2. ✅ PDF viewer works for all papers in collections
3. ✅ No PubMed scraping on PDF open
4. ✅ Annotations persist correctly
5. ✅ Performance improved (instant PDF loading)

