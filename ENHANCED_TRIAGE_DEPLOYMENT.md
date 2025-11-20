# 🚀 Enhanced AI Triage - Quick Deployment Guide

**Date**: 2025-11-20  
**Status**: ✅ Ready for Deployment

---

## 📦 **What's Being Deployed**

### **Frontend Changes** ✅ DEPLOYED
- Fixed font colors: white/light gray text on dark backgrounds
- Files: `InboxTab.tsx`, `InboxPaperCard.tsx`
- URL: https://frontend-psi-seven-85.vercel.app

### **Backend Changes** ⏳ READY
- Enhanced AI triage service with evidence-based scoring
- RAG-enhanced service with LangChain
- Database schema updates
- Feature flag system

---

## 🚀 **Quick Deploy Steps**

### **1. Deploy Backend to Railway**
```bash
# Commit changes
git add backend/
git commit -m "feat: Enhanced AI triage with evidence-based scoring"
git push railway main

# Wait for deployment
railway logs --follow
```

### **2. Run Database Migration**
```bash
# Connect to Railway
railway shell

# Run migration
python3 -c "
from sqlalchemy import create_engine, text
import os

engine = create_engine(os.getenv('DATABASE_URL'))
with open('backend/migrations/002_enhance_paper_triage.sql') as f:
    with engine.connect() as conn:
        for stmt in f.read().split(';'):
            if stmt.strip() and not stmt.strip().startswith('--'):
                conn.execute(text(stmt))
                conn.commit()
print('✅ Migration complete')
"
```

### **3. Enable Enhanced Triage**
```bash
# Set feature flag
railway variables set USE_ENHANCED_TRIAGE=true

# Restart service
railway restart
```

### **4. Test**
```bash
# Test triage endpoint
curl -X POST https://your-railway-url/api/triage/project/{project_id}/triage \
  -H "User-ID: test-user" \
  -H "Content-Type: application/json" \
  -d '{"article_pmid": "12345678"}'

# Verify response includes:
# - confidence_score
# - metadata_score
# - evidence_excerpts
# - question_relevance_scores
# - hypothesis_relevance_scores
```

---

## 📊 **What You Get**

### **Transparent Scoring**
- **Explicit Rubric**: 40+30+15+15 = 100 points
- **Metadata Scoring**: Citations (15) + Recency (10) + Journal (5) = 30 points
- **Combined Score**: (AI × 0.7) + Metadata

### **Evidence-Based**
```json
{
  "evidence_excerpts": [
    {
      "quote": "Successfully corrected mutations in 80% of embryos",
      "relevance": "Directly addresses technical success rate",
      "linked_to": "question_id"
    }
  ]
}
```

### **Per-Question Scores**
```json
{
  "question_relevance_scores": {
    "q1": {
      "score": 85,
      "reasoning": "Paper directly addresses ethical implications",
      "evidence": "Quote from abstract"
    }
  }
}
```

### **Confidence Scores**
```json
{
  "confidence_score": 0.85
}
```

---

## 🔄 **Rollback Plan**

If issues occur:
```bash
# Disable enhanced triage (instant rollback)
railway variables set USE_ENHANCED_TRIAGE=false
railway restart

# System reverts to standard triage
# No data loss
```

---

## ✅ **Success Checklist**

After deployment:
- [ ] Railway logs show "Enhanced triage service initialized"
- [ ] Database has new columns (confidence_score, metadata_score, etc.)
- [ ] Triage responses include enhanced fields
- [ ] Frontend displays white text correctly
- [ ] All action buttons work
- [ ] No errors in logs

---

## 📝 **Documentation**

- **Full Implementation**: `ENHANCED_TRIAGE_IMPLEMENTATION.md`
- **Complete Summary**: `FINAL_ENHANCED_TRIAGE_SUMMARY.md`
- **Test Suite**: `backend/test_enhanced_triage.py`

---

## 🎯 **Next Steps After Deployment**

1. **Monitor**: Check Railway logs for errors
2. **Test**: Triage a few papers manually
3. **Verify**: Check database for populated fields
4. **Optimize**: Adjust scoring rubric based on feedback
5. **Enhance**: Add frontend UI for evidence display

---

**Ready to deploy!** 🚀
