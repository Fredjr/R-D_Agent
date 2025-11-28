# Migration Strategy - Erythos Restructuring

**Date**: 2025-11-28  
**Status**: Implementation Planning  
**Approach**: Phased rollout with feature flags (zero downtime)

---

## 🎯 **Migration Goals**

1. ✅ **Zero Downtime** - No service interruption during migration
2. ✅ **Zero Data Loss** - All existing data preserved
3. ✅ **Backward Compatibility** - Old endpoints continue to work
4. ✅ **Gradual Rollout** - Enable features incrementally
5. ✅ **Easy Rollback** - Ability to revert if issues arise

---

## 📊 **Migration Approach: Phased Rollout with Feature Flags**

### **Why Feature Flags?**

- ✅ Deploy code without enabling features
- ✅ Enable features for specific users (internal testing)
- ✅ Gradual rollout to all users
- ✅ Easy rollback (just toggle flag)
- ✅ A/B testing capability

### **Feature Flag Strategy**

```bash
# Environment variables (Railway)
ENABLE_NEW_HOME_PAGE=false           # Phase 1: Low risk
ENABLE_NEW_COLLECTIONS_PAGE=false    # Phase 2: Low risk
ENABLE_NEW_PROJECT_WORKSPACE=false   # Phase 3: Medium risk
ENABLE_NEW_LAB_PAGE=false            # Phase 4: Medium risk
ENABLE_NEW_DISCOVER_PAGE=false       # Phase 5: High risk
ENABLE_GLOBAL_TRIAGE=false           # Phase 5: High risk (critical)
ENABLE_ERYTHOS_THEME=false           # Phase 0: Visual only
```

---

## 🗓️ **Migration Timeline**

### **Phase 0: Preparation (Week 1-2)**

**Goals**: Set up infrastructure, no user-facing changes

**Tasks**:
1. ✅ Create database migrations (Alembic)
2. ✅ Backup production database
3. ✅ Run migrations on staging
4. ✅ Verify migrations successful
5. ✅ Deploy backend with new endpoints (disabled)
6. ✅ Deploy frontend with new pages (disabled)
7. ✅ Set all feature flags to `false`

**Rollout**: Internal only (developers)

**Rollback**: N/A (no changes visible to users)

---

### **Phase 1: Home Page (Week 5)**

**Goals**: Enable simplified home page

**Tasks**:
1. ✅ Enable `ENABLE_NEW_HOME_PAGE=true`
2. ✅ Monitor error rates
3. ✅ Collect user feedback
4. ✅ Fix any issues

**Rollout**:
- Day 1: Internal testing (developers)
- Day 2: Beta users (5-10 users)
- Day 3: All users

**Rollback**: Set `ENABLE_NEW_HOME_PAGE=false`

**Risk**: Low (home page is mostly visual)

---

### **Phase 2: Collections Page (Week 6)**

**Goals**: Enable simplified collections page

**Tasks**:
1. ✅ Enable `ENABLE_NEW_COLLECTIONS_PAGE=true`
2. ✅ Monitor API response times
3. ✅ Verify note counts are correct
4. ✅ Fix any issues

**Rollout**:
- Day 1: Internal testing
- Day 2: Beta users
- Day 3: All users

**Rollback**: Set `ENABLE_NEW_COLLECTIONS_PAGE=false`

**Risk**: Low (mostly visual changes)

---

### **Phase 3: Project Workspace (Week 10-11)**

**Goals**: Enable simplified project workspace with 7 flat tabs

**Tasks**:
1. ✅ Enable `ENABLE_NEW_PROJECT_WORKSPACE=true`
2. ✅ Monitor API response times (project detail endpoint)
3. ✅ Verify all counts are correct (papers, collections, notes, reports, experiments)
4. ✅ Test all 7 tabs
5. ✅ Fix any issues

**Rollout**:
- Day 1-2: Internal testing
- Day 3-4: Beta users
- Day 5: All users

**Rollback**: Set `ENABLE_NEW_PROJECT_WORKSPACE=false`

**Risk**: Medium (significant UI changes, but no data changes)

---

### **Phase 4: Lab Page (Week 12-13)**

**Goals**: Enable global lab page

**Tasks**:
1. ✅ Enable `ENABLE_NEW_LAB_PAGE=true`
2. ✅ Monitor API response times (protocols, experiments, files)
3. ✅ Test project filter
4. ✅ Test file upload/download
5. ✅ Fix any issues

**Rollout**:
- Day 1-2: Internal testing
- Day 3-4: Beta users
- Day 5: All users

**Rollback**: Set `ENABLE_NEW_LAB_PAGE=false`

**Risk**: Medium (new file management feature)

---

### **Phase 5: Discover Page + Global Triage (Week 7-9)**

**Goals**: Enable unified discover page with global AI triage

**Tasks**:
1. ✅ Enable `ENABLE_NEW_DISCOVER_PAGE=true`
2. ✅ Enable `ENABLE_GLOBAL_TRIAGE=true`
3. ✅ Monitor API response times (triage endpoint)
4. ✅ Monitor database performance (scanning all collections)
5. ✅ Test Smart Inbox (global)
6. ✅ Test Explore tab (hypothesis cascade)
7. ✅ Test All Papers tab (search + AI summary)
8. ✅ Fix any issues

**Rollout**:
- Day 1-3: Internal testing (critical testing phase)
- Day 4-5: Beta users (5-10 users)
- Day 6-7: 25% of users (gradual rollout)
- Day 8-9: 50% of users
- Day 10: All users

**Rollback**: 
- Set `ENABLE_NEW_DISCOVER_PAGE=false`
- Set `ENABLE_GLOBAL_TRIAGE=false`

**Risk**: High (critical feature, performance-sensitive)

---

## 🗄️ **Database Migration Strategy**

### **1. Backup Strategy**

**Before any migration**:
```bash
# Full database backup
pg_dump -h production-db -U user -d rdagent > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_$(date +%Y%m%d_%H%M%S).sql

# Store backup in secure location
aws s3 cp backup_$(date +%Y%m%d_%H%M%S).sql s3://rdagent-backups/
```

### **2. Migration Execution**

**Use Alembic for versioned migrations**:
```bash
# Create migration
alembic revision --autogenerate -m "Add collection_id to paper_triage"

# Review migration file
cat alembic/versions/xxx_add_collection_id_to_paper_triage.py

# Test on staging
alembic upgrade head

# Verify on staging
psql -h staging-db -U user -d rdagent -c "\d paper_triage"

# Run on production
alembic upgrade head

# Verify on production
psql -h production-db -U user -d rdagent -c "\d paper_triage"
```

### **3. Data Backfill Strategy**

**For `PaperTriage.collection_id`**:

```python
# Backfill script: backfill_triage_collection_id.py
from database import SessionLocal, PaperTriage, Collection, ProjectCollection

db = SessionLocal()

# Get all triages without collection_id
triages = db.query(PaperTriage).filter(PaperTriage.collection_id == None).all()

for triage in triages:
    # Find collection linked to this project
    project_collection = db.query(ProjectCollection).filter(
        ProjectCollection.project_id == triage.project_id
    ).first()
    
    if project_collection:
        triage.collection_id = project_collection.collection_id
        print(f"Backfilled triage {triage.triage_id} with collection {project_collection.collection_id}")

db.commit()
print(f"Backfilled {len(triages)} triages")
```

**For `Collection.note_count`**:

```python
# Backfill script: backfill_collection_note_count.py
from database import SessionLocal, Collection, Annotation

db = SessionLocal()

collections = db.query(Collection).all()

for collection in collections:
    note_count = db.query(Annotation).filter(
        Annotation.collection_id == collection.collection_id
    ).count()
    
    collection.note_count = note_count
    print(f"Collection {collection.collection_name}: {note_count} notes")

db.commit()
print(f"Updated note counts for {len(collections)} collections")
```

### **4. Migration Rollback Strategy**

**If migration fails**:
```bash
# Rollback to previous version
alembic downgrade -1

# Or restore from backup
pg_restore -h production-db -U user -d rdagent backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔄 **API Endpoint Migration**

### **Strategy: Dual Endpoints (Old + New)**

**Keep old endpoints for backward compatibility**:
```python
# Old endpoint (deprecated, but still works)
@app.post("/project/{project_id}/triage")
async def project_triage(...):
    # Keep existing implementation
    # Add deprecation warning in response
    return {
        **triage_result,
        "_deprecated": True,
        "_message": "This endpoint is deprecated. Use POST /triage instead."
    }

# New endpoint (collection-centric)
@app.post("/triage")
async def global_triage(...):
    # New implementation
    pass
```

**Deprecation timeline**:
- Week 1-8: Both endpoints work
- Week 9-12: Old endpoint shows deprecation warning
- Week 13+: Old endpoint returns 410 Gone (after confirming no usage)

---

## 🎨 **Frontend Migration**

### **Strategy: Feature Flag Components**

**Conditional rendering based on feature flags**:
```typescript
// frontend/src/app/home/page.tsx
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export default function HomePage() {
  const { enableNewHomePage } = useFeatureFlags();
  
  if (enableNewHomePage) {
    return <NewHomePage />;  // Simplified home with 4 workflow cards
  }
  
  return <OldHomePage />;  // Current home with hero + sections
}
```

**Benefits**:
- ✅ No code deletion (easy rollback)
- ✅ A/B testing capability
- ✅ Gradual migration
- ✅ User-specific rollout

---

## 📊 **Monitoring & Validation**

### **Metrics to Monitor**

**Performance**:
- API response times (especially `/triage`)
- Database query times
- Frontend page load times
- Error rates

**Usage**:
- Feature flag adoption rates
- User engagement with new features
- Triage success rates
- File upload/download rates

**Data Integrity**:
- Triage count (before vs after)
- Collection count (before vs after)
- Note count accuracy
- File count accuracy

### **Validation Queries**

```sql
-- Verify triage migration
SELECT COUNT(*) FROM paper_triage WHERE collection_id IS NULL;
-- Should be 0 after backfill

-- Verify note counts
SELECT c.collection_name, c.note_count, COUNT(a.annotation_id) as actual_count
FROM collections c
LEFT JOIN annotations a ON c.collection_id = a.collection_id
GROUP BY c.collection_id
HAVING c.note_count != COUNT(a.annotation_id);
-- Should return 0 rows

-- Verify project counts
SELECT p.project_name, p.paper_count, COUNT(DISTINCT ac.article_pmid) as actual_count
FROM projects p
LEFT JOIN project_collections pc ON p.project_id = pc.project_id
LEFT JOIN article_collections ac ON pc.collection_id = ac.collection_id
GROUP BY p.project_id
HAVING p.paper_count != COUNT(DISTINCT ac.article_pmid);
-- Should return 0 rows
```

---

## 🚨 **Rollback Plan**

### **Immediate Rollback (< 5 minutes)**

**If critical issue detected**:
```bash
# 1. Disable feature flag
railway variables set ENABLE_NEW_DISCOVER_PAGE=false
railway variables set ENABLE_GLOBAL_TRIAGE=false

# 2. Restart service (picks up new env vars)
railway restart

# 3. Verify rollback
curl https://r-dagent-production.up.railway.app/health
```

### **Full Rollback (< 30 minutes)**

**If database migration needs rollback**:
```bash
# 1. Disable all feature flags
railway variables set ENABLE_NEW_HOME_PAGE=false
railway variables set ENABLE_NEW_DISCOVER_PAGE=false
railway variables set ENABLE_NEW_COLLECTIONS_PAGE=false
railway variables set ENABLE_NEW_PROJECT_WORKSPACE=false
railway variables set ENABLE_NEW_LAB_PAGE=false
railway variables set ENABLE_GLOBAL_TRIAGE=false

# 2. Rollback database migration
alembic downgrade -1

# 3. Restore from backup (if needed)
pg_restore -h production-db -U user -d rdagent backup_latest.sql

# 4. Restart service
railway restart

# 5. Verify rollback
curl https://r-dagent-production.up.railway.app/health
```

---

## ✅ **Success Criteria**

**Phase 1 (Home Page)**:
- ✅ Page loads in < 2 seconds
- ✅ No JavaScript errors
- ✅ All workflow cards clickable
- ✅ Search bar functional

**Phase 2 (Collections Page)**:
- ✅ Page loads in < 2 seconds
- ✅ Note counts accurate
- ✅ All collections visible
- ✅ Actions (Explore, Network) work

**Phase 3 (Project Workspace)**:
- ✅ Page loads in < 3 seconds
- ✅ All 7 tabs load correctly
- ✅ Stats grid shows accurate counts
- ✅ No broken links

**Phase 4 (Lab Page)**:
- ✅ Page loads in < 3 seconds
- ✅ Protocols and experiments load
- ✅ File upload/download works
- ✅ Project filter works

**Phase 5 (Discover Page + Global Triage)**:
- ✅ Page loads in < 3 seconds
- ✅ AI triage completes in < 30 seconds
- ✅ Smart Inbox shows triaged papers
- ✅ Explore tab works
- ✅ All Papers tab works
- ✅ No performance degradation

---

**Status**: ✅ **MIGRATION STRATEGY DOCUMENTED**  
**Next**: Execute Phase 0 (Preparation) upon approval


