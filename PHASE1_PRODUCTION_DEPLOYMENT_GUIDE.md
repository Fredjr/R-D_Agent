# Phase 1 Production Deployment Guide

**Date**: 2025-11-27  
**Status**: ✅ Code Deployed to Railway (Automatic)  
**Next Step**: Run Database Migrations

---

## 📋 **Deployment Status**

### **✅ Step 1: Code Deployment** - COMPLETE
- ✅ Code committed to git
- ✅ Code pushed to GitHub (commit: 65a827b)
- ✅ Railway automatic deployment triggered
- ✅ Backend responding (HTTP 200 on /health)

### **⏳ Step 2: Database Migrations** - PENDING
- ⏳ Phase 0 migration (create tables)
- ⏳ Phase 1 migration (backfill data)

### **⏳ Step 3: Verification** - PENDING
- ⏳ Test production endpoints
- ⏳ Verify data consistency
- ⏳ Monitor logs

---

## 🗄️ **Database Migration Instructions**

### **Option 1: Using Railway CLI (Recommended)**

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Get DATABASE_URL**:
   ```bash
   railway variables
   ```
   Copy the `DATABASE_URL` value.

5. **Run migrations**:
   ```bash
   export DATABASE_URL="<your-railway-postgres-url>"
   ./run_production_migrations.sh
   ```

---

### **Option 2: Using Railway Dashboard**

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Select your project**: R-D_Agent

3. **Go to Variables tab**

4. **Copy DATABASE_URL** (should look like):
   ```
   postgresql://postgres:password@host.railway.app:5432/railway
   ```

5. **Run migrations locally** (connects to production DB):
   ```bash
   export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"
   ./run_production_migrations.sh
   ```

---

### **Option 3: Using Railway Shell**

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Select your project**: R-D_Agent

3. **Click on "Shell" or "Terminal"**

4. **Run migrations directly on Railway**:
   ```bash
   python3 migrations/phase0_add_many_to_many_collections.py
   python3 migrations/phase1_backfill_project_collections.py
   ```

---

## 🧪 **Migration Verification**

After running migrations, verify they worked:

### **Check Tables Created (Phase 0)**:
```sql
-- Connect to Railway PostgreSQL
psql $DATABASE_URL

-- Check if tables exist
\dt project_collections
\dt collection_research_questions
\dt collection_hypotheses
\dt collection_decisions
\dt collection_question_evidence
\dt collection_hypothesis_evidence

-- Check table structure
\d project_collections
```

### **Check Data Backfilled (Phase 1)**:
```sql
-- Count active collections
SELECT COUNT(*) FROM collections WHERE is_active = true;

-- Count project_collections
SELECT COUNT(*) FROM project_collections;

-- They should match!

-- View backfilled data
SELECT 
    pc.project_id,
    pc.collection_id,
    c.collection_name,
    pc.research_context,
    pc.created_at
FROM project_collections pc
JOIN collections c ON pc.collection_id = c.collection_id
LIMIT 10;
```

---

## 🧪 **Testing Production Endpoints**

### **Test 1: Create Collection**
```bash
curl -X POST https://r-dagent-production.up.railway.app/projects/{project_id}/collections \
  -H "Content-Type: application/json" \
  -H "User-ID: default_user" \
  -d '{
    "collection_name": "Phase 1 Test Collection",
    "description": "Testing dual-write in production",
    "color": "#FF5733",
    "icon": "🧪"
  }'
```

**Expected**: Collection created in BOTH `collections` and `project_collections` tables.

### **Test 2: Update Collection**
```bash
curl -X PUT https://r-dagent-production.up.railway.app/projects/{project_id}/collections/{collection_id} \
  -H "Content-Type: application/json" \
  -H "User-ID: default_user" \
  -d '{
    "description": "Updated description"
  }'
```

**Expected**: Both tables updated.

### **Test 3: Delete Collection**
```bash
curl -X DELETE https://r-dagent-production.up.railway.app/projects/{project_id}/collections/{collection_id} \
  -H "User-ID: default_user"
```

**Expected**: `collections.is_active = false`, `project_collections` record deleted.

---

## 📊 **Post-Deployment Checklist**

- [ ] Phase 0 migration completed (tables created)
- [ ] Phase 1 migration completed (data backfilled)
- [ ] Verified table counts match
- [ ] Tested create endpoint
- [ ] Tested update endpoint
- [ ] Tested delete endpoint
- [ ] Checked Railway logs for errors
- [ ] Verified frontend still works
- [ ] Monitored for 24 hours

---

## 🚨 **Rollback Plan** (If Needed)

If something goes wrong:

### **Rollback Phase 1 (Backfill)**:
```bash
export DATABASE_URL="<your-railway-postgres-url>"
python3 migrations/phase1_backfill_project_collections.py --rollback
```

### **Rollback Phase 0 (Tables)**:
```bash
export DATABASE_URL="<your-railway-postgres-url>"
python3 migrations/phase0_add_many_to_many_collections.py --rollback
```

### **Rollback Code**:
```bash
git revert 65a827b
git push origin main
```

---

## 📝 **Next Steps After Deployment**

1. ✅ Verify migrations successful
2. ✅ Test all 3 endpoints
3. ✅ Monitor logs for 24 hours
4. ✅ Proceed to Phase 2 (Dashboard UI)

---

**Deployment Guide Complete** ✅

