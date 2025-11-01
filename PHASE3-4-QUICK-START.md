# 🚀 PHASE 3 & 4 - QUICK START GUIDE

**Status:** ✅ Ready to Begin  
**Timeline:** 6 weeks  
**Current:** Phase 2 Complete (95.45% pass rate)

---

## 📋 EXECUTIVE SUMMARY

### **What We're Building:**

**Phase 3 (Weeks 5-6): Search & Discoverability**
- 🔍 Global search across all content (Cmd+K)
- 🎯 Advanced filters for each tab
- ⚡ Real-time search as you type
- 📊 Categorized results

**Phase 4 (Weeks 7-10): Collaboration & Reading**
- 👥 Invite collaborators by email
- 🔐 Role-based permissions (owner/editor/viewer)
- 📄 Integrated PDF viewer
- 📚 Reading list & progress tracking

---

## 🎯 WEEK-BY-WEEK BREAKDOWN

### **WEEK 5: Global Search**

**Day 1-2: Backend**
- [ ] Expand `/projects/{project_id}/search` endpoint
- [ ] Add papers search (title, abstract, authors, journal)
- [ ] Add collections search (name, description)
- [ ] Add notes search (content, tags, note_type)
- [ ] Test with curl/Postman

**Day 3-5: Frontend**
- [ ] Create `GlobalSearch.tsx` component
- [ ] Create `useDebounce.ts` hook
- [ ] Add Cmd+K keyboard shortcut
- [ ] Integrate into project page
- [ ] Test search functionality

**Day 6-7: Polish & Test**
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add recent searches
- [ ] Create test script
- [ ] Deploy to production

---

### **WEEK 6: Advanced Filters**

**Day 8-10: Filter Components**
- [ ] Create `FilterPanel.tsx` component
- [ ] Create `FilterChips.tsx` component
- [ ] Add filters to ExploreTab (collection, year, citations)
- [ ] Add filters to CollectionsTab (size, date)
- [ ] Test filter functionality

**Day 11-14: Integration & Testing**
- [ ] Save filter presets
- [ ] Add "Clear all filters" button
- [ ] Test filter combinations
- [ ] Create test script
- [ ] Deploy to production

---

### **WEEK 7-8: Collaboration**

**Day 15-18: Backend**
- [ ] Create `POST /projects/{project_id}/collaborators` endpoint
- [ ] Create `GET /projects/{project_id}/collaborators` endpoint
- [ ] Create `PUT /projects/{project_id}/collaborators/{id}` endpoint
- [ ] Create `DELETE /projects/{project_id}/collaborators/{id}` endpoint
- [ ] Test with curl/Postman

**Day 19-24: Frontend**
- [ ] Create `InviteModal.tsx` component
- [ ] Create `CollaboratorsList.tsx` component
- [ ] Add "Share Project" button to Research Question tab
- [ ] Add role badges and permissions UI
- [ ] Test collaboration flow

**Day 25-28: Polish & Test**
- [ ] Add email notifications (optional)
- [ ] Add activity feed for collaborator actions
- [ ] Beta test with 10 users
- [ ] Create test script
- [ ] Deploy to production

---

### **WEEK 9-10: PDF Viewer**

**Day 29-30: Backend**
- [ ] Create `GET /articles/{pmid}/pdf-url` endpoint
- [ ] Integrate PubMed Central API
- [ ] Integrate Unpaywall API
- [ ] Add DOI resolver fallback
- [ ] Test PDF URL retrieval

**Day 31-38: Frontend**
- [ ] Install react-pdf and pdfjs-dist
- [ ] Create `PDFViewer.tsx` component
- [ ] Add page navigation and zoom controls
- [ ] Create `ReadingList.tsx` component
- [ ] Add "Read PDF" button to paper cards
- [ ] Test PDF viewing

**Day 39-40: Polish & Deploy**
- [ ] Add highlight tool
- [ ] Add "Create note from highlight" feature
- [ ] Add reading progress tracking
- [ ] Create test script
- [ ] Deploy to production

---

## 🔧 TECHNICAL DETAILS

### **Backend Changes Required:**

**File:** `main.py`

**1. Expand Search Endpoint (Lines 6800-6881):**
```python
# Add papers search
papers = db.query(ArticleCollection, Article).join(
    Article, ArticleCollection.pmid == Article.pmid
).filter(
    ArticleCollection.project_id == project_id,
    or_(
        Article.title.ilike(f"%{q}%"),
        Article.abstract.ilike(f"%{q}%"),
        Article.authors.ilike(f"%{q}%")
    )
).limit(limit).all()

# Add collections search
collections = db.query(Collection).filter(
    Collection.project_id == project_id,
    or_(
        Collection.name.ilike(f"%{q}%"),
        Collection.description.ilike(f"%{q}%")
    )
).limit(limit).all()

# Add notes search
notes = db.query(Annotation).filter(
    Annotation.project_id == project_id,
    or_(
        Annotation.content.ilike(f"%{q}%"),
        Annotation.tags.ilike(f"%{q}%")
    )
).limit(limit).all()
```

**2. Add Collaboration Endpoints (New):**
```python
@app.post("/projects/{project_id}/collaborators")
@app.get("/projects/{project_id}/collaborators")
@app.put("/projects/{project_id}/collaborators/{collaborator_id}")
@app.delete("/projects/{project_id}/collaborators/{collaborator_id}")
```

**3. Add PDF URL Endpoint (New):**
```python
@app.get("/articles/{pmid}/pdf-url")
```

---

### **Frontend Files to Create:**

**Phase 3:**
- `frontend/src/components/search/GlobalSearch.tsx`
- `frontend/src/components/search/SearchResults.tsx`
- `frontend/src/hooks/useDebounce.ts`
- `frontend/src/components/filters/FilterPanel.tsx`
- `frontend/src/components/filters/FilterChips.tsx`

**Phase 4:**
- `frontend/src/components/collaboration/InviteModal.tsx`
- `frontend/src/components/collaboration/CollaboratorsList.tsx`
- `frontend/src/components/collaboration/PermissionsManager.tsx`
- `frontend/src/components/reading/PDFViewer.tsx`
- `frontend/src/components/reading/HighlightTool.tsx`
- `frontend/src/components/reading/ReadingList.tsx`

---

## 📊 SUCCESS CRITERIA

### **Phase 3 Checklist:**
- [ ] Can search across all content types (papers, collections, notes, reports, analyses)
- [ ] Cmd+K opens search modal
- [ ] Search returns results in < 1 second
- [ ] Results are categorized by type
- [ ] Clicking result navigates to correct tab and item
- [ ] Filters work on each tab
- [ ] Active filters show as chips
- [ ] Can clear all filters

### **Phase 4 Checklist:**
- [ ] Can invite collaborators by email
- [ ] Can assign roles (editor/viewer)
- [ ] Can change collaborator roles (owner only)
- [ ] Can remove collaborators (owner only)
- [ ] Collaborators can view project based on permissions
- [ ] Can open PDF viewer for papers
- [ ] PDF viewer shows pages correctly
- [ ] Can navigate pages and zoom
- [ ] Can add papers to reading list
- [ ] Reading progress is tracked

---

## 🧪 TESTING STRATEGY

### **Phase 3 Tests:**

**Test Script:** `frontend/public/phase3-search-test.js`

```javascript
// Test 1: Global search opens with Cmd+K
// Test 2: Search returns papers
// Test 3: Search returns collections
// Test 4: Search returns notes
// Test 5: Search returns reports
// Test 6: Search returns analyses
// Test 7: Clicking result navigates correctly
// Test 8: Filters work on Explore tab
// Test 9: Filters work on Collections tab
// Test 10: Can clear all filters
```

### **Phase 4 Tests:**

**Test Script:** `frontend/public/phase4-collaboration-test.js`

```javascript
// Test 1: Can open invite modal
// Test 2: Can invite collaborator
// Test 3: Collaborator appears in list
// Test 4: Can change collaborator role
// Test 5: Can remove collaborator
// Test 6: PDF viewer opens
// Test 7: PDF pages load
// Test 8: Can navigate pages
// Test 9: Can add to reading list
// Test 10: Reading progress tracked
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Before Each Deployment:**
- [ ] Run test script locally
- [ ] Check console for errors
- [ ] Test on mobile and desktop
- [ ] Verify backend endpoints work
- [ ] Check database migrations (if any)

### **Deployment Steps:**
1. Commit changes with descriptive message
2. Push to main branch
3. Wait for Vercel deployment (frontend)
4. Wait for Railway deployment (backend)
5. Run test script on production
6. Monitor error logs
7. Check user feedback

---

## 📞 NEXT STEPS

### **Immediate Actions:**

1. **Review Plan:**
   - Read `PHASE3-4-IMPLEMENTATION-PLAN.md` in detail
   - Confirm timeline and priorities
   - Identify any blockers

2. **Set Up Environment:**
   - Ensure backend is running locally
   - Ensure frontend is running locally
   - Test current search endpoint

3. **Start Week 5 Day 1:**
   - Open `main.py`
   - Locate search endpoint (line 6800)
   - Begin expanding search functionality

4. **Create Branch:**
   ```bash
   git checkout -b phase3-global-search
   ```

---

## 💡 KEY INSIGHTS

### **What Makes This Different:**

**ResearchRabbit:**
- Beautiful discovery
- No note-taking
- No collaboration
- No integrated reading

**R&D Agent (After Phase 3 & 4):**
- ✅ Beautiful discovery
- ✅ Integrated notes
- ✅ Team collaboration
- ✅ Integrated reading
- ✅ Complete research workspace

### **Our Competitive Advantage:**

> **"ResearchRabbit helps you discover papers. R&D Agent helps you complete your research."**

After Phase 3 & 4, we'll have:
1. **Better Search** - Across all content, not just papers
2. **Better Organization** - Collections + notes + reports
3. **Better Collaboration** - Real-time team research
4. **Better Reading** - Integrated PDF viewer with highlights

---

## 📚 REFERENCE DOCUMENTS

- `PHASE3-4-IMPLEMENTATION-PLAN.md` - Detailed technical plan
- `COMPLETE_INTEGRATION_ROADMAP.md` - Full roadmap
- `EXECUTIVE_SUMMARY.md` - Product positioning
- `ACTION_PLAN_PRIORITIZED.md` - Prioritized tasks
- `PHASE2-WEEK2-TEST-ANALYSIS.md` - Phase 2 completion report

---

**Ready to start Week 5? Let's build! 🚀**

