# 🚀 Ready for Railway Deployment

**Date**: November 17, 2025  
**Branch**: `feature/pivot-phase-1-foundation`  
**Status**: ✅ READY FOR DEPLOYMENT  
**Progress**: 8% complete (2/24 weeks)

---

## 📊 What Will Be Deployed

### Week 1: Database Schema Migration

**10 New Tables**:
1. `research_questions` - Tree structure for research questions
2. `question_evidence` - Junction table (questions ↔ papers)
3. `hypotheses` - Hypothesis tracking
4. `hypothesis_evidence` - Junction table (hypotheses ↔ papers)
5. `project_decisions` - Decision timeline
6. `paper_triage` - Smart inbox with AI relevance scoring
7. `protocols` - Extracted protocols from papers
8. `experiments` - Lab bridge linking hypotheses to protocols
9. `field_summaries` - Living literature review
10. `project_alerts` - Proactive notifications

**Migration Script**: `migrations/001_add_pivot_tables.py`

### Week 2: Core API Endpoints

**11 New Endpoints**:

**Research Questions** (6 endpoints):
- `POST /api/questions` - Create question
- `GET /api/questions/project/{project_id}` - Get all questions
- `GET /api/questions/{question_id}` - Get question details
- `PUT /api/questions/{question_id}` - Update question
- `DELETE /api/questions/{question_id}` - Delete question
- `POST /api/questions/{question_id}/evidence` - Link evidence

**Hypotheses** (5 endpoints):
- `POST /api/hypotheses` - Create hypothesis
- `GET /api/hypotheses/project/{project_id}` - Get all hypotheses
- `GET /api/hypotheses/question/{question_id}` - Get hypotheses for question
- `PUT /api/hypotheses/{hypothesis_id}` - Update hypothesis
- `POST /api/hypotheses/{hypothesis_id}/evidence` - Link evidence

---

## ✅ Pre-Deployment Checklist

- [x] Database migration tested locally
- [x] All 10 tables created successfully
- [x] API endpoints tested locally
- [x] Server starts successfully
- [x] All endpoints registered
- [x] Swagger UI working
- [x] No breaking changes to existing code
- [x] 100% backward compatibility maintained
- [x] Migration script supports rollback
- [x] Railway deployment script updated
- [x] All changes committed to feature branch
- [x] Documentation complete

---

## 🚀 Deployment Steps

### Option 1: Merge to Main and Deploy (Recommended)

```bash
# 1. Checkout main branch
git checkout main

# 2. Merge feature branch
git merge feature/pivot-phase-1-foundation

# 3. Push to Railway
git push origin main
```

Railway will automatically:
1. Detect the push
2. Run `run_migration_and_start.sh`
3. Execute `migrations/001_add_pivot_tables.py`
4. Create 10 new tables
5. Start the FastAPI server with new endpoints

### Option 2: Push Feature Branch to Railway

```bash
# Push feature branch to Railway
git push origin feature/pivot-phase-1-foundation
```

Then configure Railway to deploy from `feature/pivot-phase-1-foundation` branch.

---

## 📋 Expected Railway Logs

```
🗄️ Running database migrations...
📊 Running migration: add_article_summary_columns...
✅ Created table: article_summary_columns (existing)

🚀 Running migration: add_pivot_tables (Phase 1, Week 1)...
✅ Created table: research_questions
✅ Created table: question_evidence
✅ Created table: hypotheses
✅ Created table: hypothesis_evidence
✅ Created table: project_decisions
✅ Created table: paper_triage
✅ Created table: protocols
✅ Created table: experiments
✅ Created table: field_summaries
✅ Created table: project_alerts
✅ Migration 001 completed successfully!

✅ Research questions and hypotheses endpoints registered successfully
INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

---

## 🔍 Post-Deployment Verification

### 1. Check Deployment Logs

In Railway dashboard:
- Go to your backend service
- Click "Deployments"
- Check latest deployment logs
- Look for "✅ Migration 001 completed successfully!"

### 2. Verify Database Tables

Connect to Railway database and run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'research_questions',
    'question_evidence',
    'hypotheses',
    'hypothesis_evidence',
    'project_decisions',
    'paper_triage',
    'protocols',
    'experiments',
    'field_summaries',
    'project_alerts'
);
```

Should return 10 rows.

### 3. Test API Endpoints

```bash
# Check API documentation
curl https://your-backend.railway.app/docs

# Test health endpoint
curl https://your-backend.railway.app/health
```

### 4. Test New Endpoints

```bash
# Test questions endpoint (requires authentication)
curl -X GET "https://your-backend.railway.app/api/questions/project/{project_id}" \
  -H "User-ID: {user_id}"

# Test hypotheses endpoint
curl -X GET "https://your-backend.railway.app/api/hypotheses/project/{project_id}" \
  -H "User-ID: {user_id}"
```

---

## 🚨 Rollback Plan

If deployment fails or issues arise:

### Option 1: Rollback via Git

```bash
# Revert to pre-pivot version
git checkout main
git revert HEAD
git push origin main
```

### Option 2: Use Tagged Version

```bash
# Rollback to pre-pivot version
git checkout v1.0-pre-pivot
git push origin main --force
```

⚠️ **Warning**: This will force-push and overwrite main branch history.

### Option 3: Manual Database Rollback

```bash
# Connect to Railway database
railway connect postgres

# Run rollback
python3 migrations/001_add_pivot_tables.py downgrade
```

---

## 📈 What Changes After Deployment

### Database State

- **Before**: 14 tables
- **After**: 24 tables (14 existing + 10 new)
- **Data**: All existing data preserved

### API Endpoints

- **Before**: ~50 endpoints
- **After**: ~61 endpoints (50 existing + 11 new)
- **Breaking Changes**: None

### Application Features

- **Existing Features**: All working (no changes)
- **New Features**: Research questions and hypotheses API (backend only)
- **Frontend**: No changes yet (Week 3 will add UI)

---

## 📝 Commits to Be Deployed

```
b5b8fa7 📊 Week 2 completion documentation
f68b876 ✅ Phase 1, Week 2: Add Core API Endpoints (Research Questions & Hypotheses)
165794a 📚 Add Railway deployment instructions
2d22d02 🚀 Add production deployment script and update Railway migration
498a128 🎉 Week 1 completion summary
c4d0cf5 📊 Add implementation status tracking document
80aef8f ✅ Phase 1, Week 1: Add 10 new database tables for product pivot
```

**Total**: 7 commits  
**Lines Added**: ~1,500 lines  
**Files Created**: 8 files  
**Files Modified**: 2 files

---

## 🎯 Success Criteria

After deployment, verify:

- [ ] Railway deployment successful
- [ ] Migration logs show "✅ Migration 001 completed successfully!"
- [ ] All 10 new tables exist in database
- [ ] Server starts successfully
- [ ] All 11 new endpoints visible in /docs
- [ ] Existing endpoints still working
- [ ] No errors in Railway logs
- [ ] Health check returns 200 OK

---

## 📞 Support

If deployment fails:

1. **Check Railway logs** for error messages
2. **Review migration script** (`migrations/001_add_pivot_tables.py`)
3. **Test locally** with production database URL (if accessible)
4. **Rollback** using one of the options above
5. **Contact team** for assistance

---

**Ready to deploy? Follow Option 1 (Merge to Main and Deploy) above.**

**Questions? Review RAILWAY_DEPLOYMENT_INSTRUCTIONS.md for detailed instructions.**

