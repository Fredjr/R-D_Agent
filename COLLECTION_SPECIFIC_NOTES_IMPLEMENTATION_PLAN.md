# 📝 Collection-Specific Notes Implementation Plan

## Executive Summary

Implement 3 features to make notes collection-aware while maintaining backward compatibility:

1. **Collection-specific note filtering** - Filter notes by collection in UI
2. **Collection-aware note creation** - Link notes to collections when created
3. **Scope toggle** - Switch between "All Project Notes" and "Collection Notes"

---

## 🏗️ Current Architecture Analysis

### **Database Schema** ✅ Already Supports Collection-Specific Notes

```python
class Annotation(Base):
    annotation_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)  # ✅ PROJECT-SCOPED
    collection_id = Column(String, ForeignKey("collections.collection_id"), nullable=True)  # ✅ OPTIONAL
    article_pmid = Column(String, nullable=True)
    # ... other fields
```

**Key Points:**
- ✅ `collection_id` field already exists
- ✅ Backend endpoint supports `?collection_id=` filter
- ✅ `AnnotationForm` component already accepts `collectionId` prop
- ✅ `AnnotationList` component already passes `collectionId` to API

**Current Behavior:**
- All notes have `collection_id: null` → Visible across all collections
- No UI to filter by collection
- No UI to toggle between project-wide and collection-specific notes

---

## 📊 Where Notes Are Currently Displayed

### **1. CollectionArticles Component** ✅ Already Collection-Aware!

<augment_code_snippet path="frontend/src/components/CollectionArticles.tsx" mode="EXCERPT">
````typescript
{/* Collection Notes Section */}
<div className="bg-white rounded-lg shadow border border-gray-200">
  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
    <div className="flex items-center gap-2">
      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
      <h3 className="font-semibold text-gray-900">Collection Notes</h3>
    </div>
    <p className="text-xs text-gray-600 mt-1">
      Add notes about this collection's theme, research questions, or key findings
    </p>
  </div>
  <div className="p-4">
    <AnnotationList
      projectId={projectId}
      userId={user?.email}
      collectionId={collection.collection_id}  // ✅ Already passes collectionId!
      showForm={true}
      compact={false}
    />
  </div>
</div>
````
</augment_code_snippet>

**Status:** ✅ **Already implemented!** This component shows collection-specific notes.

**Issue:** Currently shows ALL project notes because all existing notes have `collection_id: null`.

---

### **2. NotesTab Component** ❌ Project-Wide Only

<augment_code_snippet path="frontend/src/components/project/NotesTab.tsx" mode="EXCERPT">
````typescript
<AnnotationList
  projectId={project.project_id}
  userId={user?.email}
  initialFilters={{
    note_type: selectedType !== 'all' ? selectedType : undefined,
    priority: selectedPriority !== 'all' ? selectedPriority : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  }}
  showForm={false}
  compact={false}
/>
````
</augment_code_snippet>

**Status:** ❌ **No collection filtering** - Shows all project notes.

**Needed:** Add collection filter dropdown + scope toggle.

---

### **3. NetworkSidebar Component** ✅ Article-Specific

<augment_code_snippet path="frontend/src/components/NetworkSidebar.tsx" mode="EXCERPT">
````typescript
<AnnotationList
  projectId={projectId}
  userId={user?.user_id}
  articlePmid={selectedNode.id}  // ✅ Filters by article
  showForm={true}
  compact={true}
  className="p-3"
/>
````
</augment_code_snippet>

**Status:** ✅ **Article-specific** - Shows notes for selected article.

**Needed:** Add collection context awareness (show which collection the article is from).

---

## 🎯 Implementation Strategy

### **Phase 1: Collection-Aware Note Creation** (HIGH PRIORITY)

**Goal:** When creating notes in collection context, automatically link them to the collection.

**Changes Needed:**

1. **CollectionArticles.tsx** - ✅ Already passes `collectionId`
2. **AnnotationForm.tsx** - ✅ Already accepts `collectionId`
3. **Backend** - ✅ Already saves `collection_id`

**Status:** ✅ **Already working!** Just need to verify.

---

### **Phase 2: Scope Toggle in NotesTab** (HIGH PRIORITY)

**Goal:** Add toggle to switch between "All Project Notes" and "Collection Notes".

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│ Notes & Ideas                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📊 View Scope:  [All Project Notes ▼]              │ │
│ │                                                     │ │
│ │ Options:                                            │ │
│ │   • All Project Notes (47 notes)                   │ │
│ │   • Baba collection (12 notes)                     │ │
│ │   • Search Result: New advances... (5 notes)       │ │
│ │   • Unlinked Notes (30 notes)                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Existing filters: Type, Priority, Status, Search]     │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

1. Add collection dropdown filter
2. Fetch collections list
3. Show note counts per collection
4. Add "Unlinked Notes" option (collection_id: null)
5. Pass `collection_id` filter to `AnnotationList`

---

### **Phase 3: Collection Context in NetworkSidebar** (MEDIUM PRIORITY)

**Goal:** Show which collection(s) an article belongs to when viewing notes.

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│ Paper Details                                           │
│ ─────────────────────────────────────────────────────── │
│ Title: Pembrolizumab in Advanced Melanoma              │
│ PMID: 33099609                                          │
│                                                         │
│ 📚 In Collections:                                      │
│   • Baba collection                                     │
│   • Search Result: New advances...                      │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│ Notes (3)                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔵 Scope: [All Notes ▼]                            │ │
│ │   • All Notes (3)                                   │ │
│ │   • Baba collection (1)                             │ │
│ │   • Search Result... (1)                            │ │
│ │   • Unlinked (1)                                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

1. Fetch collections that contain the article
2. Display collection badges
3. Add scope dropdown to filter notes
4. When creating note, offer to link to one of the collections

---

## 🔧 Detailed Implementation Steps

### **Step 1: Add Collection Scope Filter to NotesTab**

**File:** `frontend/src/components/project/NotesTab.tsx`

**Changes:**
1. Add state for selected collection filter
2. Fetch collections list
3. Add dropdown UI component
4. Pass `collection_id` to `AnnotationList`
5. Show note counts per collection

**Code Structure:**
```typescript
const [selectedCollection, setSelectedCollection] = useState<string | 'all' | 'unlinked'>('all');
const [collections, setCollections] = useState<Collection[]>([]);

// Fetch collections
useEffect(() => {
  fetchCollections();
}, [projectId]);

// Calculate note counts per collection
const noteCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  allAnnotations.forEach(note => {
    const key = note.collection_id || 'unlinked';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}, [allAnnotations]);

// Filter logic
const collectionFilter = selectedCollection === 'all' 
  ? undefined 
  : selectedCollection === 'unlinked'
    ? null  // Special case: notes with no collection
    : selectedCollection;
```

---

### **Step 2: Add Collection Context to NetworkSidebar**

**File:** `frontend/src/components/NetworkSidebar.tsx`

**Changes:**
1. Fetch collections containing the article
2. Display collection badges
3. Add scope dropdown for notes
4. Pass collection context to note creation

**Code Structure:**
```typescript
const [articleCollections, setArticleCollections] = useState<Collection[]>([]);
const [noteScope, setNoteScope] = useState<string | 'all'>('all');

// Fetch collections containing this article
useEffect(() => {
  if (selectedNode?.id) {
    fetchArticleCollections(selectedNode.id);
  }
}, [selectedNode]);

// When creating note, offer collection options
<AnnotationForm
  projectId={projectId}
  articlePmid={selectedNode.id}
  collectionId={noteScope !== 'all' ? noteScope : undefined}
  // ... other props
/>
```

---

### **Step 3: Add Collection Selector to Note Creation**

**File:** `frontend/src/components/annotations/AnnotationForm.tsx`

**Changes:**
1. Add optional collection selector dropdown
2. Show when article is in multiple collections
3. Allow "No collection" option

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│ New Note                                                │
│ ─────────────────────────────────────────────────────── │
│ Link to Collection (optional):                          │
│ [ Select collection... ▼ ]                              │
│   • None (project-wide note)                            │
│   • Baba collection                                     │
│   • Search Result: New advances...                      │
│ ─────────────────────────────────────────────────────── │
│ [Note content textarea]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 User Experience Flow

### **Scenario 1: Creating Collection-Specific Note**

1. User opens "Baba collection"
2. Clicks "Add Note" in Collection Notes section
3. Note is automatically linked to "Baba collection"
4. Note appears in:
   - ✅ Collection Notes section (filtered view)
   - ✅ NotesTab when "Baba collection" filter selected
   - ✅ NotesTab when "All Project Notes" selected
   - ❌ Other collections (unless explicitly linked)

---

### **Scenario 2: Creating Project-Wide Note**

1. User opens NotesTab
2. Scope set to "All Project Notes"
3. Clicks "Add Note"
4. Note created with `collection_id: null`
5. Note appears in:
   - ✅ All collection views
   - ✅ NotesTab (all scopes)
   - ✅ Article-specific views

---

### **Scenario 3: Viewing Notes in Multiple Contexts**

**Article in 2 collections:**
- Collection A: "Immunotherapy Research"
- Collection B: "Clinical Trials"

**Notes on this article:**
- Note 1: Linked to Collection A
- Note 2: Linked to Collection B
- Note 3: Project-wide (no collection)

**What user sees:**
- In Collection A: Notes 1 + 3
- In Collection B: Notes 2 + 3
- In NotesTab (All): Notes 1 + 2 + 3
- In NotesTab (Collection A): Note 1
- In NotesTab (Unlinked): Note 3

---

## 🎨 UI Components to Create/Modify

### **1. CollectionScopeFilter Component** (NEW)

**Purpose:** Dropdown to filter notes by collection scope.

**Props:**
```typescript
interface CollectionScopeFilterProps {
  projectId: string;
  selectedScope: string | 'all' | 'unlinked';
  onScopeChange: (scope: string | 'all' | 'unlinked') => void;
  noteCounts: Record<string, number>;
}
```

**Features:**
- Show all collections with note counts
- "All Project Notes" option
- "Unlinked Notes" option
- Visual indicators (icons, colors)

---

### **2. CollectionBadge Component** (NEW)

**Purpose:** Display collection membership for articles.

**Props:**
```typescript
interface CollectionBadgeProps {
  collection: Collection;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}
```

**Features:**
- Collection name
- Collection color
- Click to filter notes by collection

---

### **3. Modify AnnotationForm** (ENHANCE)

**Add:**
- Optional collection selector
- Show when article is in multiple collections
- "None" option for project-wide notes

---

## 🔄 Backward Compatibility

### **Existing Notes (collection_id: null)**

**Behavior:**
- ✅ Visible in all collection views
- ✅ Visible in "All Project Notes"
- ✅ Visible in "Unlinked Notes" filter
- ✅ Can be edited to link to a collection

**Migration:**
- ❌ No automatic migration needed
- ✅ Users can manually link notes to collections via edit

---

## 📈 Implementation Priority

### **Phase 1: Core Functionality** (Week 1)
1. ✅ Verify collection-aware note creation works
2. ✅ Add collection scope filter to NotesTab
3. ✅ Add "Unlinked Notes" filter option
4. ✅ Test with existing notes

### **Phase 2: Enhanced UX** (Week 2)
1. ✅ Add collection context to NetworkSidebar
2. ✅ Add collection badges for articles
3. ✅ Add collection selector to note creation
4. ✅ Add note count indicators

### **Phase 3: Polish** (Week 3)
1. ✅ Add keyboard shortcuts
2. ✅ Add bulk operations (link multiple notes to collection)
3. ✅ Add collection migration tool
4. ✅ Add analytics/insights

---

## 🧪 Testing Checklist

- [ ] Create note in collection → Note linked to collection
- [ ] Create note in NotesTab → Note is project-wide
- [ ] Filter by collection → Only collection notes shown
- [ ] Filter by "Unlinked" → Only project-wide notes shown
- [ ] Edit note → Can change collection link
- [ ] Delete collection → Notes become unlinked
- [ ] Article in multiple collections → Notes visible in all
- [ ] WebSocket updates → Real-time sync across views

---

## 🎯 Success Metrics

- ✅ Users can create collection-specific notes
- ✅ Users can filter notes by collection
- ✅ Users can toggle between project-wide and collection views
- ✅ Existing notes remain accessible
- ✅ No breaking changes to existing functionality

---

**Next Steps:** Implement Phase 1 (Core Functionality) first, then iterate based on user feedback.

