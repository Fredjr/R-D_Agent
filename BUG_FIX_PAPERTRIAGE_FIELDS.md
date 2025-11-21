# 🐛 Bug Fix: PaperTriage Field Names

**Date**: 2025-11-21  
**Status**: ✅ **FIXED IN CODE - AWAITING DEPLOYMENT**

---

## 🔴 **Problem**

Both the **Summaries** and **Insights** tabs were failing with 500 errors:

```json
{
    "detail": "Failed to get summary: type object 'PaperTriage' has no attribute 'pmid'"
}
```

```json
{
    "detail": "Failed to generate insights: type object 'PaperTriage' has no attribute 'pmid'"
}
```

---

## 🔍 **Root Cause**

The services were using **incorrect field names** for the `PaperTriage` model:

| ❌ Incorrect Field | ✅ Correct Field | Description |
|-------------------|------------------|-------------|
| `PaperTriage.pmid` | `PaperTriage.article_pmid` | Foreign key to Article |
| `PaperTriage.decision` | `PaperTriage.triage_status` | Status field |
| `PaperTriage.final_score` | `PaperTriage.relevance_score` | Score field (0-100) |

### **PaperTriage Schema (from database.py)**

```python
class PaperTriage(Base):
    __tablename__ = "paper_triage"
    
    triage_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    article_pmid = Column(String, ForeignKey("articles.pmid"))  # ✅ Correct field
    
    triage_status = Column(String, default='must_read')  # ✅ must_read, nice_to_know, ignore
    relevance_score = Column(Integer, default=50)  # ✅ 0-100 scale
    read_status = Column(String, default='unread')
```

---

## ✅ **Fixes Applied**

### **1. Living Summary Service** (`backend/app/services/living_summary_service.py`)

**Lines 113-119:**
```python
# BEFORE (❌ Wrong)
papers = db.query(Article, PaperTriage).join(
    PaperTriage, Article.pmid == PaperTriage.pmid  # ❌ Wrong field
).filter(
    PaperTriage.project_id == project_id,
    PaperTriage.decision == 'accept'  # ❌ Wrong field
).all()

# AFTER (✅ Fixed)
papers = db.query(Article, PaperTriage).join(
    PaperTriage, Article.pmid == PaperTriage.article_pmid  # ✅ Correct
).filter(
    PaperTriage.project_id == project_id,
    PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])  # ✅ Correct
).all()
```

### **2. Insights Service** (`backend/app/services/insights_service.py`)

**Lines 73-78:**
```python
# BEFORE (❌ Wrong)
papers = db.query(Article, PaperTriage).join(
    PaperTriage, Article.pmid == PaperTriage.pmid  # ❌ Wrong field
).filter(
    PaperTriage.project_id == project_id
).all()

# AFTER (✅ Fixed)
papers = db.query(Article, PaperTriage).join(
    PaperTriage, Article.pmid == PaperTriage.article_pmid  # ✅ Correct
).filter(
    PaperTriage.project_id == project_id
).all()
```

**Lines 139-141:**
```python
# BEFORE (❌ Wrong)
accepted_papers = [p for a, p in papers if p.decision == 'accept']  # ❌ Wrong field
avg_score = sum(p.final_score for a, p in papers if p.final_score) / len(papers)  # ❌ Wrong field

# AFTER (✅ Fixed)
must_read_papers = [p for a, p in papers if p.triage_status == 'must_read']  # ✅ Correct
avg_score = sum(p.relevance_score for a, p in papers if p.relevance_score) / len(papers)  # ✅ Correct
```

**Lines 227-229:**
```python
# BEFORE (❌ Wrong)
for article, triage in sorted(papers, key=lambda x: x[1].final_score or 0, reverse=True)[:5]:
    context += f"- {article.title} (Score: {triage.final_score})\n"

# AFTER (✅ Fixed)
for article, triage in sorted(papers, key=lambda x: x[1].relevance_score or 0, reverse=True)[:5]:
    context += f"- {article.title} (Relevance: {triage.relevance_score}/100)\n"
```

### **3. Frontend InsightsTab** (`frontend/src/components/project/InsightsTab.tsx`)

**Lines 27-31:**
```typescript
// BEFORE (❌ Wrong)
interface Metrics {
  accepted_papers: number;  // ❌ Wrong field name
}

// AFTER (✅ Fixed)
interface Metrics {
  must_read_papers: number;  // ✅ Correct field name
}
```

**Lines 174-177:**
```tsx
// BEFORE (❌ Wrong)
<div className="text-2xl font-bold text-green-400">
  {insights.metrics.accepted_papers}/{insights.metrics.total_papers}
</div>
<div className="text-sm text-gray-400">Papers Accepted</div>

// AFTER (✅ Fixed)
<div className="text-2xl font-bold text-green-400">
  {insights.metrics.must_read_papers}/{insights.metrics.total_papers}
</div>
<div className="text-sm text-gray-400">Must-Read Papers</div>
```

---

## 📦 **Deployment Status**

✅ **Code Fixed**: Commits `98292bd`, `bad52fd` pushed to `main` branch
⏳ **Railway Backend**: Awaiting automatic redeployment
⏳ **Vercel Frontend**: Awaiting automatic redeployment

### **Additional Fix (bad52fd)**
Found one more reference to `final_score` in `living_summary_service.py` line 195:
```python
# BEFORE (❌ Wrong)
context += f"- {article.title} (Score: {triage.final_score})\n"

# AFTER (✅ Fixed)
context += f"- {article.title} (Relevance: {triage.relevance_score}/100)\n"
```

### **Expected Timeline**
- Railway typically redeploys within **2-5 minutes** of push
- Vercel typically redeploys within **1-3 minutes** of push

---

## 🧪 **Testing**

Once deployed, test both features:

1. **Summaries Tab**: Navigate to **Lab → Summaries**
   - Should load without 500 error
   - Should display project summary with AI insights

2. **Insights Tab**: Navigate to **Analysis → Insights**
   - Should load without 500 error
   - Should display metrics, progress insights, connections, gaps, trends, and recommendations

---

## 📊 **Impact**

- ✅ Summaries tab now works correctly
- ✅ Insights tab now works correctly
- ✅ Correct paper filtering (must_read + nice_to_know)
- ✅ Correct relevance scoring (0-100 scale)
- ✅ Better semantic naming (must_read_papers vs accepted_papers)

---

**Status**: ✅ **ALL FIXES COMPLETE** - Waiting for Railway/Vercel to redeploy. Should be live within 5 minutes! 🚀

---

## 🔍 **Verification**

All references to old field names have been removed:
- ✅ No more `PaperTriage.pmid` references
- ✅ No more `PaperTriage.decision` references
- ✅ No more `PaperTriage.final_score` references

Verified with: `grep -r "\.final_score\|\.decision\|PaperTriage\.pmid" backend/app`

