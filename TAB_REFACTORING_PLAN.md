# 🎨 TAB REFACTORING PLAN - REMAINING 5 TABS

**Date:** November 12, 2025  
**Status:** In Progress

---

## ✅ COMPLETED

### **Phase 1: Data Fixes (DONE)**
- ✅ Fixed `totalPapers` calculation in `page.tsx`
- ✅ Fixed `collectionsCount` to use `collections.length`
- ✅ Fixed `annotations_count` to use backend field
- ✅ Fixed `reports_count` and `deep_dive_analyses_count`
- ✅ Updated `ResearchQuestionTab` to use correct props
- ✅ Updated `ProgressTab` to use correct props
- ✅ Build successful

---

## 🎯 REMAINING TASKS

### **Phase 2: Refactor Remaining 5 Tabs**

#### **Tab 1: ExploreTab** (856 lines - LARGE)
**File:** `frontend/src/components/project/ExploreTab.tsx`

**Current Structure:**
- PubMed search functionality
- Network view integration
- Search results display
- Collection selector modal
- PDF viewer integration
- Filter panel

**Refactoring Strategy:**
1. Replace header gradient with `SpotifyTabCard` with gradient variant
2. Replace search bar with `SpotifyTabSearchBar`
3. Replace view mode toggle with `SpotifyTabToggleGroup`
4. Replace article cards with `SpotifyTabCard`
5. Replace buttons with `SpotifyTabButton`
6. Update colors to Spotify dark theme
7. Keep existing functionality intact

**Estimated Time:** 1-1.5 hours

---

#### **Tab 2: MyCollectionsTab** (Medium complexity)
**File:** `frontend/src/components/project/MyCollectionsTab.tsx`

**Current Structure:**
- Collections grid display
- Create collection modal
- Collection cards
- Article management

**Refactoring Strategy:**
1. Replace collection cards with `SpotifyTabCard`
2. Use `SpotifyTabGrid` for layout
3. Replace buttons with `SpotifyTabButton`
4. Update empty state with `SpotifyTabEmptyState`
5. Update colors to Spotify dark theme

**Estimated Time:** 45 minutes - 1 hour

---

#### **Tab 3: NotesTab** (Medium complexity)
**File:** `frontend/src/components/project/NotesTab.tsx`

**Current Structure:**
- Notes list display
- Note creation
- Note filtering
- Note cards

**Refactoring Strategy:**
1. Replace note cards with `SpotifyTabCard`
2. Use `SpotifyTabList` for layout
3. Replace buttons with `SpotifyTabButton`
4. Update empty state with `SpotifyTabEmptyState`
5. Update colors to Spotify dark theme

**Estimated Time:** 45 minutes - 1 hour

---

#### **Tab 4: AnalysisTab** (Medium complexity)
**File:** `frontend/src/components/project/AnalysisTab.tsx`

**Current Structure:**
- Reports list
- Deep dive analyses list
- Analysis cards
- Create analysis buttons

**Refactoring Strategy:**
1. Replace analysis cards with `SpotifyTabCard`
2. Use `SpotifyTabGrid` for layout
3. Replace buttons with `SpotifyTabButton`
4. Update empty state with `SpotifyTabEmptyState`
5. Update colors to Spotify dark theme

**Estimated Time:** 45 minutes - 1 hour

---

#### **Tab 5: ProgressTab** (PARTIALLY DONE)
**File:** `frontend/src/components/project/ProgressTab.tsx`

**Current Status:**
- ✅ Data props fixed (totalPapers, collectionsCount)
- ❌ Still needs UI refactoring

**Refactoring Strategy:**
1. Replace stat cards with `SpotifyTabStatCard`
2. Use `SpotifyTabGrid` for layout
3. Replace activity cards with `SpotifyTabCard`
4. Update colors to Spotify dark theme

**Estimated Time:** 30-45 minutes

---

## 📊 REFACTORING CHECKLIST

For each tab, ensure:

### **1. Imports**
```typescript
import {
  SpotifyTabSection,
  SpotifyTabGrid,
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabStatCard,
  SpotifyTabButton,
  SpotifyTabIconButton,
  SpotifyTabQuickAction,
  SpotifyTabEmptyState,
  SpotifyTabSearchBar,
  SpotifyTabToggleGroup,
  SpotifyTabBadge,
  SpotifyTabLoading
} from './shared';
```

### **2. Layout Structure**
```typescript
<SpotifyTabSection>
  {/* Header */}
  <SpotifyTabCard variant="gradient" gradient="from-blue-500/10 to-purple-500/10">
    <SpotifyTabCardHeader ... />
    <SpotifyTabCardContent>
      {/* Search bar, filters, etc. */}
    </SpotifyTabCardContent>
  </SpotifyTabCard>

  {/* Content Grid/List */}
  <SpotifyTabGrid columns={3}>
    {items.map(item => (
      <SpotifyTabCard key={item.id}>
        ...
      </SpotifyTabCard>
    ))}
  </SpotifyTabGrid>

  {/* Empty State */}
  {items.length === 0 && (
    <SpotifyTabEmptyState
      icon={<Icon />}
      title="No items yet"
      description="Get started by..."
      action={<SpotifyTabButton>Create</SpotifyTabButton>}
    />
  )}
</SpotifyTabSection>
```

### **3. Color Replacements**
- ❌ `bg-white` → ✅ `bg-[var(--spotify-dark-gray)]`
- ❌ `bg-gray-50` → ✅ `bg-[var(--spotify-black)]`
- ❌ `text-gray-900` → ✅ `text-[var(--spotify-white)]`
- ❌ `text-gray-600` → ✅ `text-[var(--spotify-light-text)]`
- ❌ `border-gray-200` → ✅ `border-[var(--spotify-border-gray)]`
- ❌ `hover:bg-gray-100` → ✅ `hover:bg-[var(--spotify-medium-gray)]`

### **4. Button Replacements**
```typescript
// Old
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Click me
</button>

// New
<SpotifyTabButton variant="primary">
  Click me
</SpotifyTabButton>
```

### **5. Card Replacements**
```typescript
// Old
<div className="bg-white rounded-lg p-6 border border-gray-200">
  <h3 className="text-lg font-bold text-gray-900">Title</h3>
  <p className="text-sm text-gray-600">Description</p>
</div>

// New
<SpotifyTabCard>
  <SpotifyTabCardHeader
    title="Title"
    description="Description"
  />
</SpotifyTabCard>
```

---

## 🚀 EXECUTION PLAN

### **Order of Refactoring:**
1. ✅ ResearchQuestionTab (DONE)
2. ⏳ ProgressTab (Data fixed, UI pending)
3. ⏳ MyCollectionsTab (Medium complexity)
4. ⏳ NotesTab (Medium complexity)
5. ⏳ AnalysisTab (Medium complexity)
6. ⏳ ExploreTab (Largest, save for last)

### **After Each Tab:**
1. Build and check for errors
2. Test locally if possible
3. Commit changes
4. Move to next tab

### **Final Steps:**
1. Build all tabs
2. Test all tabs
3. Deploy to production
4. Verify on production

---

## 📝 NOTES

- Keep existing functionality intact
- Only change UI/styling, not logic
- Use shared components for consistency
- Maintain accessibility
- Test each tab after refactoring

---

**Total Estimated Time:** 4-6 hours  
**Priority:** HIGH  
**Status:** Phase 1 Complete, Phase 2 In Progress

