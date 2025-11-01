# PHASE 2: Information Architecture Redesign

**Timeline:** Week 3-4 (8-10 days)  
**Priority:** HIGH  
**Goal:** Align tab structure with research workflow

---

## 🎯 **Problem Statement**

**Current Tab Structure:**
```
1. Overview - Mix of reports, deep dives, stats
2. Collections - Good!
3. Network View - DISABLED (commented out)
4. Activity & Notes - Mix of activity feed and notes
```

**Issues:**
- "Overview" is vague - what am I looking at?
- "Reports" vs "Deep Dives" - users don't understand difference
- Network View disabled - key feature hidden
- Activity & Notes mixed - different purposes
- No clear research workflow

**User Confusion:**
- "Where do I start exploring papers?"
- "Where are my notes?"
- "What's the difference between a report and deep dive?"
- "How do I see my research progress?"

---

## 🎯 **Solution: Workflow-Aligned Tabs**

**New Tab Structure:**
```
1. 🎯 Research Question - Project overview + objective
2. 🔍 Explore Papers - Network view + discovery
3. 📚 My Collections - Organized papers
4. 📝 Notes & Ideas - All notes, hierarchical
5. 📊 Analysis - Reports + Deep Dives combined
6. 📈 Progress - Activity + metrics
```

**Benefits:**
- Clear workflow: Question → Explore → Organize → Note → Analyze → Track
- Each tab has single, clear purpose
- Matches researcher thought process
- Network view prominent (not hidden)
- Notes separate from activity

---

## 📋 **Implementation Tasks**

### **Task 2.1: Update Tab Configuration** (Day 9)

**File:** `frontend/src/app/project/[projectId]/page.tsx`

**Current Code (lines 131, 952-978):**
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'network' | 'activity'>('overview');

// ...

<SpotifyProjectTabs
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab as 'overview' | 'collections' | 'network' | 'activity')}
  tabs={[
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      count: (project.reports?.length || 0) + ((project as any).deep_dives?.length || 0)
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: '📁',
      count: (project as any).collections?.length || 0
    },
    {
      id: 'activity',
      label: 'Activity & Notes',
      icon: '📝',
      count: (project as any).annotations?.length || 0
    }
  ]}
/>
```

**New Code:**
```typescript
const [activeTab, setActiveTab] = useState<
  'research-question' | 'explore' | 'collections' | 'notes' | 'analysis' | 'progress'
>('research-question');

// ...

<SpotifyProjectTabs
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab as any)}
  tabs={[
    {
      id: 'research-question',
      label: 'Research Question',
      icon: '🎯',
      description: 'Project overview and objectives'
    },
    {
      id: 'explore',
      label: 'Explore Papers',
      icon: '🔍',
      count: (project as any).total_papers || 0,
      description: 'Discover and explore related papers'
    },
    {
      id: 'collections',
      label: 'My Collections',
      icon: '📚',
      count: (project as any).collections?.length || 0,
      description: 'Organized paper collections'
    },
    {
      id: 'notes',
      label: 'Notes & Ideas',
      icon: '📝',
      count: (project as any).annotations?.length || 0,
      description: 'All your research notes'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: '📊',
      count: (project.reports?.length || 0) + ((project as any).deep_dives?.length || 0),
      description: 'Reports and deep dive analyses'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: '📈',
      description: 'Activity timeline and metrics'
    }
  ]}
/>
```

---

### **Task 2.2: Create Research Question Tab** (Day 10)

**File to Create:** `frontend/src/components/project/ResearchQuestionTab.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { PencilIcon, BeakerIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ResearchQuestionTabProps {
  project: any;
  onUpdateProject: (updates: any) => Promise<void>;
}

export function ResearchQuestionTab({ project, onUpdateProject }: ResearchQuestionTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState(
    project.settings?.research_question || ''
  );
  const [description, setDescription] = useState(project.description || '');

  const handleSave = async () => {
    await onUpdateProject({
      description,
      settings: {
        ...project.settings,
        research_question: researchQuestion
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Research Question Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Research Question</h2>
              <p className="text-sm text-gray-600">The core question driving this project</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="What specific question are you trying to answer?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg text-gray-800 leading-relaxed">
            {researchQuestion || (
              <span className="text-gray-400 italic">
                Click edit to add your research question
              </span>
            )}
          </p>
        )}
      </div>

      {/* Project Description */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h3>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more context about your research goals..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        ) : (
          <p className="text-gray-700 leading-relaxed">
            {description || (
              <span className="text-gray-400 italic">
                No description yet
              </span>
            )}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Papers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.total_papers || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Collections</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.collections?.length || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Notes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.annotations?.length || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Analyses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(project.reports?.length || 0) + (project.deep_dives?.length || 0)}
          </p>
        </div>
      </div>

      {/* Seed Paper (if exists) */}
      {project.settings?.seed_paper_pmid && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">🌱</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">Seed Paper</h3>
              <p className="text-sm text-green-700 mb-2">
                {project.settings.seed_paper_title}
              </p>
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${project.settings.seed_paper_pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View on PubMed →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Preview */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {/* Show last 5 activities */}
          <p className="text-sm text-gray-500">
            See full activity timeline in the Progress tab
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### **Task 2.3: Create Explore Tab** (Day 11)

**File to Create:** `frontend/src/components/project/ExploreTab.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import MultiColumnNetworkView from '../MultiColumnNetworkView';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ExploreTabProps {
  projectId: string;
  onGenerateReview?: (pmid: string, title: string) => void;
  onDeepDive?: (pmid: string, title: string) => void;
  onExploreCluster?: (pmid: string, title: string) => void;
}

export function ExploreTab({
  projectId,
  onGenerateReview,
  onDeepDive,
  onExploreCluster
}: ExploreTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PubMed or enter PMID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Search
          </button>
        </div>
      </div>

      {/* Network View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Citation Network</h3>
          <p className="text-sm text-gray-600 mt-1">
            Explore relationships between papers. Click nodes to see details and discover related research.
          </p>
        </div>
        <div className="h-[600px]">
          <MultiColumnNetworkView
            sourceType="project"
            sourceId={projectId}
            projectId={projectId}
            onGenerateReview={onGenerateReview}
            onDeepDive={onDeepDive}
            onExploreCluster={onExploreCluster}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### **Task 2.4: Create Notes Tab** (Day 12)

**File to Create:** `frontend/src/components/project/NotesTab.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { AnnotationList } from '../annotations';
import { useAuth } from '@/contexts/AuthContext';

interface NotesTabProps {
  projectId: string;
}

export function NotesTab({ projectId }: NotesTabProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="finding">Finding</option>
              <option value="hypothesis">Hypothesis</option>
              <option value="question">Question</option>
              <option value="todo">To-Do</option>
              <option value="comparison">Comparison</option>
              <option value="critique">Critique</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <AnnotationList
          projectId={projectId}
          userId={user?.email}
          showForm={true}
          compact={false}
          filters={{
            note_type: filterType,
            priority: filterPriority,
            status: filterStatus
          }}
        />
      </div>
    </div>
  );
}
```

---

## ✅ **Success Criteria**

- [ ] All 6 tabs implemented and functional
- [ ] Tab navigation smooth and intuitive
- [ ] Each tab has clear, single purpose
- [ ] Network view enabled and working
- [ ] Notes tab shows hierarchical view with filters
- [ ] Users understand new structure (< 5 min to adapt)
- [ ] Time to find content reduced by 50%

---

## 📝 **Testing Checklist**

- [ ] Navigate between all tabs
- [ ] Research Question tab displays correctly
- [ ] Can edit research question and description
- [ ] Explore tab loads network view
- [ ] Collections tab works as before
- [ ] Notes tab shows all notes with filters
- [ ] Analysis tab combines reports + deep dives
- [ ] Progress tab shows activity timeline
- [ ] Tab counts update correctly
- [ ] Mobile responsive

---

**Next:** Phase 3 - Search & Discoverability

