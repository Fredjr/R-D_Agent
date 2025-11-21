# 🔧 Troubleshooting 502 Error

**Error**: `Application failed to respond` (502 Bad Gateway)  
**Date**: 2025-11-21  
**Context**: After pushing AI services bug fixes

---

## 🔍 **What is a 502 Error?**

A 502 Bad Gateway error means the Railway proxy cannot reach your backend application. This typically happens when:

1. ✅ **Deployment in Progress** (Most likely) - Railway is still building/deploying
2. ⚠️ **Application Crash** - Backend crashed during startup
3. ⚠️ **Timeout** - Application taking too long to start
4. ⚠️ **Port Binding Issue** - App not listening on correct port

---

## ✅ **Verification Steps**

### **Step 1: Check Railway Deployment Status**

1. Go to your Railway dashboard: https://railway.app
2. Select your backend service
3. Check the **Deployments** tab
4. Look for the latest deployment status:
   - 🟡 **Building** - Wait for build to complete
   - 🟡 **Deploying** - Wait for deployment to complete
   - 🟢 **Active** - Deployment successful
   - 🔴 **Failed** - Check logs for errors

**Expected Timeline**: 2-5 minutes for full deployment

---

### **Step 2: Check Railway Logs**

In Railway dashboard:
1. Click on your backend service
2. Go to **Logs** tab
3. Look for:
   - ✅ `Application startup complete` or similar
   - ✅ `Uvicorn running on http://0.0.0.0:$PORT`
   - ❌ Python errors or stack traces
   - ❌ Import errors
   - ❌ Database connection errors

**Common Issues to Look For**:
```
❌ ModuleNotFoundError: No module named 'openai'
❌ ImportError: cannot import name 'AsyncOpenAI'
❌ SyntaxError: invalid syntax
❌ Database connection failed
❌ Port already in use
```

---

### **Step 3: Verify Code Syntax** ✅

Already verified locally - no syntax errors:
```bash
✅ python3 -m py_compile backend/app/services/insights_service.py
✅ python3 -m py_compile backend/app/services/living_summary_service.py
```

---

## 🔧 **Potential Issues & Solutions**

### **Issue 1: OpenAI API Key Missing**

**Symptom**: Logs show `openai.OpenAIError: API key not found`

**Solution**: 
1. Go to Railway dashboard → Backend service → Variables
2. Verify `OPENAI_API_KEY` is set
3. If missing, add it and redeploy

---

### **Issue 2: Database Migration Not Run**

**Symptom**: Logs show `relation "project_summaries" does not exist`

**Solution**: Run the migration:
```sql
-- Connect to Railway PostgreSQL
-- Run: backend/migrations/006_add_project_summaries.sql
```

---

### **Issue 3: Import Error**

**Symptom**: Logs show `ImportError: cannot import name 'QuestionEvidence'`

**Solution**: Verify database.py exports all required models:
```python
# In database.py, ensure these are defined:
- QuestionEvidence
- HypothesisEvidence
- ProjectSummary
```

---

### **Issue 4: Dependency Missing**

**Symptom**: Logs show `ModuleNotFoundError: No module named 'openai'`

**Solution**: Verify requirements.txt includes:
```
openai>=1.0.0
```

---

## 🚀 **Quick Fixes**

### **If Deployment is Stuck**:
1. Go to Railway dashboard
2. Click **Redeploy** button
3. Wait 2-5 minutes

### **If Application Crashed**:
1. Check logs for specific error
2. Fix the error in code
3. Push to GitHub
4. Railway will auto-deploy

### **If Database Issue**:
1. Connect to Railway PostgreSQL
2. Run migration: `006_add_project_summaries.sql`
3. Restart backend service

---

## 📊 **Current Status**

### **Code Status**: ✅ **VERIFIED**
- ✅ No syntax errors
- ✅ All imports valid
- ✅ Error handling added
- ✅ JSON forcing implemented

### **Commits Pushed**: ✅ **5 COMMITS**
- `98292bd` - PaperTriage field fixes
- `bad52fd` - Final field fix
- `1a48e23` - Documentation
- `1beb1a7` - AI error handling
- `fe67bdf` - Summary docs

### **Expected Resolution**:
- ⏳ Wait 2-5 minutes for Railway deployment
- ⏳ Check Railway logs for any errors
- ⏳ Verify deployment status is "Active"

---

## 🎯 **Next Steps**

1. **Wait 5 minutes** for Railway to complete deployment
2. **Check Railway dashboard** for deployment status
3. **Review logs** if deployment fails
4. **Test endpoints** once deployment is active:
   - GET `/api/summaries/projects/{id}/summary`
   - GET `/api/insights/projects/{id}/insights`

---

## 📞 **If Still Failing After 10 Minutes**

1. Share Railway logs (last 100 lines)
2. Check Railway deployment status
3. Verify environment variables are set
4. Check database connection
5. Consider manual redeploy

---

**Most Likely Cause**: 🟡 **Deployment still in progress**  
**Action**: ⏳ **Wait 2-5 more minutes and refresh**

