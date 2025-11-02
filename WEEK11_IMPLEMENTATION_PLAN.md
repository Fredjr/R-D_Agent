# 🎯 WEEK 11 IMPLEMENTATION PLAN - PDF READING FEATURES & ENHANCED ONBOARDING

**Date:** November 2, 2025  
**Timeline:** Week 11 (7 days)  
**Approach:** Incremental, test-driven, deploy after each phase

---

## 📊 CURRENT ARCHITECTURE ANALYSIS

### **✅ What We Have:**

#### **1. Onboarding (3 Steps - COMPLETE)**
- **Step 1:** Personal Information (name, category, role, institution)
- **Step 2:** Research Interests (12 topics, keywords, career stage)
- **Step 3:** First Action (search, import, trending, project)
- **Location:** `frontend/src/app/auth/complete-profile/page.tsx`
- **Components:** `StepIndicator`, `Step2ResearchInterests`, `Step3FirstAction`
- **Redirects:** Dashboard with URL params (`?action=create_project`)

#### **2. PDF Viewer (COMPLETE)**
- **Backend:** `/articles/{pmid}/pdf-url` endpoint (multi-source retrieval)
- **Frontend:** `PDFViewer` component with react-pdf
- **Features:** Page navigation, zoom, keyboard shortcuts
- **Location:** `frontend/src/components/reading/PDFViewer.tsx`
- **Integration:** ArticleCard "Read PDF" button

#### **3. Database Schema (COMPLETE)**
- **User:** `user_id`, `email`, `preferences` (JSON with research interests)
- **Project:** `project_id`, `project_name`, `description`, `owner_user_id`, `settings` (JSON)
- **Annotation:** `annotation_id`, `project_id`, `article_pmid`, `content`, `note_type`, `priority`, `status`
- **Collection:** `collection_id`, `project_id`, `collection_name`, `description`
- **Article:** `pmid`, `title`, `authors`, `journal`, `year`, `doi`

#### **4. Project Creation Flow (COMPLETE)**
- **Dashboard:** Modal with name + description
- **API:** `POST /api/proxy/projects` → `POST /projects` (backend)
- **Redirect:** `/project/{projectId}` after creation

### **⚠️ What's Missing:**

#### **1. PDF Annotations (NOT STARTED)**
- No highlight tool
- No text selection
- No annotations on PDF
- No link between highlights and notes

#### **2. Extended Onboarding (PARTIAL)**
- Steps 1-3 complete
- Steps 4-7 missing:
  - Step 4: Create first project
  - Step 5: Find seed paper
  - Step 6: Explore & organize
  - Step 7: Add first note

---

## 🚀 WEEK 11 IMPLEMENTATION PLAN

### **PHASE 1: PDF READING FEATURES (Days 1-3)**

#### **Day 1: Highlight Tool Backend**

**Goal:** Add database support for PDF highlights

**Tasks:**
1. **Update Annotation Model** (database.py)
   - Add `pdf_page` (INTEGER)
   - Add `pdf_coordinates` (JSONB) - stores {x, y, width, height}
   - Add `highlight_color` (VARCHAR(7)) - hex color
   - Add `highlight_text` (TEXT) - selected text

2. **Create Database Migration**
   - Migration script to add new columns
   - Test on local database
   - Deploy to Railway

3. **Update Backend Annotation Endpoint** (main.py)
   - Accept new fields in `POST /projects/{projectId}/annotations`
   - Return highlights with `GET /projects/{projectId}/annotations?article_pmid={pmid}`
   - Filter by article PMID

**Files to Modify:**
- `backend/database.py` (Annotation model)
- `backend/main.py` (annotation endpoints)
- `backend/models/annotation_models.py` (Pydantic models)

**Testing:**
- Create annotation with PDF coordinates
- Retrieve annotations for specific PMID
- Verify coordinates stored correctly

**Deploy:** Railway backend

---

#### **Day 2: Highlight Tool Frontend**

**Goal:** Implement text selection and highlight creation in PDF viewer

**Tasks:**
1. **Create HighlightTool Component**
   - Text selection detection
   - Color picker (5 colors: yellow, green, blue, pink, orange)
   - "Create Highlight" button
   - Position tooltip near selection

2. **Update PDFViewer Component**
   - Add highlight layer overlay
   - Render existing highlights from database
   - Handle text selection events
   - Save highlight to backend

3. **Highlight Data Structure**
   ```typescript
   interface Highlight {
     annotation_id: string;
     pdf_page: number;
     pdf_coordinates: {
       x: number;
       y: number;
       width: number;
       height: number;
     };
     highlight_color: string;
     highlight_text: string;
     content: string; // Note content (optional)
   }
   ```

**Files to Create:**
- `frontend/src/components/reading/HighlightTool.tsx`
- `frontend/src/components/reading/HighlightLayer.tsx`

**Files to Modify:**
- `frontend/src/components/reading/PDFViewer.tsx`

**Testing:**
- Select text in PDF
- Create highlight with color
- Verify highlight appears on PDF
- Reload PDF and verify highlights persist

**Deploy:** Vercel frontend

---

#### **Day 3: Annotations Sidebar**

**Goal:** Link highlights to notes with sidebar UI

**Tasks:**
1. **Create AnnotationsSidebar Component**
   - List all highlights for current article
   - Click highlight → scroll to page + highlight
   - Add note to highlight
   - Edit/delete highlight

2. **Integrate with PDFViewer**
   - Split view: PDF (70%) + Sidebar (30%)
   - Toggle sidebar visibility
   - Sync highlight selection

3. **Note Creation from Highlight**
   - Click "Add Note" on highlight
   - Pre-fill with highlighted text
   - Save as annotation with PDF coordinates
   - Link to article PMID

**Files to Create:**
- `frontend/src/components/reading/AnnotationsSidebar.tsx`
- `frontend/src/components/reading/HighlightNoteForm.tsx`

**Files to Modify:**
- `frontend/src/components/reading/PDFViewer.tsx`

**Testing:**
- Create highlight
- Add note to highlight
- Navigate between highlights
- Verify notes saved to database

**Deploy:** Vercel frontend + Railway backend

---

### **PHASE 2: ENHANCED ONBOARDING STEPS 4-5 (Days 4-5)**

#### **Day 4: Step 4 - Create First Project**

**Goal:** Guide users to create their first project during onboarding

**Tasks:**
1. **Create Step4FirstProject Component**
   - Pre-filled project name from research interests
   - Research question input (required)
   - Description input (optional)
   - "Create Project" button
   - Loading state during creation

2. **Project Name Suggestions**
   - Based on selected topics from Step 2
   - Examples:
     - "Cancer Immunotherapy" → "Cancer Immunotherapy Research"
     - "CRISPR" → "CRISPR Gene Editing Project"
     - Multiple topics → "Multi-Topic Research Project"

3. **Research Question Guidance**
   - Placeholder examples
   - Character count (min 20, max 500)
   - Validation

4. **Update complete-profile/page.tsx**
   - Add Step 4 state
   - Store created project ID
   - Handle project creation API call

**Files to Create:**
- `frontend/src/components/onboarding/Step4FirstProject.tsx`

**Files to Modify:**
- `frontend/src/app/auth/complete-profile/page.tsx`

**API Integration:**
- `POST /api/proxy/projects`
- Store `project_id` in state
- Store research question in `project.settings.research_question`

**Testing:**
- Complete Steps 1-3
- Create project in Step 4
- Verify project created in database
- Verify research question saved

**Deploy:** Vercel frontend

---

#### **Day 5: Step 5 - Find Seed Paper**

**Goal:** Help users find their first paper to start research

**Tasks:**
1. **Create Step5SeedPaper Component**
   - Auto-suggested search query from research question
   - PubMed search integration
   - Display 5-10 results
   - Select one paper as "seed"
   - "Skip" option

2. **Search Query Generation**
   - Extract keywords from research question
   - Use research interests as fallback
   - Example: "What are the mechanisms of cancer immunotherapy?" → "cancer immunotherapy mechanisms"

3. **Paper Selection**
   - Radio button selection
   - Show title, authors, year, journal
   - Show abstract preview
   - "Select as Seed Paper" button

4. **Store Seed Paper**
   - Save to project settings: `project.settings.seed_pmid`
   - Save to project settings: `project.settings.seed_title`

**Files to Create:**
- `frontend/src/components/onboarding/Step5SeedPaper.tsx`

**Files to Modify:**
- `frontend/src/app/auth/complete-profile/page.tsx`

**API Integration:**
- `GET /api/proxy/pubmed/search?q={query}&limit=10`
- `PUT /api/proxy/projects/{projectId}` (update settings)

**Testing:**
- Complete Steps 1-4
- Search for papers
- Select seed paper
- Verify seed paper saved to project
- Test skip option

**Deploy:** Vercel frontend

---

### **PHASE 3: ENHANCED ONBOARDING STEPS 6-7 (Days 6-7)**

#### **Day 6: Step 6 - Explore & Organize**

**Goal:** Guide users to explore network and create first collection

**Tasks:**
1. **Create Step6ExploreOrganize Component**
   - Show network view of seed paper
   - Display similar papers (citations)
   - Multi-select papers (checkboxes)
   - "Create Collection" form
   - Collection name input
   - "Add Selected Papers" button

2. **Network Preview**
   - Simplified network view (no full ReactFlow)
   - List view with checkboxes
   - Show 10-15 related papers
   - Fetch from `/api/proxy/articles/{pmid}/citations`

3. **Collection Creation**
   - Pre-filled name: "{Topic} Collection"
   - Add selected papers to collection
   - Create collection via API

**Files to Create:**
- `frontend/src/components/onboarding/Step6ExploreOrganize.tsx`

**Files to Modify:**
- `frontend/src/app/auth/complete-profile/page.tsx`

**API Integration:**
- `GET /api/proxy/articles/{pmid}/citations?limit=15`
- `POST /api/proxy/projects/{projectId}/collections`
- `POST /api/proxy/projects/{projectId}/collections/{collectionId}/articles`

**Testing:**
- Complete Steps 1-5
- View related papers
- Select papers
- Create collection
- Verify collection created
- Verify papers added

**Deploy:** Vercel frontend

---

#### **Day 7: Step 7 - Add First Note**

**Goal:** Teach users how to create contextual notes

**Tasks:**
1. **Create Step7FirstNote Component**
   - Show seed paper details
   - Note type selector (7 types)
   - Priority selector (4 levels)
   - Note content textarea
   - "Create Note" button
   - "Complete Onboarding" button

2. **Note Type Education**
   - Show examples for each type
   - Tooltips explaining when to use each
   - Default to "finding" type

3. **Completion & Redirect**
   - Mark onboarding complete
   - Redirect to project page: `/project/{projectId}?onboarding=complete`
   - Show success message

**Files to Create:**
- `frontend/src/components/onboarding/Step7FirstNote.tsx`

**Files to Modify:**
- `frontend/src/app/auth/complete-profile/page.tsx`

**API Integration:**
- `POST /api/proxy/projects/{projectId}/annotations`
- Link to seed paper PMID

**Testing:**
- Complete Steps 1-6
- Create first note
- Complete onboarding
- Verify redirect to project
- Verify note saved

**Deploy:** Vercel frontend

---

## 📋 TESTING STRATEGY

### **After Each Day:**
1. **Local Testing**
   - Test new feature locally
   - Verify API integration
   - Check database changes

2. **Deploy**
   - Deploy backend to Railway (if backend changes)
   - Deploy frontend to Vercel
   - Wait for deployment to complete

3. **Production Testing**
   - Test on Vercel 85
   - Run testing script (if applicable)
   - Verify no regressions

### **End of Phase Testing:**
1. **Phase 1 (Day 3):**
   - Test complete PDF annotation flow
   - Create highlights, add notes, verify persistence
   - Test across multiple PMIDs

2. **Phase 2 (Day 5):**
   - Test Steps 4-5 onboarding flow
   - Create project, find seed paper
   - Verify data saved correctly

3. **Phase 3 (Day 7):**
   - Test complete onboarding flow (Steps 1-7)
   - Verify user lands on project page
   - Verify all data saved (project, seed, collection, note)

---

## 🎯 SUCCESS CRITERIA

### **Phase 1: PDF Reading Features**
- ✅ Users can highlight text in PDFs
- ✅ Highlights persist across sessions
- ✅ Users can add notes to highlights
- ✅ Annotations sidebar shows all highlights
- ✅ Click highlight → navigate to page

### **Phase 2: Onboarding Steps 4-5**
- ✅ Users can create first project
- ✅ Research question saved to project
- ✅ Users can search for seed paper
- ✅ Seed paper saved to project settings

### **Phase 3: Onboarding Steps 6-7**
- ✅ Users can explore related papers
- ✅ Users can create first collection
- ✅ Users can add first note
- ✅ Onboarding completes successfully
- ✅ Users land on project page

---

## 📊 DEPLOYMENT CHECKLIST

### **After Each Phase:**
- [ ] Backend changes deployed to Railway
- [ ] Frontend changes deployed to Vercel
- [ ] Database migrations run successfully
- [ ] No build errors
- [ ] No runtime errors in production
- [ ] Testing script updated (if needed)
- [ ] Documentation updated

---

## 🚨 RISK MITIGATION

### **Potential Issues:**

1. **PDF Text Selection**
   - **Risk:** react-pdf text selection may be complex
   - **Mitigation:** Use react-pdf's built-in text layer, test early

2. **Coordinate Mapping**
   - **Risk:** PDF coordinates may not map correctly across zoom levels
   - **Mitigation:** Store normalized coordinates (0-1 range), scale on render

3. **Onboarding State Management**
   - **Risk:** Complex state across 7 steps
   - **Mitigation:** Use clear state structure, test navigation thoroughly

4. **API Failures**
   - **Risk:** PubMed search may fail during onboarding
   - **Mitigation:** Add error handling, allow skip options

---

**Ready to start implementation!** 🚀

