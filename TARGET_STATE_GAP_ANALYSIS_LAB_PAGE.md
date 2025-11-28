# Target State Gap Analysis: Lab Page

**Date**: 2025-11-28  
**Status**: Assessment Phase - NO CODING YET  
**Scope**: Lab Page UI/UX Restructuring

---

## 📋 **Executive Summary**

This document analyzes the gap between our **current Lab implementation** (project-scoped, within Project Workspace) and the **target Lab page** from the HTML/CSS mockup (global, standalone page). The target represents a **project-agnostic Lab page** with protocols, experiments, and data management accessible across all projects.

---

## 🎯 **Target State Overview (From HTML/CSS)**

### **Page Structure**
```
Lab Page (Global, Standalone)
├── Header (Erythos logo, navigation, user avatar)
├── Page Title ("🧪 Lab")
├── Subtitle ("Execute protocols and track your experiments")
├── Tabs (3 tabs)
│   ├── Protocols (5 protocols)
│   ├── Experiments (8 experiments)
│   └── Data Management (3 sections)
└── Tab Content (varies by tab)
```

### **Key Features**

#### **1. Page Header**
- **Title**: "🧪 Lab" (48px, bold)
- **Subtitle**: "Execute protocols and track your experiments"
- **Navigation**: Home, Discover, Collections, Projects, Lab (active)

#### **2. Tabs** (3 tabs)

**Tab 1: Protocols** (5 protocols)
- Controls bar (filters, "Extract Protocol from Paper" button)
- Protocol cards with:
  - Icon (gradient purple)
  - Title
  - Badges (Relevance %, Type, AI Context-Aware)
  - Description
  - Sections (Protocol Comparison, Key Insights, Materials)
  - 4 action buttons (View, Plan Experiment, Export, Copy)

**Tab 2: Experiments** (8 experiments)
- Controls bar (filters by status/project, "New Experiment" button)
- Experiment cards with:
  - Status indicator (pulsing dot: orange/green/gray)
  - Title, meta info, status badge
  - Progress bar (% complete)
  - 3 detail boxes (metrics like IC50, Replicates, R²)
  - 4 action buttons (Continue/View/Start, Log Data, View Results, Pause/Archive)

**Tab 3: Data Management**
- 3 sections:
  - Raw Data Files (45 files, 2.3 GB)
  - Analysis Results (12 files, 156 MB)
  - Photos & Images (23 files, 87 MB)
- File items with icon, name, meta, Download/View buttons
- Bulk actions (Export All, Clean Up, Backup)

---

## 🔍 **Current State Analysis**

### **Current Lab Implementation** (Project-Scoped)

#### **Location**: `/project/[projectId]` → Lab Tab → Sub-Tabs

#### **Structure**
```
Project Workspace → Lab Tab
├── Sub-Tabs (3 sub-tabs)
│   ├── Protocols (ProtocolsTab.tsx)
│   ├── Experiments (ExperimentPlansTab.tsx)
│   └── Summaries (SummariesTab.tsx)
└── Tab Content (project-specific)
```

#### **Key Features**
- ✅ Protocols tab with protocol cards
- ✅ Experiments tab with experiment plan cards
- ✅ Summaries tab with project analysis
- ✅ Protocol extraction from papers
- ✅ Experiment planning from protocols
- ✅ Status filtering (draft, approved, in_progress, completed, cancelled)
- ✅ Context-aware protocols (Week 19 feature)
- ✅ Enhanced protocol cards with evidence-based extraction

---

## 📊 **Detailed Gap Analysis**

### **1. Page Scope**

| Aspect | Current | Target | Gap |
|--------|---------|--------|-----|
| **Scope** | Project-specific | Global (all projects) | Major change |
| **Location** | `/project/[projectId]` → Lab tab | `/lab` (standalone page) | New route |
| **Access** | Within project workspace | Top-level navigation | Elevate |
| **Filtering** | By status | By status + project | Add project filter |

**Current**: Lab features are **project-scoped** - you access protocols/experiments within a specific project.

**Target**: Lab page is **global** - you see all protocols/experiments across all projects, with project filter.

**Decision Point**: Should Lab be global or project-scoped?
- **Option A**: Keep project-scoped (current) - simpler, but less discoverable
- **Option B**: Make global (target) - more discoverable, but requires project association
- **Option C**: Hybrid - Global Lab page + Project-specific Lab tab

### **2. Tab Structure**

| Aspect | Current | Target | Gap |
|--------|---------|--------|-----|
| **Number of Tabs** | 3 sub-tabs | 3 tabs | Aligned |
| **Tab Names** | Protocols, Experiments, Summaries | Protocols, Experiments, Data Management | Rename Summaries |
| **Tab Badges** | Beta badges | Count badges (5, 8) | Change badge type |
| **Tab Location** | Sub-tabs within Lab | Main tabs | Elevate |

**Current Tabs**:
1. Protocols (beta)
2. Experiments (beta)
3. Summaries (beta)

**Target Tabs**:
1. Protocols (5)
2. Experiments (8)
3. Data Management

**Mapping**:
- Protocols → Protocols ✅
- Experiments → Experiments ✅
- Summaries → Data Management (major change)

### **3. Protocols Tab**

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Protocol Cards** | ✅ Present | ✅ Present | Aligned |
| **Relevance Badge** | ❌ Not present | ✅ "95% Relevant" | Add |
| **Type Badge** | ❌ Not present | ✅ "clinical_trial", "in_vitro" | Add |
| **AI Badge** | ✅ "Context-Aware" | ✅ "AI Context-Aware" | Aligned |
| **Sections** | ✅ Materials, Procedure | ✅ Protocol Comparison, Key Insights, Materials | Add sections |
| **Actions** | ✅ View, Delete | ✅ View, Plan Experiment, Export, Copy | Add actions |
| **Filters** | ❌ Not present | ✅ Type, Sort | Add |
| **Extract Button** | ❌ Not present | ✅ "Extract Protocol from Paper" | Add |

**Current Protocol Card**:
- Icon (gradient purple)
- Title
- Article title
- Context-aware badge
- View Details button
- Delete button
- Extracted date

**Target Protocol Card**:
- Icon (gradient purple)
- Title
- Badges (Relevance %, Type, AI)
- Description
- Protocol Comparison section
- Key Insights section
- Materials section
- 4 action buttons (View, Plan Experiment, Export, Copy)

**Changes Needed**:
- ✅ Add relevance score (95%)
- ✅ Add protocol type (clinical_trial, in_vitro, in_vivo)
- ✅ Add Protocol Comparison section
- ✅ Add Key Insights section
- ✅ Add "Plan Experiment" button
- ✅ Add "Export to PDF" button
- ✅ Add "Copy to Clipboard" button
- ✅ Add filters (Type, Sort)
- ✅ Add "Extract Protocol from Paper" button

### **4. Experiments Tab**

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Experiment Cards** | ✅ Present | ✅ Present | Aligned |
| **Status Indicator** | ❌ Not present | ✅ Pulsing dot (orange/green/gray) | Add |
| **Progress Bar** | ❌ Not present | ✅ % complete | Add |
| **Detail Boxes** | ❌ Not present | ✅ 3 metrics (IC50, Replicates, R²) | Add |
| **Actions** | ✅ View, Delete | ✅ Continue/Start, Log Data, View Results, Pause/Archive | Add actions |
| **Filters** | ✅ Status | ✅ Status + Project | Add project filter |
| **New Button** | ❌ Not present | ✅ "New Experiment" | Add |

**Current Experiment Card**:
- Title
- Protocol name
- Status badge (draft, approved, in_progress, completed, cancelled)
- Timeline (start date, duration, budget)
- View Details button

**Target Experiment Card**:
- Status indicator (pulsing dot)
- Title
- Protocol name
- Project name
- Meta info (Started, Day X/Y)
- Status badge (In Progress, Completed, Planned)
- Progress bar (% complete)
- 3 detail boxes (IC50: 2.3, Replicates: 3/3, R²: 0.98)
- 4 action buttons (Continue, Log Data, View Results, Pause)

**Changes Needed**:
- ✅ Add status indicator (pulsing dot)
- ✅ Add progress bar (% complete)
- ✅ Add detail boxes (3 metrics)
- ✅ Add "Continue Experiment" button
- ✅ Add "Log Data" button
- ✅ Add "View Results" button
- ✅ Add "Pause" button
- ✅ Add project filter
- ✅ Add "New Experiment" button

### **5. Data Management Tab**

| Feature | Current (Summaries) | Target (Data Management) | Gap |
|---------|---------------------|--------------------------|-----|
| **Purpose** | Project analysis summary | File management | Complete change |
| **Content** | Summary text, key findings, next steps, timeline | Raw data, analysis results, photos | Different |
| **File Sections** | ❌ Not present | ✅ 3 sections (Raw Data, Analysis, Photos) | Add |
| **File Items** | ❌ Not present | ✅ File list with icon, name, meta, actions | Add |
| **Bulk Actions** | ❌ Not present | ✅ Export All, Clean Up, Backup | Add |

**Current Summaries Tab**:
- Project summary text
- Key findings (bullet points)
- Protocol insights
- Experiment status
- Next steps
- Research journey timeline

**Target Data Management Tab**:
- Raw Data Files (45 files, 2.3 GB)
  - File items (icon, name, experiment, size, date)
  - Download/View buttons
  - Upload button
- Analysis Results (12 files, 156 MB)
  - File items (icon, name, analysis, size, date)
  - Download/View buttons
  - Upload button
- Photos & Images (23 files, 87 MB)
  - File items (icon, name, experiment, size, date)
  - Download/View buttons
  - Upload button
- Bulk actions (Export All ZIP, Clean Up, Backup)

**Decision Point**: What happens to Summaries tab?
- **Option A**: Remove Summaries tab (move to Project Workspace → Overview)
- **Option B**: Keep Summaries as 4th tab in Lab
- **Option C**: Move Summaries to Analysis tab in Project Workspace

---

## 🏗️ **Architecture Changes Needed**

### **1. Create Global Lab Page**

**New Route**: `/lab` (standalone page)

**Components**:
- `frontend/src/app/lab/page.tsx` (new file)
- Lab page with 3 tabs (Protocols, Experiments, Data Management)
- Global view of all protocols/experiments across all projects

### **2. Update Project Workspace Lab Tab**

**Options**:
- **Option A**: Remove Lab tab from Project Workspace (redirect to `/lab?project={id}`)
- **Option B**: Keep Lab tab in Project Workspace (project-specific view)
- **Option C**: Hybrid - Lab tab shows summary, "Go to Lab" link to global page

### **3. Add Project Association**

**Database Changes**:
- Protocols already have `project_id` ✅
- Experiments already have `project_id` ✅
- Add project filter to API endpoints

**API Changes**:
- `GET /protocols` - Add `project_id` query param (optional)
- `GET /experiments` - Add `project_id` query param (optional)
- `GET /lab/files` - New endpoint for data management

### **4. Add Data Management Features**

**New Features**:
- File upload/download
- File organization (Raw Data, Analysis, Photos)
- File metadata (experiment, size, date)
- Bulk actions (Export All, Clean Up, Backup)

**Database Changes**:
- New table: `lab_files` (file_id, experiment_id, file_type, file_name, file_size, file_path, uploaded_at)

**API Changes**:
- `GET /lab/files` - List all files
- `POST /lab/files` - Upload file
- `GET /lab/files/{file_id}` - Download file
- `DELETE /lab/files/{file_id}` - Delete file
- `POST /lab/files/export-all` - Export all files as ZIP

### **5. Enhance Protocol Cards**

**Add Fields**:
- `relevance_score` (0-100)
- `protocol_type` (clinical_trial, in_vitro, in_vivo)
- `protocol_comparison` (text)
- `key_insights` (text array)

**Add Actions**:
- "Plan Experiment" button (create experiment from protocol)
- "Export to PDF" button
- "Copy to Clipboard" button

### **6. Enhance Experiment Cards**

**Add Fields**:
- `progress_percentage` (0-100)
- `data_points_collected` (int)
- `data_points_total` (int)
- `metrics` (JSON: IC50, Replicates, R², etc.)

**Add Actions**:
- "Continue Experiment" button
- "Log Data" button
- "View Results" button
- "Pause" button

---

## 📋 **Summary of Changes**

### **High Priority** (Core Structure)
1. ✅ Create global Lab page (`/lab`)
2. ✅ Add 3 tabs (Protocols, Experiments, Data Management)
3. ✅ Add project filter to Protocols and Experiments
4. ✅ Add Data Management tab with file upload/download

### **Medium Priority** (Feature Enhancements)
5. ✅ Add relevance score and protocol type to protocols
6. ✅ Add Protocol Comparison and Key Insights sections
7. ✅ Add progress bar and detail boxes to experiments
8. ✅ Add status indicator (pulsing dot) to experiments
9. ✅ Add "Plan Experiment" action to protocols
10. ✅ Add "Continue/Log Data/View Results/Pause" actions to experiments

### **Low Priority** (Polish)
11. ✅ Add filters (Type, Sort) to Protocols tab
12. ✅ Add "Extract Protocol from Paper" button
13. ✅ Add "New Experiment" button
14. ✅ Add bulk actions to Data Management

---

## 🚀 **Implementation Estimate**

**Total Effort**: 12-18 days

1. **Phase 1**: Create global Lab page (2-3 days)
2. **Phase 2**: Add project filter (1-2 days)
3. **Phase 3**: Enhance protocol cards (2-3 days)
4. **Phase 4**: Enhance experiment cards (2-3 days)
5. **Phase 5**: Add Data Management tab (3-4 days)
6. **Phase 6**: Testing (2-3 days)

---

**Status**: ✅ **LAB PAGE ANALYSIS COMPLETE - AWAITING DECISION ON SCOPE**

**Key Decision**: Should Lab be global (target) or project-scoped (current)?


