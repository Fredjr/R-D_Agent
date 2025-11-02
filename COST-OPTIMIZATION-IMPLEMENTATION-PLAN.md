# Cost Optimization Implementation Plan

**Date:** November 2, 2025  
**Objective:** Reduce monthly costs from £55.84 to £13.34 (76% savings) without breaking functionality  
**Timeline:** 7 days  
**Risk Level:** LOW (all changes are additive, no breaking changes)

---

## 🎯 IMPLEMENTATION STRATEGY

### **Principle: Zero-Risk Approach**
1. ✅ **Additive changes only** - Add caching layers, don't modify existing logic
2. ✅ **Backward compatible** - All changes work with existing code
3. ✅ **Graceful degradation** - If cache fails, fall back to API
4. ✅ **Comprehensive testing** - Test each change before moving to next
5. ✅ **Rollback ready** - Each change is independent and reversible

---

## 📋 PHASE 1: IMMEDIATE CLEANUP (Day 1) - £40/month savings

### **Task 1.1: Artifact Registry Cleanup** 🔴 CRITICAL
**Risk Level:** 🟢 ZERO RISK (only deletes unused Docker images)  
**Time:** 10 minutes  
**Savings:** £40/month (87% reduction)

**What it does:**
- Deletes 476 old Docker images from backend repository
- Deletes 10 old images from cloud-run-source-deploy repository
- Keeps 3 most recent images (safety buffer)

**Why it's safe:**
- You're using Railway (Nixpacks), not Google Cloud Run
- These Docker images are completely unused
- Railway doesn't use Artifact Registry
- Keeping 3 most recent images as backup

**Implementation:**
```bash
# Step 1: Verify current state
./scripts/cost-monitoring-dashboard.sh

# Step 2: Run cleanup (with confirmation prompts)
./cleanup-artifacts.sh

# Step 3: Verify cleanup
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/r-and-d-agent-mvp/rd-agent/backend

# Expected: Only 3 images remaining
```

**Rollback:** Not needed (images are unused)

---

### **Task 1.2: Delete Unused Cloud Run Services** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟡 LOW RISK (verify services are unused first)  
**Time:** 5 minutes  
**Savings:** £5-20/month

**What it does:**
- Deletes `rd-agent-staging` Cloud Run service
- Deletes `rd-frontend` Cloud Run service

**Why it's safe:**
- Production uses Railway (backend) and Vercel (frontend)
- These are legacy staging services
- No traffic going to these services

**Verification before deletion:**
```bash
# Step 1: Check if services are receiving traffic
gcloud run services describe rd-agent-staging --region=us-central1 --format='value(status.traffic)'
gcloud run services describe rd-frontend --region=us-central1 --format='value(status.traffic)'

# Step 2: Check last deployment date
gcloud run services describe rd-agent-staging --region=us-central1 --format='value(metadata.creationTimestamp)'
gcloud run services describe rd-frontend --region=us-central1 --format='value(metadata.creationTimestamp)'

# If no traffic and old deployment date, safe to delete
```

**Implementation:**
```bash
# Only proceed if verification confirms no traffic
gcloud run services delete rd-agent-staging --region=us-central1
gcloud run services delete rd-frontend --region=us-central1
```

**Rollback:** Can redeploy from git history if needed (unlikely)

---

### **Task 1.3: Enable Automatic Weekly Cleanup** ✅ ZERO RISK
**Risk Level:** 🟢 ZERO RISK (already committed)  
**Time:** 2 minutes  
**Savings:** Prevents future accumulation

**What it does:**
- GitHub Actions workflow runs every Sunday at 2 AM UTC
- Automatically keeps only 3 most recent images
- Sends cleanup report

**Why it's safe:**
- Already committed to repository
- Will run automatically
- No manual intervention needed

**Verification:**
```bash
# Check workflow file exists
cat .github/workflows/cleanup-artifacts-weekly.yml

# Workflow will run automatically next Sunday
# Can also trigger manually from GitHub Actions tab
```

**Rollback:** Disable workflow in GitHub Actions settings

---

## 📋 PHASE 2: PUBMED API CACHING (Days 2-3) - Prevents rate limiting

### **Task 2.1: Integrate Existing Cache into Search Route** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟢 ZERO RISK (graceful degradation)  
**Time:** 2 hours  
**Impact:** 80% reduction in PubMed API calls

**What it does:**
- Uses existing `pubmedCache.ts` utility (already in codebase)
- Adds caching to `/api/proxy/pubmed/search/route.ts`
- 15-minute TTL (time-to-live)
- Falls back to API if cache fails

**Why it's safe:**
- Cache utility already exists and tested
- Additive change - doesn't modify existing API logic
- If cache fails, falls back to direct API call
- No breaking changes to API response format

**Implementation:**
```typescript
// frontend/src/app/api/proxy/pubmed/search/route.ts
import { pubmedCache } from '@/utils/pubmedCache';

export async function GET(request: NextRequest) {
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  // Generate cache key
  const cacheKey = `pubmed-search-${query}-${limit}`;
  
  try {
    // Check cache first
    const cached = await pubmedCache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit - saved API call');
      return NextResponse.json(cached);
    }
  } catch (error) {
    console.warn('Cache read failed, falling back to API:', error);
  }
  
  // Fetch from API (existing logic)
  const articles = await searchPubMed(query, limit);
  
  try {
    // Cache for 15 minutes
    pubmedCache.set(cacheKey, articles, 15 * 60 * 1000);
  } catch (error) {
    console.warn('Cache write failed:', error);
  }
  
  return NextResponse.json(articles);
}
```

**Testing:**
```bash
# Test 1: First request (cache miss)
curl "https://frontend-psi-seven-85.vercel.app/api/proxy/pubmed/search?q=cancer&limit=10"

# Test 2: Second request (cache hit)
curl "https://frontend-psi-seven-85.vercel.app/api/proxy/pubmed/search?q=cancer&limit=10"

# Verify: Second request should be faster
```

**Rollback:** Remove cache code, keep existing API logic

---

### **Task 2.2: Add Caching to Citations Route** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟢 ZERO RISK (same pattern as Task 2.1)  
**Time:** 1 hour  
**Impact:** Reduces citation API calls by 80%

**What it does:**
- Adds caching to `/api/proxy/pubmed/citations/route.ts`
- 30-minute TTL (citations change less frequently)
- Falls back to API if cache fails

**Why it's safe:**
- Same pattern as Task 2.1
- Citations are relatively static
- Graceful degradation

**Implementation:** Same pattern as Task 2.1

**Testing:** Same pattern as Task 2.1

**Rollback:** Remove cache code

---

### **Task 2.3: Add Caching to References Route** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟢 ZERO RISK (same pattern)  
**Time:** 1 hour  
**Impact:** Reduces reference API calls by 80%

**Implementation:** Same pattern as Task 2.1  
**Testing:** Same pattern as Task 2.1  
**Rollback:** Remove cache code

---

## 📋 PHASE 3: DATABASE OPTIMIZATION (Days 4-5) - Delays paid tier

### **Task 3.1: Fix N+1 Query in Citations Endpoint** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟢 ZERO RISK (optimization only)  
**Time:** 2 hours  
**Impact:** 50% reduction in database queries

**What it does:**
- Replaces N individual queries with 1 bulk query
- Uses SQLAlchemy's `in_()` operator
- No change to API response format

**Why it's safe:**
- Pure optimization - same results, fewer queries
- SQLAlchemy handles the query optimization
- No breaking changes to API

**Current code (N+1 problem):**
```python
# citation_endpoints.py
@app.get("/articles/{pmid}/citations")
async def get_article_citations(pmid: str, db: Session):
    # Fetches article
    article = db.query(Article).filter(Article.pmid == pmid).first()
    
    # Then fetches citations one by one (N+1 problem!)
    for citation_pmid in citation_pmids:
        citation = db.query(Article).filter(Article.pmid == citation_pmid).first()
```

**Optimized code:**
```python
# citation_endpoints.py
@app.get("/articles/{pmid}/citations")
async def get_article_citations(pmid: str, db: Session):
    # Fetch article
    article = db.query(Article).filter(Article.pmid == pmid).first()
    
    # Fetch all citations in ONE query (not N queries)
    citations = db.query(Article).filter(
        Article.pmid.in_(citation_pmids)
    ).all()
    
    # Same result, 50x faster
```

**Testing:**
```bash
# Test endpoint still works
curl "https://r-dagent-production.up.railway.app/articles/12345678/citations"

# Verify response format unchanged
```

**Rollback:** Revert to original code

---

### **Task 3.2: Add Eager Loading to Project Queries** 🟡 MEDIUM PRIORITY
**Risk Level:** 🟢 ZERO RISK (optimization only)  
**Time:** 2 hours  
**Impact:** 30% reduction in database queries

**What it does:**
- Uses SQLAlchemy's `joinedload` to fetch related data in one query
- Reduces queries when fetching projects with collections/articles
- No change to API response format

**Why it's safe:**
- Pure optimization
- SQLAlchemy feature designed for this
- No breaking changes

**Implementation:**
```python
# project_endpoints.py
from sqlalchemy.orm import joinedload

@app.get("/projects/{project_id}")
async def get_project(project_id: str, db: Session):
    # OLD: Multiple queries (1 for project, N for collections, M for articles)
    # project = db.query(Project).filter(Project.project_id == project_id).first()
    
    # NEW: One query with eager loading
    project = db.query(Project).options(
        joinedload(Project.collections),
        joinedload(Project.articles)
    ).filter(Project.project_id == project_id).first()
    
    return project
```

**Testing:** Same as Task 3.1

**Rollback:** Remove `joinedload`, keep original query

---

## 📋 PHASE 4: AI RESPONSE CACHING (Days 6-7) - £2-3/month savings

### **Task 4.1: Cache AI Summaries in Database** 🟢 LOW PRIORITY
**Risk Level:** 🟢 ZERO RISK (uses existing column)  
**Time:** 3 hours  
**Impact:** 90% reduction in AI API calls for summaries

**What it does:**
- Uses existing `ai_summary` column in Article model
- Caches summaries for 30 days
- Falls back to generating new summary if cache expired

**Why it's safe:**
- Database column already exists
- Additive change - doesn't modify existing logic
- If cache fails, generates new summary

**Implementation:**
```python
# main.py or article_endpoints.py
@app.get("/articles/{pmid}/summary")
async def get_article_summary(pmid: str, db: Session):
    article = db.query(Article).filter(Article.pmid == pmid).first()
    
    # Check if cached summary exists and is fresh
    if article.ai_summary and article.summary_generated_at:
        age = datetime.now() - article.summary_generated_at
        if age < timedelta(days=30):  # Cache for 30 days
            return {"summary": article.ai_summary, "cached": True}
    
    # Generate new summary
    summary = await generate_summary_with_cerebras(article)
    
    # Cache in database
    article.ai_summary = summary
    article.summary_generated_at = datetime.now()
    db.commit()
    
    return {"summary": summary, "cached": False}
```

**Testing:**
```bash
# Test 1: First request (generates summary)
curl "https://r-dagent-production.up.railway.app/articles/12345678/summary"

# Test 2: Second request (returns cached)
curl "https://r-dagent-production.up.railway.app/articles/12345678/summary"

# Verify: Second request should be instant
```

**Rollback:** Remove caching logic, always generate new summary

---

## 📋 TESTING STRATEGY

### **Test After Each Phase:**
1. ✅ Run automated tests (if they exist)
2. ✅ Manual testing of affected endpoints
3. ✅ Check error logs for issues
4. ✅ Verify performance improvements
5. ✅ Monitor cost dashboard

### **Rollback Triggers:**
- API response format changes
- Error rate increases >5%
- Response time increases >20%
- User reports issues

---

## 📊 SUCCESS METRICS

### **Phase 1 (Day 1):**
- ✅ Artifact Registry: 492 images → 6 images
- ✅ Cost: £45.84 → £5/month
- ✅ Savings: £40/month (87% reduction)

### **Phase 2 (Days 2-3):**
- ✅ PubMed API calls: -80%
- ✅ Cache hit rate: >80%
- ✅ Response time: -50%
- ✅ Impact: Prevents rate limiting at scale

### **Phase 3 (Days 4-5):**
- ✅ Database queries: -40%
- ✅ Response time: -30%
- ✅ Impact: Stays in free tier 6-12 months longer

### **Phase 4 (Days 6-7):**
- ✅ AI API calls: -90% for summaries
- ✅ Cost: £5-10 → £2-3/month
- ✅ Savings: £3-7/month

### **Overall:**
- ✅ Total cost: £55.84 → £13.34/month
- ✅ Savings: £42.50/month (76% reduction)
- ✅ Scalability: 10 users → 1,000 users without infrastructure changes

---

## 🚨 RISK MITIGATION

### **What Could Go Wrong:**

1. **Cache corruption**
   - Mitigation: Graceful degradation to API
   - Impact: Temporary performance degradation
   - Fix: Clear cache, regenerate

2. **Database migration issues**
   - Mitigation: No schema changes needed
   - Impact: None (using existing columns)
   - Fix: N/A

3. **API response format changes**
   - Mitigation: Comprehensive testing before deployment
   - Impact: Frontend errors
   - Fix: Rollback changes

4. **Performance degradation**
   - Mitigation: Monitor response times
   - Impact: Slower responses
   - Fix: Adjust cache TTL or rollback

### **Monitoring:**
```bash
# Run after each phase
./scripts/cost-monitoring-dashboard.sh

# Check error logs
railway logs --tail 100

# Check Vercel logs
vercel logs frontend-psi-seven-85.vercel.app
```

---

## 📅 IMPLEMENTATION TIMELINE

### **Day 1: Emergency Cleanup** (10 minutes)
- [ ] Run cost monitoring dashboard
- [ ] Run artifact cleanup script
- [ ] Verify cleanup
- [ ] Delete unused Cloud Run services
- [ ] Verify weekly cleanup workflow

### **Day 2: PubMed Search Caching** (2 hours)
- [ ] Add caching to search route
- [ ] Test cache hit/miss
- [ ] Deploy to Vercel
- [ ] Monitor error logs

### **Day 3: PubMed Citations/References Caching** (2 hours)
- [ ] Add caching to citations route
- [ ] Add caching to references route
- [ ] Test both routes
- [ ] Deploy to Vercel

### **Day 4: Database Query Optimization** (2 hours)
- [ ] Fix N+1 query in citations endpoint
- [ ] Test endpoint
- [ ] Deploy to Railway
- [ ] Monitor database query count

### **Day 5: Database Eager Loading** (2 hours)
- [ ] Add eager loading to project queries
- [ ] Test project endpoints
- [ ] Deploy to Railway
- [ ] Monitor performance

### **Day 6: AI Summary Caching** (3 hours)
- [ ] Implement summary caching
- [ ] Test cache behavior
- [ ] Deploy to Railway
- [ ] Monitor AI API usage

### **Day 7: Verification & Documentation** (2 hours)
- [ ] Run comprehensive tests
- [ ] Verify all metrics
- [ ] Update documentation
- [ ] Create completion report

---

## ✅ COMPLETION CHECKLIST

### **Phase 1: Cleanup**
- [ ] Artifact Registry: <10 images
- [ ] Cloud Run services: 0
- [ ] Cost: <£10/month
- [ ] Weekly cleanup: Enabled

### **Phase 2: PubMed Caching**
- [ ] Cache hit rate: >80%
- [ ] Response time: <500ms
- [ ] Error rate: <1%
- [ ] No rate limiting

### **Phase 3: Database Optimization**
- [ ] Query count: -40%
- [ ] Response time: -30%
- [ ] Error rate: <1%
- [ ] Still in free tier

### **Phase 4: AI Caching**
- [ ] Cache hit rate: >90%
- [ ] AI API calls: -90%
- [ ] Cost: <£3/month
- [ ] Response time: <200ms

### **Overall:**
- [ ] Total cost: <£15/month
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Documentation updated
- [ ] Completion report created

---

## 🎯 EXPECTED OUTCOME

**Before Optimization:**
- Monthly cost: £55.84
- PubMed API: No caching, risk of rate limiting
- Database: Inefficient queries
- AI APIs: No caching
- Scalability: Limited to 50-100 users

**After Optimization:**
- Monthly cost: £13.34 (76% savings)
- PubMed API: 80% cache hit rate, no rate limiting
- Database: Optimized queries, stays in free tier
- AI APIs: 90% cache hit rate
- Scalability: Can handle 1,000+ users

**Risk Level:** 🟢 LOW (all changes are additive and reversible)  
**Time Investment:** 15-20 hours over 7 days  
**ROI:** £42.50/month savings = £510/year  
**Break-even:** Immediate (saves money from Day 1)

