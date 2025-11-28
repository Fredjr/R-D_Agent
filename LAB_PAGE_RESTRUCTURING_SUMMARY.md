# Lab Page Restructuring Summary

**Date**: 2025-11-28  
**Status**: Assessment Phase - NO CODING YET  
**Scope**: Lab Page UI/UX Restructuring

---

## 📊 **Visual Comparison**

### **CURRENT: Project-Scoped Lab (Sub-Tab)**

```
Project Workspace → Lab Tab
├── Sub-Tabs (3)
│   ├── Protocols (beta)
│   ├── Experiments (beta)
│   └── Summaries (beta)
└── Project-specific content
```

### **TARGET: Global Lab Page (Standalone)**

```
/lab (Top-Level Navigation)
├── Tabs (3)
│   ├── Protocols (5) - All projects
│   ├── Experiments (8) - All projects
│   └── Data Management - File storage
└── Global content with project filter
```

---

## 🎯 **Key Changes**

### **1. Scope Change: Project-Scoped → Global**

**Current**: Lab features are **project-specific**
- Access: `/project/[projectId]` → Lab tab
- Content: Only protocols/experiments for that project
- Navigation: Within project workspace

**Target**: Lab page is **global**
- Access: `/lab` (top-level navigation)
- Content: All protocols/experiments across all projects
- Navigation: Main navigation bar
- Filter: By project (dropdown)

**Why This Matters**:
- **Discoverability**: Lab features are more visible
- **Cross-Project**: See all experiments in one place
- **Workflow**: Researchers work across multiple projects

### **2. Tab Structure**

| Current | Target | Change |
|---------|--------|--------|
| Protocols (beta) | Protocols (5) | Count badge instead of beta |
| Experiments (beta) | Experiments (8) | Count badge instead of beta |
| Summaries (beta) | Data Management | Complete replacement |

### **3. Protocols Tab Enhancements**

**Add**:
- ✅ Relevance score badge (95%)
- ✅ Protocol type badge (clinical_trial, in_vitro, in_vivo)
- ✅ Protocol Comparison section
- ✅ Key Insights section
- ✅ "Plan Experiment" button
- ✅ "Export to PDF" button
- ✅ "Copy to Clipboard" button
- ✅ Filters (Type, Sort)
- ✅ "Extract Protocol from Paper" button

### **4. Experiments Tab Enhancements**

**Add**:
- ✅ Status indicator (pulsing dot: orange/green/gray)
- ✅ Progress bar (% complete)
- ✅ Detail boxes (3 metrics: IC50, Replicates, R²)
- ✅ "Continue Experiment" button
- ✅ "Log Data" button
- ✅ "View Results" button
- ✅ "Pause" button
- ✅ Project filter
- ✅ "New Experiment" button

### **5. Data Management Tab (NEW)**

**Replace Summaries with**:
- ✅ Raw Data Files (45 files, 2.3 GB)
- ✅ Analysis Results (12 files, 156 MB)
- ✅ Photos & Images (23 files, 87 MB)
- ✅ File upload/download
- ✅ Bulk actions (Export All ZIP, Clean Up, Backup)

---

## 📋 **Tab-by-Tab Breakdown**

### **Tab 1: Protocols**

**Current**:
```
Protocol Card:
├── Icon (gradient purple)
├── Title
├── Article title
├── Context-aware badge
├── View Details button
└── Delete button
```

**Target**:
```
Protocol Card:
├── Icon (gradient purple)
├── Title
├── Badges (Relevance 95%, Type, AI)
├── Description
├── Protocol Comparison section
├── Key Insights section
├── Materials section
└── 4 Actions (View, Plan Experiment, Export, Copy)
```

**Changes**:
- ✅ Add relevance score (95%)
- ✅ Add protocol type (clinical_trial, in_vitro, in_vivo)
- ✅ Add Protocol Comparison section
- ✅ Add Key Insights section
- ✅ Add 3 new action buttons

### **Tab 2: Experiments**

**Current**:
```
Experiment Card:
├── Title
├── Protocol name
├── Status badge (draft, approved, in_progress, completed, cancelled)
├── Timeline (start date, duration, budget)
└── View Details button
```

**Target**:
```
Experiment Card:
├── Status indicator (pulsing dot)
├── Title
├── Protocol name
├── Project name
├── Meta info (Started, Day X/Y)
├── Status badge (In Progress, Completed, Planned)
├── Progress bar (% complete)
├── 3 Detail boxes (IC50: 2.3, Replicates: 3/3, R²: 0.98)
└── 4 Actions (Continue, Log Data, View Results, Pause)
```

**Changes**:
- ✅ Add status indicator (pulsing dot)
- ✅ Add progress bar (% complete)
- ✅ Add 3 detail boxes (metrics)
- ✅ Add 4 new action buttons

### **Tab 3: Data Management** (NEW)

**Current** (Summaries):
```
Summaries Tab:
├── Project summary text
├── Key findings
├── Protocol insights
├── Experiment status
├── Next steps
└── Research journey timeline
```

**Target** (Data Management):
```
Data Management Tab:
├── Raw Data Files (45 files, 2.3 GB)
│   ├── File items (icon, name, experiment, size, date)
│   ├── Download/View buttons
│   └── Upload button
├── Analysis Results (12 files, 156 MB)
│   ├── File items (icon, name, analysis, size, date)
│   ├── Download/View buttons
│   └── Upload button
├── Photos & Images (23 files, 87 MB)
│   ├── File items (icon, name, experiment, size, date)
│   ├── Download/View buttons
│   └── Upload button
└── Bulk actions (Export All ZIP, Clean Up, Backup)
```

**Changes**:
- ❌ Remove: Summaries tab (move to Project Workspace → Overview)
- ✅ Add: Data Management tab with file storage
- ✅ Add: 3 file sections (Raw Data, Analysis, Photos)
- ✅ Add: File upload/download
- ✅ Add: Bulk actions

---

## 🏗️ **Implementation Checklist**

### **Phase 1: Create Global Lab Page** (2-3 days)
- [ ] Create `frontend/src/app/lab/page.tsx`
- [ ] Add Lab to main navigation (Home, Discover, Collections, Projects, Lab)
- [ ] Create 3 tabs (Protocols, Experiments, Data Management)
- [ ] Add project filter dropdown
- [ ] Update API endpoints to support global view

### **Phase 2: Enhance Protocol Cards** (2-3 days)
- [ ] Add `relevance_score` field to Protocol model
- [ ] Add `protocol_type` field (clinical_trial, in_vitro, in_vivo)
- [ ] Add `protocol_comparison` field
- [ ] Add `key_insights` field (array)
- [ ] Update protocol card UI with new sections
- [ ] Add "Plan Experiment" button
- [ ] Add "Export to PDF" button
- [ ] Add "Copy to Clipboard" button
- [ ] Add filters (Type, Sort)
- [ ] Add "Extract Protocol from Paper" button

### **Phase 3: Enhance Experiment Cards** (2-3 days)
- [ ] Add `progress_percentage` field to Experiment model
- [ ] Add `data_points_collected` and `data_points_total` fields
- [ ] Add `metrics` field (JSON: IC50, Replicates, R², etc.)
- [ ] Add status indicator (pulsing dot) to UI
- [ ] Add progress bar to UI
- [ ] Add 3 detail boxes to UI
- [ ] Add "Continue Experiment" button
- [ ] Add "Log Data" button
- [ ] Add "View Results" button
- [ ] Add "Pause" button
- [ ] Add "New Experiment" button

### **Phase 4: Add Data Management Tab** (3-4 days)
- [ ] Create `lab_files` table in database
- [ ] Create API endpoints:
  - [ ] `GET /lab/files` - List all files
  - [ ] `POST /lab/files` - Upload file
  - [ ] `GET /lab/files/{file_id}` - Download file
  - [ ] `DELETE /lab/files/{file_id}` - Delete file
  - [ ] `POST /lab/files/export-all` - Export all as ZIP
- [ ] Create Data Management tab UI
- [ ] Add 3 file sections (Raw Data, Analysis, Photos)
- [ ] Add file upload component
- [ ] Add file list component
- [ ] Add bulk actions (Export All, Clean Up, Backup)

### **Phase 5: Update Project Workspace** (1-2 days)
- [ ] Decide: Remove Lab tab or keep as summary?
- [ ] If keep: Add "Go to Lab" link to global page
- [ ] If remove: Redirect to `/lab?project={id}`
- [ ] Move Summaries content to Overview tab

### **Phase 6: Testing** (2-3 days)
- [ ] Test global Lab page
- [ ] Test project filter
- [ ] Test protocol enhancements
- [ ] Test experiment enhancements
- [ ] Test data management
- [ ] Test file upload/download
- [ ] Test bulk actions
- [ ] Deploy to production

---

## 🚨 **Key Decision Points**

### **Decision 1: Lab Scope**

**Question**: Should Lab be global or project-scoped?

**Options**:
- **A**: Global only (target) - Remove Lab tab from Project Workspace
- **B**: Project-scoped only (current) - Ignore global Lab page
- **C**: Hybrid - Global Lab page + Project-specific Lab tab

**Recommendation**: **Option C (Hybrid)**
- Global Lab page for cross-project view
- Project Lab tab for project-specific quick access
- "Go to Lab" link from project to global page

### **Decision 2: Summaries Tab**

**Question**: What happens to Summaries tab?

**Options**:
- **A**: Remove Summaries (move to Project Workspace → Overview)
- **B**: Keep Summaries as 4th tab in Lab
- **C**: Move Summaries to Analysis tab in Project Workspace

**Recommendation**: **Option A (Remove)**
- Summaries are project-specific, not lab-specific
- Move to Project Workspace → Overview tab
- Data Management is more relevant for Lab page

### **Decision 3: Data Management Scope**

**Question**: Should Data Management be global or project-scoped?

**Options**:
- **A**: Global (all files across all projects)
- **B**: Project-scoped (files for selected project only)
- **C**: Hybrid (global view with project filter)

**Recommendation**: **Option C (Hybrid)**
- Default: Show all files
- Filter: By project, experiment, file type
- Bulk actions: Apply to filtered files only

---

## 📊 **Progress Tracking**

```
Page Analysis Progress: 5/5 pages (100%)

Home        ████████████████████ 100% ✅
Discover    ████████████████████ 100% ✅
Collections ████████████████████ 100% ✅
Projects    ████████████████████ 100% ✅
Lab         ████████████████████ 100% ✅
```

---

## 🎯 **Next Steps**

1. ✅ **All Page Analyses Complete**
2. ⏳ **Create Comprehensive Implementation Plan** (next task)
3. ⏳ **Get User Approval on Key Decisions**
4. ⏳ **Begin Implementation** (after approval)

---

**Status**: ✅ **ALL 5 PAGES ANALYZED - READY FOR COMPREHENSIVE PLAN**  
**Next**: Create master implementation plan covering all pages


