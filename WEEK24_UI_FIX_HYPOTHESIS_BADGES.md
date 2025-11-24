# Week 24 UI Fix: Show Hypothesis Links on Collection Cards

## 🎯 Problem
Users cannot see which collections are linked to which hypotheses from the Collections page.

**Current State:**
- Collections have `linked_hypothesis_ids` in the backend
- But the UI doesn't show these links
- Users have no way to know which collection supports which hypothesis

**User Question:**
> "From a UI perspective, how do the user knows that those 3 collections are linked to the hypothesis, and if I have multiple hypothesis, how do I know which collection is linked to which hypothesis?"

---

## ✅ Solution

Add **hypothesis badges** to collection cards showing:
1. **Hypothesis name** (truncated if long)
2. **Visual badge** with color coding
3. **Tooltip** with full hypothesis text on hover
4. **Count** if multiple hypotheses linked

---

## 🎨 UI Design

### Collection Card with Hypothesis Badges:

```
┌─────────────────────────────────────────┐
│ 📁 FOP Treatment Studies                │
│                                         │
│ Papers about Fibrodysplasia Ossificans │
│ Progressiva (FOP) treatments            │
│                                         │
│ 🔬 Kinase inhibitors are effective...  │  ← Hypothesis badge
│                                         │
│ 0 papers                    24/11/2025  │
│                                         │
│ [Network] [Delete]                      │
└─────────────────────────────────────────┘
```

### Multiple Hypotheses:

```
┌─────────────────────────────────────────┐
│ 📁 Diabetes Research                    │
│                                         │
│ Papers about Type 2 Diabetes            │
│                                         │
│ 🔬 Insulin resistance causes...         │
│ 🔬 GLP-1 agonists improve...            │
│ +2 more hypotheses                      │
│                                         │
│ 15 papers                   24/11/2025  │
└─────────────────────────────────────────┘
```

---

## 📝 Implementation Plan

### Step 1: Update Collections Component
**File:** `frontend/src/components/Collections.tsx`

1. Fetch hypotheses for the project
2. Create a map of `hypothesis_id` → `hypothesis_text`
3. Pass hypothesis map to collection cards

### Step 2: Update DeletableCollectionCard Component
**File:** `frontend/src/components/ui/DeletableCard.tsx`

1. Accept `linkedHypothesisIds` prop
2. Accept `hypothesesMap` prop
3. Render hypothesis badges below description
4. Show max 2 badges + count if more

### Step 3: Add Hypothesis Badge Component
**File:** `frontend/src/components/ui/HypothesisBadge.tsx` (NEW)

1. Create reusable badge component
2. Truncate long hypothesis text
3. Add tooltip with full text
4. Color code by hypothesis status

---

## 🔧 Code Changes

### Change 1: Fetch Hypotheses in Collections Component

```typescript
// frontend/src/components/Collections.tsx

const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

useEffect(() => {
  const fetchHypotheses = async () => {
    try {
      const response = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
        headers: { 'User-ID': userId }
      });
      if (response.ok) {
        const data = await response.json();
        setHypotheses(data);
      }
    } catch (error) {
      console.error('Failed to fetch hypotheses:', error);
    }
  };
  
  fetchHypotheses();
}, [projectId, userId]);

// Create hypothesis map
const hypothesesMap = useMemo(() => {
  return hypotheses.reduce((acc, h) => {
    acc[h.hypothesis_id] = h.hypothesis_text;
    return acc;
  }, {} as Record<string, string>);
}, [hypotheses]);
```

### Change 2: Pass Hypothesis Data to Cards

```typescript
<DeletableCollectionCard
  key={collection.collection_id}
  title={collection.collection_name}
  description={collection.description}
  articleCount={collection.article_count}
  lastUpdated={new Date(collection.created_at).toLocaleDateString()}
  color={colors[index % colors.length]}
  collectionId={collection.collection_id}
  projectId={projectId}
  linkedHypothesisIds={collection.linked_hypothesis_ids || []}  // NEW
  hypothesesMap={hypothesesMap}  // NEW
  onClick={() => handleViewArticles(collection)}
  onExplore={() => handleViewArticles(collection)}
  onNetworkView={() => handleViewNetwork(collection)}
  onDelete={() => {
    refreshCollections();
    broadcastCollectionDeleted(collection.collection_id);
    onRefresh?.();
  }}
/>
```

### Change 3: Update DeletableCollectionCard Props

```typescript
// frontend/src/components/ui/DeletableCard.tsx

interface DeletableCollectionCardProps {
  title: string;
  description?: string;
  articleCount?: number;
  lastUpdated?: string;
  color?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onExplore?: () => void;
  onNetworkView?: () => void;
  collectionId: string;
  projectId: string;
  className?: string;
  linkedHypothesisIds?: string[];  // NEW
  hypothesesMap?: Record<string, string>;  // NEW
}
```

### Change 4: Render Hypothesis Badges

```typescript
// Inside DeletableCollectionCard component

{linkedHypothesisIds && linkedHypothesisIds.length > 0 && hypothesesMap && (
  <div className="mt-3 flex flex-wrap gap-2">
    {linkedHypothesisIds.slice(0, 2).map((hypId) => (
      <div
        key={hypId}
        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
        title={hypothesesMap[hypId] || 'Unknown hypothesis'}
      >
        <BeakerIcon className="w-3 h-3" />
        <span className="max-w-[200px] truncate">
          {hypothesesMap[hypId]?.slice(0, 40) || 'Unknown'}
          {hypothesesMap[hypId]?.length > 40 && '...'}
        </span>
      </div>
    ))}
    {linkedHypothesisIds.length > 2 && (
      <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
        +{linkedHypothesisIds.length - 2} more
      </div>
    )}
  </div>
)}
```

---

## 🎨 Visual Examples

### Single Hypothesis:
```
🔬 Kinase inhibitors are effective in treating...
```

### Multiple Hypotheses:
```
🔬 Kinase inhibitors are effective in treating...
🔬 GLP-1 agonists improve glycemic control in...
+2 more
```

### No Hypotheses:
```
(No badges shown)
```

---

## 📊 Expected Results

After implementing this fix:

1. ✅ Users can see which hypotheses each collection supports
2. ✅ Users can distinguish between collections at a glance
3. ✅ Users understand the purpose of each collection
4. ✅ Hypothesis text is truncated but full text available on hover
5. ✅ Multiple hypotheses are handled gracefully

---

## 🚀 Next Steps

1. Implement the code changes above
2. Test with production data
3. Verify hypothesis badges appear correctly
4. Test with collections linked to multiple hypotheses
5. Test tooltip functionality

---

**Would you like me to implement these changes now?**

