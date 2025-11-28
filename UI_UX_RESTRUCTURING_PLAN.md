# UI/UX Restructuring Plan

**Date**: 2025-11-27  
**Status**: Design Phase  
**Based on**: User-provided mockups (Images 1-4)

---

## 🎨 Overview

This document outlines the UI/UX changes needed to implement the new Collections architecture with a modern, card-based interface inspired by the provided mockups.

---

## 📸 Mockup Analysis

### **Image 1 & 4: Project Workspace Layout**

**Key Components:**

1. **Project Collections Section** (Top Left)
   - Card-based layout with colored icons
   - Shows: Collection name, article count, notes count
   - "+ Add Collection to Project" button
   - Collections are displayed as compact cards with emoji/icon

2. **Team Members Section** (Top Right)
   - User avatars with initials
   - Role badges (Owner, Editor, Viewer)
   - Email addresses
   - "+ Invite Collaborator" button

3. **Project Overview Section** (Bottom Left)
   - Research Progress bars with percentages
   - Key Insights metrics (papers with annotations, AI analyses, avg time, citations)
   - Recent Milestones timeline

4. **Recent Activity Section** (Bottom Right)
   - Activity feed with user actions
   - Timestamps
   - Action types (annotations, reports, papers added, comments, deep dives)

### **Image 2: Collections Grid View (Expanded)**

**Key Features:**

- Large collection cards in 2-column grid
- Each card shows:
  - Colored icon (left side)
  - Collection name (bold, large)
  - Article count + notes count
  - Description text (2-3 lines)
  - Two action buttons: "📄 Explore" and "🌐 Network"
- Dark background with white cards
- Consistent spacing and padding

### **Image 3: Collections Page (Global View)**

**Key Features:**

- Top navigation: Home | Discover | Collections | Projects
- Page title: "Collections"
- Subtitle: "Organize and manage your research article collections"
- Search bar with icon
- View toggle: Grid/List
- "+ New Collection" button (red/accent color)
- Collections displayed in 2-column grid
- Same card design as Image 2

---

## 🎯 Implementation Goals

### **Phase 1: Project Workspace Redesign**

**File**: `frontend/src/app/project/[projectId]/page.tsx`

**Changes Needed:**

1. **Add Dashboard/Overview Tab** (new default view)
   - 2x2 grid layout
   - Project Collections widget (top-left)
   - Team Members widget (top-right)
   - Project Overview widget (bottom-left)
   - Recent Activity widget (bottom-right)

2. **Redesign Collections Display**
   - Move from list to card-based grid
   - Add colored icons/emojis
   - Show article + notes count
   - Add "+ Add Collection to Project" button

3. **Add Team Members Widget**
   - Show collaborators with avatars
   - Display roles (Owner, Editor, Viewer)
   - Add invite functionality

4. **Add Project Overview Widget**
   - Research Progress section with progress bars
   - Key Insights metrics
   - Recent Milestones timeline

5. **Add Recent Activity Widget**
   - Activity feed with user actions
   - Timestamps
   - Action icons

### **Phase 2: Collections Page Redesign**

**File**: `frontend/src/app/collections/page.tsx`

**Changes Needed:**

1. **Update Page Header**
   - Add search bar
   - Add Grid/List view toggle
   - Style "+ New Collection" button (red accent)

2. **Redesign Collection Cards**
   - Larger cards (2-column grid on desktop)
   - Colored icon on left side
   - Collection name (larger, bolder)
   - Article count + notes count
   - Description (2-3 lines, truncated)
   - Two prominent buttons: "📄 Explore" and "🌐 Network"

3. **Update Layout**
   - Remove project grouping (collections are independent)
   - Consistent card sizing
   - Better spacing and padding

### **Phase 3: Collection Cards Component**

**File**: `frontend/src/components/ui/CollectionCard.tsx` (new)

**Features:**

- Reusable collection card component
- Props: name, description, articleCount, notesCount, color, icon, onExplore, onNetwork
- Responsive design (1 column mobile, 2 columns tablet, 2-3 columns desktop)
- Hover effects
- Action buttons

---

## 🗂️ New Components to Create

### 1. **ProjectDashboardTab.tsx**

```typescript
// frontend/src/components/project/ProjectDashboardTab.tsx
// 2x2 grid layout with 4 widgets:
// - ProjectCollectionsWidget
// - TeamMembersWidget
// - ProjectOverviewWidget
// - RecentActivityWidget
```

### 2. **ProjectCollectionsWidget.tsx**

```typescript
// frontend/src/components/project/ProjectCollectionsWidget.tsx
// Displays collections linked to this project
// Compact card layout with colored icons
// "+ Add Collection to Project" button
```

### 3. **TeamMembersWidget.tsx**

```typescript
// frontend/src/components/project/TeamMembersWidget.tsx
// Displays project collaborators
// User avatars with initials
// Role badges
// "+ Invite Collaborator" button
```

### 4. **ProjectOverviewWidget.tsx**

```typescript
// frontend/src/components/project/ProjectOverviewWidget.tsx
// Research Progress section
// Key Insights metrics
// Recent Milestones timeline
```

### 5. **RecentActivityWidget.tsx**

```typescript
// frontend/src/components/project/RecentActivityWidget.tsx
// Activity feed
// User actions with timestamps
// Action icons
```

### 6. **EnhancedCollectionCard.tsx**

```typescript
// frontend/src/components/ui/EnhancedCollectionCard.tsx
// Large collection card for collections page
// Colored icon, name, description
// Article + notes count
// "Explore" and "Network" buttons
```

---

## 🎨 Design System

### **Colors**

- **Collection Icons**: Vibrant colors (orange, cyan, pink, blue, green, purple)
- **Background**: Dark (#1a1a1a for collections page, white for project page)
- **Cards**: White with subtle shadow
- **Accent**: Red/Pink for primary actions (#EF4444 or similar)
- **Text**: Gray-900 for headings, Gray-600 for body

### **Typography**

- **Collection Name**: text-lg font-semibold
- **Description**: text-sm text-gray-600
- **Counts**: text-sm text-gray-500
- **Section Headers**: text-xl font-semibold

### **Spacing**

- **Card Padding**: p-6
- **Grid Gap**: gap-6
- **Section Margin**: mb-8

### **Icons**

- **Collection Icons**: Emoji or Heroicons (folder, beaker, bookmark, etc.)
- **Action Icons**: Heroicons 24/outline
- **User Avatars**: Circular with initials

---

## 📋 Implementation Checklist

### **Phase 1: Project Dashboard** (Week 1)

- [ ] Create `ProjectDashboardTab.tsx` component
- [ ] Create `ProjectCollectionsWidget.tsx` component
- [ ] Create `TeamMembersWidget.tsx` component
- [ ] Create `ProjectOverviewWidget.tsx` component
- [ ] Create `RecentActivityWidget.tsx` component
- [ ] Update project page to include Dashboard tab
- [ ] Fetch and display project collections
- [ ] Fetch and display team members
- [ ] Fetch and display project metrics
- [ ] Fetch and display recent activity

### **Phase 2: Collections Page** (Week 2)

- [ ] Create `EnhancedCollectionCard.tsx` component
- [ ] Update collections page header (search, view toggle)
- [ ] Implement 2-column grid layout
- [ ] Update collection card design (larger, with buttons)
- [ ] Add "Explore" button functionality
- [ ] Add "Network" button functionality
- [ ] Remove project grouping
- [ ] Add empty state design

### **Phase 3: Polish & Responsive** (Week 3)

- [ ] Add responsive breakpoints (mobile, tablet, desktop)
- [ ] Add loading skeletons
- [ ] Add hover effects and transitions
- [ ] Add keyboard navigation
- [ ] Test on different screen sizes
- [ ] Add accessibility features (ARIA labels)
- [ ] Performance optimization

---

## 🔄 Data Flow Changes

### **Project Collections Widget**

```typescript
// Fetch collections linked to this project
GET /projects/{project_id}/collections

// Response:
{
  collections: [
    {
      collection_id: string,
      collection_name: string,
      article_count: number,
      notes_count: number,  // NEW: Count of annotations
      color: string,
      icon: string
    }
  ]
}
```

### **Team Members Widget**

```typescript
// Fetch project collaborators
GET /projects/{project_id}/collaborators

// Response:
{
  collaborators: [
    {
      user_id: string,
      username: string,
      email: string,
      role: 'owner' | 'editor' | 'viewer',
      invited_at: string
    }
  ]
}
```

### **Project Overview Widget**

```typescript
// Fetch project metrics
GET /projects/{project_id}/metrics

// Response:
{
  research_progress: {
    literature_review: number,  // percentage
    data_analysis: number,
    report_writing: number
  },
  key_insights: {
    papers_with_annotations: number,
    ai_analyses_completed: number,
    avg_time_saved_per_paper: string,  // e.g., "3.2h"
    total_citations_tracked: number
  },
  recent_milestones: [
    {
      title: string,
      date: string
    }
  ]
}
```

---

## 🎯 Success Criteria

1. **Visual Consistency**: Matches mockup design closely
2. **Responsive**: Works on mobile, tablet, desktop
3. **Performance**: Fast loading, smooth transitions
4. **Accessibility**: Keyboard navigation, screen reader support
5. **User Feedback**: Positive response from beta testers

---

**Next Steps**: Review this plan and approve before implementation begins.

