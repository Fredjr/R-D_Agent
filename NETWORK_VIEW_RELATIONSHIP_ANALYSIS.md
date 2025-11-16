# 🔍 Network View Relationship Analysis

**Date**: 2025-11-16  
**Issue**: No visible indication of how papers are linked to the initial paper in network view

---

## 🎯 PROBLEM STATEMENT

When clicking "Explore Network" from either the project workspace or /Search page, a list of papers appears in the network view arranged in a circle. However, **there is no visible indication** telling the user:

1. **How these papers are linked** to the initial paper
2. **What type of relationship** exists (citation, reference, similar)
3. **Why these specific papers** were selected

This makes it difficult to trust the network view because the relationships are not transparent.

---

## 🔍 CURRENT IMPLEMENTATION ANALYSIS

### 1. **Backend API - Relationship Data IS Available**

The backend API (`/api/proxy/pubmed/network/route.ts`) **DOES** fetch and return relationship metadata:

<augment_code_snippet path="frontend/src/app/api/proxy/pubmed/network/route.ts" mode="EXCERPT">
````typescript
// Create edge from citing article to source
edges.push({
  id: `${article.pmid}-cites-${pmid}`,
  source: article.pmid,
  target: pmid,
  type: 'citation',  // ✅ Relationship type IS included
  weight: 1
});

// Create edge from source to reference
edges.push({
  id: `${pmid}-refs-${article.pmid}`,
  source: pmid,
  target: article.pmid,
  type: 'reference',  // ✅ Relationship type IS included
  weight: 1
});

// Create bidirectional similarity edge
edges.push({
  id: `${pmid}-similar-${article.pmid}`,
  source: pmid,
  target: article.pmid,
  type: 'similarity',  // ✅ Relationship type IS included
  weight: 0.8
});
````
</augment_code_snippet>

**✅ The API returns edges with `type` field**: `'citation'`, `'reference'`, or `'similarity'`

---

### 2. **Frontend - Relationship Data IS NOT Displayed**

The frontend (`NetworkView.tsx`) receives the edge data but **DOES NOT display the relationship type**:

<augment_code_snippet path="frontend/src/components/NetworkView.tsx" mode="EXCERPT">
````typescript
const flowEdges: Edge[] = (data.edges || []).map((edge) => ({
  id: edge.id,
  source: edge.from,
  target: edge.to,
  type: 'smoothstep',
  animated: true,
  style: {
    stroke: '#94a3b8',  // ❌ All edges same gray color
    strokeWidth: 2,
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#94a3b8',
  },
  // ❌ NO LABEL - relationship type not shown
}));
````
</augment_code_snippet>

**❌ Problems**:
1. **No edge labels** - The `label` property is not set
2. **All edges same color** - No visual distinction between citation/reference/similar
3. **Edge type ignored** - The backend's `edge.type` field is not used
4. **No legend** - Users don't know what the colors mean

---

### 3. **Dynamic Expansion - Labels ARE Added**

Interestingly, when dynamically expanding nodes, the code **DOES** add labels:

<augment_code_snippet path="frontend/src/components/NetworkView.tsx" mode="EXCERPT">
````typescript
// Add citation nodes (papers that cite this one)
newEdges.push({
  id: `edge_${newNodeId}_${nodeId}`,
  source: newNodeId,
  target: nodeId,
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#10b981', strokeWidth: 2 },
  label: 'cites'  // ✅ Label IS added for dynamic expansion
});

// Add reference nodes (papers this one cites)
newEdges.push({
  id: `edge_${nodeId}_${newNodeId}`,
  source: nodeId,
  target: newNodeId,
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#3b82f6', strokeWidth: 2 },
  label: 'references'  // ✅ Label IS added for dynamic expansion
});
````
</augment_code_snippet>

**✅ Dynamic expansion uses**:
- Green color (`#10b981`) for citations with label `'cites'`
- Blue color (`#3b82f6`) for references with label `'references'`

---

## 🎨 PROPOSED SOLUTION

### 1. **Add Edge Labels to Initial Network Load**

Update the edge mapping in `NetworkView.tsx` to include labels based on edge type:

```typescript
const flowEdges: Edge[] = (data.edges || []).map((edge) => {
  // Determine edge type and styling
  let edgeColor = '#94a3b8'; // Default gray
  let edgeLabel = '';
  
  if (edge.type === 'citation') {
    edgeColor = '#10b981'; // Green for citations
    edgeLabel = 'cites';
  } else if (edge.type === 'reference') {
    edgeColor = '#3b82f6'; // Blue for references
    edgeLabel = 'references';
  } else if (edge.type === 'similarity') {
    edgeColor = '#8b5cf6'; // Purple for similar
    edgeLabel = 'similar';
  }
  
  return {
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    animated: true,
    label: edgeLabel,  // ✅ ADD LABEL
    labelStyle: { fill: edgeColor, fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    style: {
      stroke: edgeColor,  // ✅ COLOR-CODE BY TYPE
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: edgeColor,
    },
  };
});
```

---

### 2. **Add Legend to Network View**

Add a legend component to explain the relationship types:

```typescript
<div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10">
  <div className="text-xs font-semibold text-gray-700 mb-2">Relationships</div>
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs">
      <div className="w-8 h-0.5 bg-green-500"></div>
      <span className="text-gray-600">Cites (papers citing this one)</span>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <div className="w-8 h-0.5 bg-blue-500"></div>
      <span className="text-gray-600">References (papers cited by this one)</span>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <div className="w-8 h-0.5 bg-purple-500"></div>
      <span className="text-gray-600">Similar (related papers)</span>
    </div>
  </div>
</div>
```

---

### 3. **Add Relationship Info to Sidebar**

When a paper is selected, show its relationship to the source paper in the sidebar:

```typescript
{selectedNode && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
    <div className="text-xs font-semibold text-blue-900 mb-1">
      Relationship to Source Paper
    </div>
    <div className="text-xs text-blue-700">
      {getRelationshipDescription(selectedNode.id, edges)}
    </div>
  </div>
)}
```

Helper function:
```typescript
const getRelationshipDescription = (nodeId: string, edges: Edge[]) => {
  const edge = edges.find(e => e.source === nodeId || e.target === nodeId);
  if (!edge) return 'Unknown relationship';
  
  const label = edge.label || '';
  if (label === 'cites') return '📊 This paper cites the source paper';
  if (label === 'references') return '📚 The source paper cites this paper';
  if (label === 'similar') return '🔗 This paper is similar to the source paper';
  return 'Related paper';
};
```

---

### 4. **Add Hover Tooltips on Edges**

Show relationship info when hovering over edges:

```typescript
const flowEdges: Edge[] = (data.edges || []).map((edge) => {
  // ... existing code ...
  
  return {
    // ... existing properties ...
    data: {
      tooltip: getEdgeTooltip(edge)
    }
  };
});

const getEdgeTooltip = (edge: any) => {
  if (edge.type === 'citation') {
    return 'Citation: This paper cites the source paper';
  } else if (edge.type === 'reference') {
    return 'Reference: The source paper cites this paper';
  } else if (edge.type === 'similarity') {
    return 'Similar: Related by content or topic';
  }
  return 'Related paper';
};
```

---

## 📊 VISUAL IMPROVEMENTS

### Color Scheme

| Relationship | Color | Hex | Meaning |
|--------------|-------|-----|---------|
| **Citation** | 🟢 Green | `#10b981` | Papers that cite the source paper (later work) |
| **Reference** | 🔵 Blue | `#3b82f6` | Papers cited by the source paper (earlier work) |
| **Similar** | 🟣 Purple | `#8b5cf6` | Papers similar by content/topic |

### Edge Labels

- **Font size**: 12px (readable but not overwhelming)
- **Font weight**: 600 (semi-bold)
- **Background**: White with 80% opacity
- **Position**: Center of edge

### Legend Position

- **Desktop**: Top-right corner
- **Mobile**: Bottom-right corner (above FAB)
- **Style**: White background, shadow, rounded corners

---

## 🔧 IMPLEMENTATION PRIORITY

### Priority 1: Critical (Must Have)
1. ✅ **Add edge labels** - Show relationship type on edges
2. ✅ **Color-code edges** - Different colors for citation/reference/similar
3. ✅ **Add legend** - Explain what colors mean

### Priority 2: High (Should Have)
4. ✅ **Sidebar relationship info** - Show how selected paper relates to source
5. ✅ **Edge hover tooltips** - Show relationship on hover

### Priority 3: Nice to Have
6. 💡 **Filter by relationship type** - Toggle visibility of citation/reference/similar
7. 💡 **Relationship statistics** - Show count of each relationship type
8. 💡 **Edge thickness** - Vary by citation count or relevance

---

## 📝 FILES TO MODIFY

### 1. `frontend/src/components/NetworkView.tsx`
**Changes**:
- Update `flowEdges` mapping to include labels and colors
- Add `getEdgeColor()` helper function
- Add `getEdgeLabel()` helper function
- Add `getRelationshipDescription()` helper function
- Add legend component to render

**Lines to modify**: ~917-931 (edge mapping)

---

### 2. `frontend/src/components/NetworkSidebar.tsx`
**Changes**:
- Add relationship info section when node is selected
- Show how selected paper relates to source paper
- Add visual indicator (icon + color)

**Lines to add**: After line ~792 (paper details section)

---

### 3. `frontend/src/components/MultiColumnNetworkView.tsx`
**Changes**:
- Ensure legend is visible in multi-column view
- Position legend appropriately
- Make legend responsive on mobile

**Lines to modify**: ~617-750 (main view rendering)

---

## 🎯 EXPECTED OUTCOME

After implementing these changes:

1. ✅ **Users can see** how each paper relates to the source paper
2. ✅ **Visual distinction** between citations, references, and similar papers
3. ✅ **Clear legend** explaining the relationship types
4. ✅ **Sidebar shows** relationship info for selected paper
5. ✅ **Hover tooltips** provide additional context
6. ✅ **Trust in network view** increases due to transparency

---

## 📸 MOCKUP

```
┌─────────────────────────────────────────────────────────┐
│  Network Explorer                    [Legend]            │
│                                      🟢 Cites            │
│                                      🔵 References       │
│     Paper A ──cites──> Source Paper  🟣 Similar         │
│         ↑                   ↓                            │
│         │              references                        │
│         │                   ↓                            │
│      similar            Paper B                          │
│         │                                                │
│     Paper C                                              │
│                                                          │
│  [Sidebar]                                               │
│  Selected: Paper A                                       │
│  📊 This paper cites the source paper                    │
│  Year: 2023 • Citations: 45                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 NEXT STEPS

1. Implement edge labels and colors in `NetworkView.tsx`
2. Add legend component
3. Add relationship info to `NetworkSidebar.tsx`
4. Test on desktop and mobile
5. Gather user feedback
6. Consider adding filters and statistics

---

**Status**: 📋 READY FOR IMPLEMENTATION  
**Estimated Effort**: 2-3 hours  
**Impact**: HIGH - Significantly improves trust and usability

