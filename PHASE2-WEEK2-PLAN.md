# 🚀 PHASE 2 WEEK 2: COMPLETE 6-TAB STRUCTURE

**Timeline:** Week 2 (5-7 days)  
**Priority:** HIGH  
**Goal:** Complete the workflow-aligned tab structure with Analysis & Progress tabs

**Based on:** `INTEGRATION_PLAN_PHASE_2.md` and `COMPLETE_INTEGRATION_ROADMAP.md`

---

## 📊 CURRENT STATUS

### **✅ Phase 1 Week 1 Complete (4 tabs):**
1. ✅ **Research Question** - Project overview + objective + stats
2. ✅ **Explore Papers** - Network view + PubMed search
3. ✅ **My Collections** - Organized papers
4. ✅ **Notes & Ideas** - Hierarchical notes with 12 filters

**Test Results:** 100% pass rate (31/31 tests) ✅

### **🎯 Phase 2 Week 2 Goals (2 remaining tabs):**
5. ⭐ **Analysis** - Reports + Deep Dives combined
6. ⭐ **Progress** - Activity timeline + metrics

---

## 🎯 OBJECTIVES

Complete the 6-tab structure as defined in the original roadmap:

**New Tab Structure (from INTEGRATION_PLAN_PHASE_2.md):**
```
1. 🎯 Research Question ✅ (Week 1)
2. 🔍 Explore Papers ✅ (Week 1)
3. 📚 My Collections ✅ (Week 1)
4. 📝 Notes & Ideas ✅ (Week 1)
5. 📊 Analysis ⭐ (Week 2)
6. 📈 Progress ⭐ (Week 2)
```

**Benefits:**
- Clear workflow: Question → Explore → Organize → Note → Analyze → Track
- Each tab has single, clear purpose
- Matches researcher thought process
- All content has a clear home

---

## 🛠️ IMPLEMENTATION TASKS

### **Task 2.1: Create Analysis Tab** (Days 1-3)

**Goal:** Combine Reports + Deep Dives into unified view

**File to Create:** `frontend/src/components/project/AnalysisTab.tsx`

**Component Template (from INTEGRATION_PLAN_PHASE_2.md):**
```typescript
'use client';

import React, { useState } from 'react';
import { DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface AnalysisTabProps {
  project: any;
  onGenerateReport?: () => void;
  onGenerateDeepDive?: () => void;
}

export function AnalysisTab({ project, onGenerateReport, onGenerateDeepDive }: AnalysisTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'reports' | 'deep-dives'>('all');
  
  // Combine reports and deep dives
  const allAnalyses = [
    ...(project.reports || []).map((r: any) => ({ ...r, type: 'report' })),
    ...(project.deep_dives || []).map((d: any) => ({ ...d, type: 'deep-dive' }))
  ];
  
  const filteredAnalyses = allAnalyses.filter(a => 
    filterType === 'all' || a.type === filterType
  );
  
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>
        <div className="flex gap-3">
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📊 Generate Report
          </button>
          <button
            onClick={onGenerateDeepDive}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            🔬 Generate Deep Dive
          </button>
        </div>
      </div>
      
      {/* Filter */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Analyses</option>
          <option value="reports">Reports Only</option>
          <option value="deep-dives">Deep Dives Only</option>
        </select>
      </div>
      
      {/* Analysis Cards */}
      {filteredAnalyses.length > 0 ? (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis: any) => (
            <div key={analysis.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {analysis.type === 'report' ? (
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  ) : (
                    <BeakerIcon className="w-6 h-6 text-purple-600" />
                  )}
                  <div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      analysis.type === 'report' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {analysis.type === 'report' ? 'REPORT' : 'DEEP DIVE'}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {analysis.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {analysis.papers_count || 0} papers analyzed
              </p>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  View
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No analyses yet
          </h3>
          <p className="text-gray-600 mb-4">
            Generate reports and deep dives to analyze your research
          </p>
        </div>
      )}
    </div>
  );
}
```

**Features:**
- ✅ Unified view of reports and deep dives
- ✅ Visual badges to distinguish types
- ✅ Filter by type
- ✅ Generate new analysis buttons
- ✅ Empty state with guidance

---

### **Task 2.2: Create Progress Tab** (Days 3-5)

**Goal:** Show activity timeline and metrics

**File to Create:** `frontend/src/components/project/ProgressTab.tsx`

**Component Template:**
```typescript
'use client';

import React, { useState } from 'react';
import { BeakerIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, FolderIcon } from '@heroicons/react/24/outline';

interface ProgressTabProps {
  project: any;
}

export function ProgressTab({ project }: ProgressTabProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  // Calculate metrics
  const metrics = {
    papers: project.total_papers || 0,
    notes: project.annotations?.length || 0,
    collections: project.collections?.length || 0,
    reports: (project.reports?.length || 0) + (project.deep_dives?.length || 0)
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Papers</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.papers}</p>
          <p className="text-xs text-gray-500 mt-1">Total articles</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Notes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.notes}</p>
          <p className="text-xs text-gray-500 mt-1">Research notes</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FolderIcon className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Collections</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.collections}</p>
          <p className="text-xs text-gray-500 mt-1">Organized groups</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Analyses</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.reports}</p>
          <p className="text-xs text-gray-500 mt-1">Reports & deep dives</p>
        </div>
      </div>
      
      {/* Activity Timeline */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Activity timeline coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Features:**
- ✅ Metrics dashboard
- ✅ Time range selector
- ✅ Activity timeline (placeholder for now)
- ✅ Clean card layout

---

### **Task 2.3: Update Main Project Page** (Days 5-6)

**Goal:** Integrate Analysis and Progress tabs into main page

**File to Modify:** `frontend/src/app/project/[projectId]/page.tsx`

**Changes:**

1. **Update tab type definition:**
```typescript
const [activeTab, setActiveTab] = useState<
  'research-question' | 'explore' | 'collections' | 'notes' | 'analysis' | 'progress'
>('research-question');
```

2. **Add new tabs to SpotifyProjectTabs:**
```typescript
{
  id: 'analysis',
  label: 'Analysis',
  icon: '📊',
  count: (project.reports?.length || 0) + (project.deep_dives?.length || 0),
  description: 'Reports and deep dive analyses'
},
{
  id: 'progress',
  label: 'Progress',
  icon: '📈',
  description: 'Activity timeline and metrics'
}
```

3. **Add tab content rendering:**
```typescript
{activeTab === 'analysis' && (
  <AnalysisTab
    project={project}
    onGenerateReport={() => {/* existing logic */}}
    onGenerateDeepDive={() => {/* existing logic */}}
  />
)}

{activeTab === 'progress' && (
  <ProgressTab project={project} />
)}
```

---

## ✅ SUCCESS CRITERIA

**Phase 2 Complete When:**
- [ ] All 6 tabs implemented and functional
- [ ] Tab navigation smooth and intuitive
- [ ] Analysis tab shows reports + deep dives
- [ ] Progress tab shows metrics
- [ ] Users understand new structure (< 5 min to adapt)
- [ ] Time to find content reduced by 50%
- [ ] 100% test coverage maintained

---

## 📝 TESTING CHECKLIST

### **Manual Testing:**
- [ ] Navigate between all 6 tabs
- [ ] Analysis tab displays reports and deep dives
- [ ] Can filter analyses by type
- [ ] Progress tab shows correct metrics
- [ ] Tab counts update correctly
- [ ] Mobile responsive
- [ ] No console errors

### **Automated Testing:**
- [ ] Create test script for 6-tab structure
- [ ] Test tab navigation
- [ ] Test Analysis tab content
- [ ] Test Progress tab metrics
- [ ] Achieve 100% pass rate

---

## 📅 TIMELINE

**Day 1-2:** Create AnalysisTab component  
**Day 3-4:** Create ProgressTab component  
**Day 5:** Integrate tabs into main page  
**Day 6:** Testing and bug fixes  
**Day 7:** Deploy and monitor

---

## 🚀 NEXT STEPS

**Ready to start?** I'll begin with:
1. Create `AnalysisTab.tsx` component
2. Create `ProgressTab.tsx` component
3. Update main project page with 6-tab structure
4. Test and deploy

**Shall I proceed?**

