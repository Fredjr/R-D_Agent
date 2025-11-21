# 🚀 Deployment Instructions - AI Insights Caching

**Date**: 2025-11-21  
**Feature**: AI Insights & Summaries Caching with Regenerate Buttons

---

## 📋 **What Was Changed**

### **Backend Changes**:
1. ✅ Fixed datetime comparison bug in `living_summary_service.py`
2. ✅ Added `ProjectInsights` model to `database.py`
3. ✅ Enhanced `insights_service.py` with caching logic
4. ✅ Added regenerate endpoint to `insights.py` router
5. ✅ Created migration: `007_add_project_insights.sql`

### **Frontend Changes**:
1. ✅ Added Regenerate button to `InsightsTab.tsx`
2. ✅ Updated button text in `SummariesTab.tsx`
3. ✅ Added last_updated timestamp display

---

## 🔧 **Required Deployment Steps**

### **Step 1: Run Database Migration** ⚠️ **REQUIRED**

You need to run the new migration on your Railway PostgreSQL database:

```sql
-- Connect to Railway PostgreSQL and run:
-- File: backend/migrations/007_add_project_insights.sql

CREATE TABLE IF NOT EXISTS project_insights (
    insight_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Insights content (JSON arrays)
    progress_insights JSON DEFAULT '[]'::json,
    connection_insights JSON DEFAULT '[]'::json,
    gap_insights JSON DEFAULT '[]'::json,
    trend_insights JSON DEFAULT '[]'::json,
    recommendations JSON DEFAULT '[]'::json,
    
    -- Metrics
    total_papers INTEGER DEFAULT 0,
    must_read_papers INTEGER DEFAULT 0,
    avg_paper_score FLOAT DEFAULT 0.0,
    
    -- Cache management
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_insights_project ON project_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_cache ON project_insights(cache_valid_until);

COMMENT ON TABLE project_insights IS 'Cached AI-generated project insights with 24-hour TTL';
```

### **How to Run Migration on Railway**:

**Option A: Railway CLI**
```bash
# Install Railway CLI if not already installed
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway connect postgres

# Paste the SQL from 007_add_project_insights.sql
# Press Ctrl+D to execute
```

**Option B: Railway Dashboard**
1. Go to Railway dashboard
2. Select your PostgreSQL service
3. Click "Data" tab
4. Click "Query" button
5. Paste the SQL from `backend/migrations/007_add_project_insights.sql`
6. Click "Run Query"

**Option C: psql Command**
```bash
# Get connection string from Railway dashboard
psql "postgresql://user:pass@host:port/railway" -f backend/migrations/007_add_project_insights.sql
```

---

### **Step 2: Wait for Automatic Deployment**

Railway will automatically:
1. ✅ Detect the push to main branch
2. ✅ Pull latest code
3. ✅ Install dependencies
4. ✅ Build and deploy backend
5. ✅ Restart the service

**Expected Time**: 2-5 minutes

---

### **Step 3: Verify Deployment**

#### **Check Railway Logs**:
Look for these success messages:
```
✅ Application startup complete
✅ Uvicorn running on http://0.0.0.0:$PORT
```

#### **Test Endpoints**:

**1. Test Insights (with cache)**:
```bash
curl -X GET "https://your-backend.railway.app/api/insights/projects/{project_id}/insights" \
  -H "User-ID: your-user-id"
```

**2. Test Insights Regenerate**:
```bash
curl -X POST "https://your-backend.railway.app/api/insights/projects/{project_id}/insights/regenerate" \
  -H "User-ID: your-user-id"
```

**3. Test Summaries**:
```bash
curl -X GET "https://your-backend.railway.app/api/summaries/projects/{project_id}/summary" \
  -H "User-ID: your-user-id"
```

---

## ✅ **Expected Behavior After Deployment**

### **Insights Tab**:
1. ✅ First load: Generates insights and caches for 24 hours
2. ✅ Subsequent loads: Returns cached insights instantly
3. ✅ "Refresh" button: Reloads from cache
4. ✅ "Regenerate" button: Forces new AI generation
5. ✅ Shows "Last updated" timestamp
6. ✅ Persists across page reloads

### **Summaries Tab**:
1. ✅ First load: Generates summary and caches for 24 hours
2. ✅ Subsequent loads: Returns cached summary instantly
3. ✅ "Regenerate" button: Forces new AI generation
4. ✅ Shows "Last updated" timestamp
5. ✅ Persists across page reloads

---

## 🐛 **Troubleshooting**

### **Issue: "relation 'project_insights' does not exist"**
**Solution**: Run the migration (Step 1)

### **Issue: "can't compare offset-naive and offset-aware datetimes"**
**Solution**: This is fixed in the latest code. Redeploy if needed.

### **Issue: "Expecting value: line 1 column 1 (char 0)"**
**Solution**: This is fixed with `response_format={"type": "json_object"}`. Redeploy if needed.

### **Issue: 502 Bad Gateway**
**Solution**: Wait for Railway deployment to complete (2-5 minutes)

---

## 📊 **Verification Checklist**

- [ ] Database migration executed successfully
- [ ] Railway backend deployed (status: Active)
- [ ] Vercel frontend deployed (status: Ready)
- [ ] Insights tab loads without errors
- [ ] Summaries tab loads without errors
- [ ] Regenerate buttons work on both tabs
- [ ] Timestamps display correctly
- [ ] Cache persists across page reloads

---

**Status**: ⏳ **Awaiting Migration + Deployment**  
**Next Step**: Run database migration on Railway PostgreSQL

