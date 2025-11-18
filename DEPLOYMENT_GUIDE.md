# Deployment Guide - Week 6-8 Release

**Date**: November 18, 2025  
**Release**: Phase 1, Weeks 6-8 (Hypothesis-Evidence Linking + Design Partner Testing Prep)  
**Status**: ✅ Ready for Deployment

---

## 🎯 Pre-Deployment Checklist

### **Code Quality** ✅
- [x] TypeScript build successful (no errors)
- [x] Code review complete (see WEEK6_7_8_CODE_ASSESSMENT.md)
- [x] All functional tests passed (17/17)
- [x] No critical or major bugs found
- [x] Security review passed

### **Environment Configuration** ⚠️
- [ ] Backend environment variables verified on Railway
- [ ] Frontend environment variables verified on Vercel
- [ ] Database connection string updated
- [ ] API keys secured

---

## 🚀 Deployment Steps

### **Step 1: Deploy Backend to Railway**

#### **1.1 Verify Railway Project**
```bash
# Check if Railway CLI is installed
railway --version

# Login to Railway (if not already)
railway login

# Link to your project
railway link
```

#### **1.2 Set Environment Variables**

Go to Railway Dashboard → Your Project → Variables

**Required Variables**:
```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI API (for AI features)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
OPENAI_SMALL_MODEL=gpt-4o-mini
OPENAI_MAIN_MODEL=gpt-4o

# Cerebras API (for summaries)
CEREBRAS_API_KEY=csk-...

# HuggingFace (for embeddings)
HUGGINGFACE_HUB_TOKEN=hf_...
HF_TOKEN=hf_...

# Feature Flags
PHD_DEMO_MODE=false
PHD_ANALYSIS_AVAILABLE=true
ENABLE_CACHING=1
SEMANTIC_ANALYSIS_AVAILABLE=1

# Python Environment
PYTHONUNBUFFERED=1
PORT=8000
```

#### **1.3 Deploy Backend**
```bash
# From project root
cd backend

# Deploy to Railway
railway up

# Or push to GitHub (if auto-deploy is enabled)
git push origin main
```

#### **1.4 Run Database Migrations**
```bash
# SSH into Railway container
railway run bash

# Run migrations
alembic upgrade head

# Or run directly
railway run alembic upgrade head
```

#### **1.5 Verify Backend Deployment**
```bash
# Check health endpoint
curl https://r-dagent-production.up.railway.app/health

# Expected response:
# {"status": "healthy", "database": "connected"}
```

---

### **Step 2: Deploy Frontend to Vercel**

#### **2.1 Verify Vercel Project**
```bash
# Check if Vercel CLI is installed
vercel --version

# Login to Vercel (if not already)
vercel login

# Link to your project
vercel link
```

#### **2.2 Set Environment Variables**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables**:
```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://r-dagent-production.up.railway.app

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

#### **2.3 Deploy Frontend**
```bash
# From project root
cd frontend

# Build locally to verify
npm run build

# Deploy to Vercel
vercel --prod

# Or push to GitHub (if auto-deploy is enabled)
git push origin main
```

#### **2.4 Verify Frontend Deployment**
```bash
# Open in browser
open https://your-app.vercel.app

# Check console for errors
# Verify API connectivity
```

---

### **Step 3: Post-Deployment Verification**

#### **3.1 Smoke Tests**

**Test 1: User Authentication**
- [ ] Navigate to app
- [ ] Sign in with test account
- [ ] Verify user ID in console

**Test 2: Project Access**
- [ ] Open a project
- [ ] Verify project loads
- [ ] Check Questions tab

**Test 3: Question Creation**
- [ ] Create a new question
- [ ] Verify it appears in list
- [ ] Check database for entry

**Test 4: Hypothesis Creation**
- [ ] Click "Add Hypothesis" on a question
- [ ] Fill in hypothesis details
- [ ] Submit and verify it appears

**Test 5: Evidence Linking (Questions)**
- [ ] Click "Link Evidence" on a question
- [ ] Select a paper
- [ ] Set evidence type and relevance
- [ ] Submit and verify evidence count updates

**Test 6: Evidence Linking (Hypotheses)**
- [ ] Click "Link Evidence" on a hypothesis
- [ ] Select a paper
- [ ] Set evidence type and strength
- [ ] Submit and verify evidence count updates

**Test 7: Evidence Display**
- [ ] Click evidence count to expand
- [ ] Verify evidence list displays
- [ ] Check type badges and strength indicators
- [ ] Verify paper titles are clickable

**Test 8: Evidence Removal**
- [ ] Click remove button on evidence
- [ ] Confirm removal
- [ ] Verify evidence count decrements

#### **3.2 Error Monitoring**

**Check Railway Logs**:
```bash
# View backend logs
railway logs

# Look for errors
railway logs --filter error
```

**Check Vercel Logs**:
```bash
# View frontend logs
vercel logs

# Or check Vercel Dashboard → Deployments → Logs
```

#### **3.3 Performance Check**

**Backend Performance**:
- [ ] API response times < 500ms
- [ ] Database query times < 100ms
- [ ] No memory leaks
- [ ] CPU usage < 50%

**Frontend Performance**:
- [ ] Page load time < 3s
- [ ] Time to Interactive < 5s
- [ ] No console errors
- [ ] No console warnings (except known Next.js warnings)

---

## 🔧 Troubleshooting

### **Issue: Backend Not Responding**

**Symptoms**: Frontend shows "Failed to fetch" errors

**Solutions**:
1. Check Railway deployment status
2. Verify DATABASE_URL is correct
3. Check Railway logs for errors
4. Restart Railway service
5. Verify CORS settings

```bash
# Check Railway status
railway status

# Restart service
railway restart

# View logs
railway logs --tail
```

---

### **Issue: Database Connection Failed**

**Symptoms**: Backend logs show "Connection refused" or "Authentication failed"

**Solutions**:
1. Verify DATABASE_URL format
2. Check PostgreSQL service is running
3. Verify database credentials
4. Check network connectivity

```bash
# Test database connection
railway run python -c "from database import engine; print(engine.connect())"
```

---

### **Issue: Frontend Build Failed**

**Symptoms**: Vercel deployment fails with TypeScript errors

**Solutions**:
1. Run `npm run build` locally
2. Fix TypeScript errors
3. Commit and push
4. Redeploy

```bash
cd frontend
npm run build
# Fix any errors
git add .
git commit -m "Fix build errors"
git push origin main
```

---

### **Issue: API Calls Failing**

**Symptoms**: Frontend shows 404 or 500 errors

**Solutions**:
1. Verify NEXT_PUBLIC_BACKEND_URL is correct
2. Check backend endpoints are deployed
3. Verify User-ID header is being sent
4. Check CORS configuration

```bash
# Test API endpoint
curl -H "User-ID: test-user" https://r-dagent-production.up.railway.app/api/questions/project/test-project
```

---

## 📊 Monitoring

### **Key Metrics to Track**

**Backend Metrics**:
- Request rate (requests/minute)
- Error rate (%)
- Response time (ms)
- Database query time (ms)
- Memory usage (MB)
- CPU usage (%)

**Frontend Metrics**:
- Page views
- Unique users
- Session duration
- Bounce rate
- Error rate
- Load time

### **Monitoring Tools**

**Railway**:
- Built-in metrics dashboard
- Log aggregation
- Alerts for errors

**Vercel**:
- Analytics dashboard
- Web Vitals
- Error tracking
- Deployment logs

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ Backend health check returns 200
- ✅ Frontend loads without errors
- ✅ All 8 smoke tests pass
- ✅ No errors in logs (first 5 minutes)
- ✅ API response times < 500ms
- ✅ Page load times < 3s

---

## 📝 Post-Deployment Tasks

### **Immediate (Within 1 hour)**
- [ ] Run all smoke tests
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Notify team of deployment

### **Within 24 hours**
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Review performance metrics
- [ ] Create backup of database

### **Within 1 week**
- [ ] Collect design partner feedback
- [ ] Analyze usage patterns
- [ ] Identify performance bottlenecks
- [ ] Plan next iteration

---

## 🔄 Rollback Plan

If critical issues are found:

### **Step 1: Rollback Frontend**
```bash
# Vercel Dashboard → Deployments → Previous Deployment → Promote to Production
# Or via CLI:
vercel rollback
```

### **Step 2: Rollback Backend**
```bash
# Railway Dashboard → Deployments → Previous Deployment → Redeploy
# Or via CLI:
railway rollback
```

### **Step 3: Rollback Database** (if needed)
```bash
# SSH into Railway
railway run bash

# Rollback migration
alembic downgrade -1

# Or restore from backup
pg_restore -d $DATABASE_URL backup.sql
```

---

## 📞 Support

**Issues**: Create GitHub issue with `deployment` label  
**Urgent**: Contact team lead  
**Documentation**: See WEEK6_7_8_CODE_ASSESSMENT.md

---

**Deployed By**: [Your Name]  
**Deployment Date**: [Date]  
**Deployment Time**: [Time]  
**Git Commit**: [Commit Hash]

