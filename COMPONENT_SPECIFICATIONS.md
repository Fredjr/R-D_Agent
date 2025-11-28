# Component Specifications

**Date**: 2025-11-27  
**Purpose**: Detailed specifications for new UI components based on mockups

---

## 1. ProjectDashboardTab Component

**File**: `frontend/src/components/project/ProjectDashboardTab.tsx`

### **Purpose**
Main dashboard view for project workspace, replacing or complementing existing tabs.

### **Layout**
```
┌─────────────────────────────────────────────────┐
│  Project Header (existing)                      │
├──────────────────────┬──────────────────────────┤
│  Project Collections │  Team Members            │
│  Widget              │  Widget                  │
│                      │                          │
├──────────────────────┼──────────────────────────┤
│  Project Overview    │  Recent Activity         │
│  Widget              │  Widget                  │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

### **Props**
```typescript
interface ProjectDashboardTabProps {
  projectId: string;
  project: Project;
  onRefresh: () => void;
}
```

### **Styling**
- Container: `grid grid-cols-1 lg:grid-cols-2 gap-6 p-6`
- Each widget: `bg-white rounded-lg shadow-md p-6`
- Responsive: 1 column on mobile, 2 columns on desktop

---

## 2. ProjectCollectionsWidget Component

**File**: `frontend/src/components/project/ProjectCollectionsWidget.tsx`

### **Purpose**
Display collections linked to this project in a compact, card-based format.

### **Visual Design**
```
┌─────────────────────────────────────┐
│ 📚 Project Collections              │
├─────────────────────────────────────┤
│ 🧡 GLP-1 Agonists Research          │
│    18 articles • 34 notes           │
│                                     │
│ 💙 SGLT2 Inhibitors                 │
│    15 articles • 28 notes           │
│                                     │
│ 💗 Exercise Interventions           │
│    14 articles • 27 notes           │
│                                     │
│ [+ Add Collection to Project]       │
└─────────────────────────────────────┘
```

### **Props**
```typescript
interface ProjectCollectionsWidgetProps {
  projectId: string;
  collections: Collection[];
  onAddCollection: () => void;
  onCollectionClick: (collection: Collection) => void;
}
```

### **Features**
- Show up to 3-4 collections, then "View All" link
- Each collection: colored icon, name, article count, notes count
- Click to navigate to collection detail
- "+ Add Collection to Project" button at bottom

### **Styling**
- Header: `text-xl font-semibold text-gray-900 mb-4 flex items-center`
- Collection item: `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors`
- Icon: `w-10 h-10 rounded-lg flex items-center justify-center` with dynamic background color
- Counts: `text-sm text-gray-500`
- Add button: `w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors`

---

## 3. TeamMembersWidget Component

**File**: `frontend/src/components/project/TeamMembersWidget.tsx`

### **Purpose**
Display project collaborators with roles and invite functionality.

### **Visual Design**
```
┌─────────────────────────────────────┐
│ 👥 Team Members                     │
├─────────────────────────────────────┤
│ JB  Jules Balanche        [Owner]   │
│     frederic2k7@gmail.com           │
│                                     │
│ FM  Fred Martin           [Editor]  │
│     fred@erythos.ai                 │
│                                     │
│ SD  Sarah Dubois          [Viewer]  │
│     sarah.d@research.fr             │
│                                     │
│ AL  Anna Lopez            [Editor]  │
│     a.lopez@uni.edu                 │
│                                     │
│ [+ Invite Collaborator]             │
└─────────────────────────────────────┘
```

### **Props**
```typescript
interface TeamMembersWidgetProps {
  projectId: string;
  collaborators: Collaborator[];
  onInvite: () => void;
}

interface Collaborator {
  user_id: string;
  username: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_at: string;
}
```

### **Features**
- User avatar with initials (circular)
- Username and email
- Role badge (colored)
- "+ Invite Collaborator" button

### **Styling**
- Avatar: `w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold` with dynamic background
- Role badge: `px-2 py-1 rounded text-xs font-medium` (Owner: red, Editor: blue, Viewer: gray)
- Member item: `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors`

---

## 4. ProjectOverviewWidget Component

**File**: `frontend/src/components/project/ProjectOverviewWidget.tsx`

### **Purpose**
Display project metrics, progress, and milestones.

### **Visual Design**
```
┌─────────────────────────────────────┐
│ 📊 Project Overview                 │
├─────────────────────────────────────┤
│ Research Progress                   │
│ Literature Review    [████████] 85% │
│ Data Analysis        [██████  ] 60% │
│ Report Writing       [███    ] 35%  │
│                                     │
│ 🔥 Key Insights                     │
│ 12  Papers with annotations         │
│ 5   AI analyses completed           │
│ 3.2h Avg time saved per paper       │
│ 156 Total citations tracked         │
│                                     │
│ 🎯 Recent Milestones                │
│ ✓ Literature review completed       │
│   November 18, 2025                 │
│ ✓ First comprehensive report        │
│   November 15, 2025                 │
│ ✓ Team collaboration activated      │
│   November 10, 2025                 │
└─────────────────────────────────────┘
```

### **Props**
```typescript
interface ProjectOverviewWidgetProps {
  projectId: string;
  metrics: ProjectMetrics;
}

interface ProjectMetrics {
  research_progress: {
    literature_review: number;
    data_analysis: number;
    report_writing: number;
  };
  key_insights: {
    papers_with_annotations: number;
    ai_analyses_completed: number;
    avg_time_saved_per_paper: string;
    total_citations_tracked: number;
  };
  recent_milestones: Array<{
    title: string;
    date: string;
  }>;
}
```

### **Features**
- Progress bars with percentages
- Key metrics in grid layout
- Milestone timeline with checkmarks

### **Styling**
- Progress bar: `h-2 bg-gray-200 rounded-full overflow-hidden` with colored fill
- Metric item: `flex items-center gap-2 text-sm`
- Milestone: `flex items-start gap-2 text-sm text-gray-600`

---

## 5. RecentActivityWidget Component

**File**: `frontend/src/components/project/RecentActivityWidget.tsx`

### **Purpose**
Display recent user actions in the project.

### **Visual Design**
```
┌─────────────────────────────────────┐
│ 📋 Recent Activity                  │
├─────────────────────────────────────┤
│ 📝 Jules added 3 annotations to     │
│    Tirzepatide paper                │
│    2 hours ago                      │
│                                     │
│ 📊 Fred generated a new             │
│    comprehensive report             │
│    5 hours ago                      │
│                                     │
│ 📄 Sarah added 2 papers to GLP-1    │
│    collection                       │
│    Yesterday                        │
│                                     │
│ 💬 Anna commented on Exercise       │
│    protocol paper                   │
│    2 days ago                       │
│                                     │
│ 🔍 Jules ran Deep Dive Analysis on  │
│    SGLT2 studies                    │
│    3 days ago                       │
└─────────────────────────────────────┘
```

### **Props**
```typescript
interface RecentActivityWidgetProps {
  projectId: string;
  activities: Activity[];
}

interface Activity {
  activity_id: string;
  user_name: string;
  action_type: 'annotation' | 'report' | 'paper_added' | 'comment' | 'deep_dive';
  description: string;
  timestamp: string;
}
```

### **Features**
- Activity feed with icons
- User names in bold
- Relative timestamps
- Scrollable if many activities

### **Styling**
- Activity item: `flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors`
- Icon: `w-8 h-8 rounded-full flex items-center justify-center` with colored background
- Timestamp: `text-xs text-gray-500 mt-1`

---

## 6. EnhancedCollectionCard Component

**File**: `frontend/src/components/ui/EnhancedCollectionCard.tsx`

### **Purpose**
Large, detailed collection card for collections page.

### **Visual Design**
```
┌─────────────────────────────────────────────────┐
│ 🧡  GLP-1 Agonists Research                     │
│     📄 18 articles  📝 34 notes                  │
│                                                 │
│     Comprehensive collection on GLP-1 receptor  │
│     agonists, including tirzepatide,            │
│     semaglutide, and their effects on weight... │
│                                                 │
│     [📄 Explore]  [🌐 Network]                  │
└─────────────────────────────────────────────────┘
```

### **Props**
```typescript
interface EnhancedCollectionCardProps {
  collection: Collection;
  onExplore: () => void;
  onNetwork: () => void;
}

interface Collection {
  collection_id: string;
  collection_name: string;
  description: string;
  article_count: number;
  notes_count: number;
  color: string;
  icon: string;
}
```

### **Features**
- Large colored icon (left side)
- Collection name (large, bold)
- Article + notes count
- Description (2-3 lines, truncated with ellipsis)
- Two prominent action buttons

### **Styling**
- Card: `bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4` with dynamic border color
- Icon: `w-16 h-16 rounded-xl flex items-center justify-center text-3xl` with dynamic background
- Name: `text-xl font-bold text-gray-900`
- Description: `text-sm text-gray-600 line-clamp-2`
- Buttons: `flex-1 py-2 px-4 rounded-lg font-medium transition-colors` (Explore: blue, Network: purple)

---

**Next**: Implement these components in order, starting with ProjectDashboardTab.

