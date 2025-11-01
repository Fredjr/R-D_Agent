# 🎯 Prioritized Action Plan: What to Build First

**Decision Framework:** Impact vs. Effort Matrix

---

## 📊 **IMPACT VS. EFFORT MATRIX**

```
HIGH IMPACT, LOW EFFORT (Do First! 🚀)
┌─────────────────────────────────────┐
│ 1. Enable Network View              │ ← 5 min fix!
│ 2. Tab Structure Redesign           │ ← 2-3 days
│ 3. Research Question Tab            │ ← 1 day
└─────────────────────────────────────┘

HIGH IMPACT, MEDIUM EFFORT (Do Next 🎯)
┌─────────────────────────────────────┐
│ 4. Enhanced Onboarding (Steps 4-7)  │ ← 1 week
│ 5. Notes Tab with Filters           │ ← 2-3 days
│ 6. Explore Tab                      │ ← 2 days
└─────────────────────────────────────┘

HIGH IMPACT, HIGH EFFORT (Plan Carefully 📋)
┌─────────────────────────────────────┐
│ 7. Global Search                    │ ← 1 week
│ 8. Collaboration Features           │ ← 2 weeks
│ 9. PDF Viewer                       │ ← 2 weeks
└─────────────────────────────────────┘

MEDIUM IMPACT (Nice to Have 💡)
┌─────────────────────────────────────┐
│ 10. Advanced Filters                │ ← 3-4 days
│ 11. Progress Tab                    │ ← 3-4 days
│ 12. Reading List                    │ ← 2-3 days
└─────────────────────────────────────┘
```

---

## 🚀 **QUICK WINS (Week 1)**

### **Day 1: Enable Network View (5 minutes)**

**Current State:**
Network view is DISABLED (commented out) in project page.

**File:** `frontend/src/app/project/[projectId]/page.tsx`

**Find this code (around line 952-978):**
```typescript
<SpotifyProjectTabs
  tabs={[
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'collections', label: 'Collections', icon: '📁' },
    // { id: 'network', label: 'Network', icon: '🔗' }, ← COMMENTED OUT
    { id: 'activity', label: 'Activity & Notes', icon: '📝' }
  ]}
/>
```

**Change to:**
```typescript
<SpotifyProjectTabs
  tabs={[
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'collections', label: 'Collections', icon: '📁' },
    { id: 'network', label: 'Network', icon: '🔗' }, // ← UNCOMMENT THIS
    { id: 'activity', label: 'Activity & Notes', icon: '📝' }
  ]}
/>
```

**Test:**
```bash
npm run dev
# Navigate to project page
# Click "Network" tab
# Verify network view loads
```

**Impact:** 🟢 HIGH - Users can now explore papers visually  
**Effort:** 🟢 LOW - 5 minutes  
**Priority:** ⭐⭐⭐⭐⭐ DO THIS FIRST!

---

### **Day 1-2: Rename Tabs (2 hours)**

**Current tabs are confusing. Let's make them clearer:**

**File:** `frontend/src/app/project/[projectId]/page.tsx`

**Change:**
```typescript
// BEFORE
{ id: 'overview', label: 'Overview', icon: '📊' }
{ id: 'activity', label: 'Activity & Notes', icon: '📝' }

// AFTER
{ id: 'overview', label: 'Research Question', icon: '🎯' }
{ id: 'activity', label: 'Notes & Ideas', icon: '📝' }
```

**Impact:** 🟢 HIGH - Clearer purpose  
**Effort:** 🟢 LOW - 2 hours  
**Priority:** ⭐⭐⭐⭐⭐

---

### **Day 2-3: Create Research Question Tab (1 day)**

**Replace "Overview" content with focused Research Question view.**

**Steps:**
1. Create `frontend/src/components/project/ResearchQuestionTab.tsx`
2. Copy template from `INTEGRATION_PLAN_PHASE_2.md`
3. Replace Overview tab content
4. Test

**Impact:** 🟢 HIGH - Users understand project purpose  
**Effort:** 🟢 LOW - 1 day  
**Priority:** ⭐⭐⭐⭐⭐

---

### **Day 3-4: Create Notes Tab with Filters (1 day)**

**Separate notes from activity feed.**

**Steps:**
1. Create `frontend/src/components/project/NotesTab.tsx`
2. Add filters (type, priority, status)
3. Show hierarchical view
4. Replace Activity & Notes tab content
5. Test

**Impact:** 🟢 HIGH - Notes easier to find  
**Effort:** 🟢 LOW - 1 day  
**Priority:** ⭐⭐⭐⭐⭐

---

### **Day 4-5: Create Explore Tab (1 day)**

**Make network view more prominent.**

**Steps:**
1. Create `frontend/src/components/project/ExploreTab.tsx`
2. Add PubMed search bar
3. Embed MultiColumnNetworkView
4. Replace Network tab content
5. Test

**Impact:** 🟢 HIGH - Discovery more intuitive  
**Effort:** 🟢 LOW - 1 day  
**Priority:** ⭐⭐⭐⭐

---

## 🎯 **WEEK 1 SUMMARY**

**By end of Week 1, you'll have:**
- ✅ Network view enabled
- ✅ 4 clear tabs:
  - 🎯 Research Question (was "Overview")
  - 🔍 Explore Papers (was "Network")
  - 📚 My Collections (unchanged)
  - 📝 Notes & Ideas (was "Activity & Notes")
- ✅ Notes separate from activity
- ✅ Research question prominent

**Impact:** Users immediately understand the workflow!

**Effort:** 5 days

**Deploy to staging and get user feedback before continuing.**

---

## 🚀 **MEDIUM WINS (Week 2-3)**

### **Week 2: Enhanced Onboarding**

**Goal:** Guide new users to first success

**Steps:**
1. Create Step 4: First Project (Day 6-7)
2. Create Step 5: Seed Paper (Day 8-9)
3. Create Step 6: Explore & Organize (Day 10-11)
4. Create Step 7: First Note (Day 12)
5. Update onboarding page (Day 13)
6. Test complete flow (Day 14)

**Impact:** 🟢 HIGH - New users complete onboarding  
**Effort:** 🟡 MEDIUM - 2 weeks  
**Priority:** ⭐⭐⭐⭐

**Detailed plan:** `INTEGRATION_PLAN_PHASE_1.md`

---

### **Week 3: Analysis & Progress Tabs**

**Goal:** Complete the 6-tab structure

**Steps:**
1. Create Analysis Tab (Day 15-16)
   - Combine Reports + Deep Dives
   - Unified layout
2. Create Progress Tab (Day 17-18)
   - Activity timeline
   - Metrics dashboard
3. Test all tabs (Day 19)
4. Deploy to staging (Day 20)

**Impact:** 🟡 MEDIUM - Complete workflow  
**Effort:** 🟢 LOW - 1 week  
**Priority:** ⭐⭐⭐

---

## 🎯 **BIG WINS (Week 4-6)**

### **Week 4-5: Global Search**

**Goal:** Make everything findable

**Backend (Day 21-23):**
1. Create `/projects/{project_id}/search` endpoint
2. Implement search across papers, collections, notes, reports
3. Test search relevance

**Frontend (Day 24-28):**
1. Create GlobalSearch component
2. Create SearchResults component
3. Implement Cmd+K shortcut
4. Add recent searches
5. Test and refine

**Impact:** 🟢 HIGH - Users can find anything  
**Effort:** 🟡 MEDIUM - 2 weeks  
**Priority:** ⭐⭐⭐⭐

---

### **Week 6: Advanced Filters**

**Goal:** Narrow down results

**Steps:**
1. Create FilterPanel component (Day 29-30)
2. Add filter options (papers, notes, collections)
3. Add filter chips
4. Save filter presets (Day 31-32)
5. Test

**Impact:** 🟡 MEDIUM - Better discoverability  
**Effort:** 🟢 LOW - 1 week  
**Priority:** ⭐⭐⭐

---

## 🚀 **LONG-TERM WINS (Week 7-10)**

### **Week 7-8: Collaboration**

**Goal:** Enable team research

**Backend (Day 33-36):**
- Endpoints already exist! Just need frontend

**Frontend (Day 37-40):**
1. Create InviteModal component
2. Create CollaboratorsList component
3. Add @mentions in notes
4. Add note visibility settings
5. Test collaboration flow

**Impact:** 🟢 HIGH - Team research enabled  
**Effort:** 🔴 HIGH - 2 weeks  
**Priority:** ⭐⭐⭐

---

### **Week 9-10: PDF Viewer**

**Goal:** Integrated reading experience

**Backend (Day 41-44):**
1. Create `/articles/{pmid}/pdf` endpoint
2. Integrate with PubMed Central, Unpaywall
3. PDF caching

**Frontend (Day 45-50):**
1. Create PDFViewer component (react-pdf)
2. Create HighlightTool component
3. Implement highlight → note conversion
4. Add reading progress tracking
5. Create ReadingList component
6. Test

**Impact:** 🟡 MEDIUM - Better reading experience  
**Effort:** 🔴 HIGH - 2 weeks  
**Priority:** ⭐⭐

---

## 📊 **RECOMMENDED SEQUENCE**

### **Phase 1: Quick Wins (Week 1) - DO THIS FIRST! 🚀**
1. ✅ Enable network view (5 min)
2. ✅ Rename tabs (2 hours)
3. ✅ Research Question Tab (1 day)
4. ✅ Notes Tab (1 day)
5. ✅ Explore Tab (1 day)

**Deploy to staging → Get feedback → Iterate**

---

### **Phase 2: Medium Wins (Week 2-3)**
6. ✅ Enhanced onboarding (2 weeks)
7. ✅ Analysis & Progress tabs (1 week)

**Deploy to production → Monitor metrics**

---

### **Phase 3: Big Wins (Week 4-6)**
8. ✅ Global search (2 weeks)
9. ✅ Advanced filters (1 week)

**Deploy to production → Monitor usage**

---

### **Phase 4: Long-Term Wins (Week 7-10)**
10. ✅ Collaboration (2 weeks)
11. ✅ PDF viewer (2 weeks)

**Beta test → Gradual rollout**

---

## 🎯 **DECISION POINTS**

### **After Week 1:**
- [ ] Are users finding the new tabs intuitive?
- [ ] Is network view being used?
- [ ] Are notes easier to find?

**If YES:** Continue to Phase 2  
**If NO:** Iterate on Phase 1

---

### **After Week 3:**
- [ ] Are new users completing onboarding?
- [ ] Are they creating projects with content?
- [ ] Is the 6-tab structure clear?

**If YES:** Continue to Phase 3  
**If NO:** Improve onboarding flow

---

### **After Week 6:**
- [ ] Is global search being used?
- [ ] Are users finding what they need?
- [ ] Are filters helpful?

**If YES:** Continue to Phase 4  
**If NO:** Improve search relevance

---

## ✅ **SUCCESS CRITERIA**

### **Week 1 (Quick Wins):**
- [ ] Network view enabled and working
- [ ] 4 tabs implemented
- [ ] Users understand tab structure
- [ ] Notes easier to find

### **Week 3 (Medium Wins):**
- [ ] 80%+ complete onboarding
- [ ] 60%+ create first collection
- [ ] 6 tabs fully functional

### **Week 6 (Big Wins):**
- [ ] Global search returns relevant results
- [ ] 90%+ of searches successful
- [ ] Filters used in 40%+ of searches

### **Week 10 (Long-Term Wins):**
- [ ] 30%+ of projects have collaborators
- [ ] 50%+ of papers opened in PDF viewer
- [ ] Complete research workspace achieved

---

## 🚀 **START HERE**

**Your first task (5 minutes):**

1. Open `frontend/src/app/project/[projectId]/page.tsx`
2. Find line ~960 (SpotifyProjectTabs)
3. Uncomment the network tab
4. Save and test
5. Deploy to staging

**Congratulations! You just enabled a key feature! 🎉**

**Next:** Create Research Question Tab (1 day)

---

**Questions? Start with Week 1 and iterate based on feedback!** 🚀

