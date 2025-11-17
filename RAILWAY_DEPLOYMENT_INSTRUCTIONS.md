# 🚀 Railway Production Deployment Instructions

**Date**: November 17, 2025  
**Migration**: Phase 1, Week 1 - Database Schema Migration  
**Status**: Ready for deployment

---

## 📋 Pre-Deployment Checklist

- [x] Migration tested locally on SQLite
- [x] All 10 new tables created successfully
- [x] Migration script supports rollback
- [x] Backward compatibility verified (no breaking changes)
- [x] Railway deployment script updated
- [x] All changes committed to feature branch

---

## 🚀 Deployment Process

### Option 1: Automatic Deployment (Recommended)

Railway will automatically run the migration when you push to the main branch.

**Steps**:

1. **Merge feature branch to main**:
   ```bash
   git checkout main
   git merge feature/pivot-phase-1-foundation
   git push origin main
   ```

2. **Railway will automatically**:
   - Detect the push
   - Run `run_migration_and_start.sh`
   - Execute `migrations/001_add_pivot_tables.py`
   - Create 10 new tables
   - Start the FastAPI server

3. **Monitor deployment**:
   - Go to Railway dashboard
   - Watch deployment logs
   - Look for: "✅ Migration 001 completed successfully!"

### Option 2: Manual Deployment via Railway CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

---

## 📊 What Will Happen

### During Deployment

Railway will execute `run_migration_and_start.sh`:

```bash
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

🚀 Starting FastAPI server...
```

### After Deployment

- ✅ 10 new tables will exist in production database
- ✅ All existing tables unchanged
- ✅ All existing features continue to work
- ✅ Backend ready for Week 2 API endpoints

---

## 🔍 Verification Steps

### 1. Check Deployment Logs

In Railway dashboard:
- Go to your backend service
- Click "Deployments"
- Check latest deployment logs
- Look for "✅ Migration 001 completed successfully!"

### 2. Test Database Connection

Use Railway's database console or connect via psql:

```sql
-- Check if new tables exist
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

-- Should return 10 rows
```

### 3. Test API Health

```bash
curl https://your-backend.railway.app/health
```

Should return: `{"status": "healthy"}`

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

Railway will automatically redeploy the previous version.

### Option 2: Manual Database Rollback

If you need to remove the new tables:

```bash
# Connect to Railway database
railway connect postgres

# Run rollback
python3 migrations/001_add_pivot_tables.py downgrade
```

### Option 3: Use Tagged Version

```bash
# Rollback to pre-pivot version
git checkout v1.0-pre-pivot
git push origin main --force
```

⚠️ **Warning**: This will force-push and overwrite main branch history.

---

## 📝 Post-Deployment Tasks

After successful deployment:

1. **Verify all tables exist** (see verification steps above)
2. **Test existing features** (network view, collections, PDF viewer)
3. **Monitor error logs** for 24 hours
4. **Update IMPLEMENTATION_STATUS.md** with deployment timestamp
5. **Proceed to Week 2**: Core API Endpoints

---

## 🎯 Expected Results

### Database State After Deployment

- **Total Tables**: 24 (14 existing + 10 new)
- **New Tables**: research_questions, question_evidence, hypotheses, hypothesis_evidence, project_decisions, paper_triage, protocols, experiments, field_summaries, project_alerts
- **Existing Tables**: Unchanged
- **Data**: All existing data preserved

### Application State

- ✅ All existing features working
- ✅ No breaking changes
- ✅ Backend ready for Week 2 API development
- ✅ Frontend unchanged (no UI changes yet)

---

## 📞 Support

If deployment fails:

1. **Check Railway logs** for error messages
2. **Review migration script** (`migrations/001_add_pivot_tables.py`)
3. **Test locally** with production database URL (if accessible)
4. **Rollback** using one of the options above
5. **Contact team** for assistance

---

## 🚀 Next Steps After Deployment

Once deployment is successful:

1. **Week 2**: Create API routers
   - `backend/app/routers/research_questions.py`
   - `backend/app/routers/hypotheses.py`

2. **Week 3**: Build Questions Tab UI
   - Frontend components for question hierarchy

3. **Week 4**: Build Evidence Linking UI
   - Drag-and-drop evidence linking

---

## 📚 Reference Files

- `migrations/001_add_pivot_tables.py` - Migration script
- `migrations/deploy_to_production.py` - Deployment helper script
- `run_migration_and_start.sh` - Railway startup script
- `IMPLEMENTATION_STATUS.md` - Progress tracking
- `WEEK1_COMPLETION_SUMMARY.md` - Week 1 details

---

**Ready to deploy? Follow Option 1 (Automatic Deployment) above.**

**Questions? Review the rollback plan before proceeding.**

