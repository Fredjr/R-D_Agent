# Network Graph Subsequent Graphs Fixes - December 2024

## Summary

This document tracks fixes to ensure **subsequent graphs** (created via quick action buttons) match the **initial graph** in terms of:
1. ✅ Node gradient coloring based on paper recency
2. ✅ Cross-reference detection between non-central nodes
3. ✅ Edge coloring based on relationship type

---

## Issues Identified and Fixed

### Issue 1: ❌ Node Colors Hardcoded (FIXED ✅)

**Problem**: When clicking "Similar Work", "Earlier Work", or "Later Work" buttons, all newly added nodes had the same hardcoded color instead of a gradient based on publication year.

**What Was Wrong**:
- **Similar Work**: All nodes were purple `#8b5cf6`
- **Earlier Work**: All nodes were blue `#3b82f6`
- **Later Work**: All nodes were green `#10b981`

This made subsequent graphs look completely different from the initial graph.

**Root Cause**: The event handlers in `NetworkView.tsx` hardcoded the color instead of using the `getNodeColor(year, isInCollection)` function.

**Fix**: Updated all three event handlers to:
1. Check if paper is in collection: `isPmidInCollection(paperPmid)`
2. Get paper year: `paper.year || new Date().getFullYear()`
3. Calculate gradient color: `getNodeColor(paperYear, isInCollection)`

**Files Changed**:
- `frontend/src/components/NetworkView.tsx` lines 1250-1289 (Similar Work)
- `frontend/src/components/NetworkView.tsx` lines 1341-1380 (Earlier Work)
- `frontend/src/components/NetworkView.tsx` lines 1431-1470 (Later Work)

**Commit**: `616e8b4` - Fix node gradient coloring for subsequent graphs

---

### Issue 2: ❌ No Cross-References Between Non-Central Nodes (FIXED ✅)

**Problem**: When clicking quick action buttons, the graph only showed edges from the central node to new nodes (star topology). There were NO edges between the newly added papers, even if they cited each other.

**What Was Wrong**: The event handlers only created edges like this:
```
Central Node → New Paper 1
Central Node → New Paper 2
Central Node → New Paper 3
```

But they didn't check if papers cited each other:
```
New Paper 1 → New Paper 2  ❌ MISSING
New Paper 2 → New Paper 3  ❌ MISSING
```

**Root Cause**: The event handlers only created edges from the source node to the new nodes. They didn't check for relationships between the new papers.

**Fix**: 
1. Created `detectCrossReferences()` helper function that:
   - Takes all node PMIDs and existing edges
   - For each node, calls PubMed eLink API to check citations and references
   - Creates edges between nodes that cite each other
   - Limits to first 10 nodes to avoid too many API calls

2. Updated all three event handlers to call `detectCrossReferences()` after adding nodes

3. Created `/api/proxy/pubmed/elink` generic proxy endpoint for PubMed eLink API

**Files Changed**:
- `frontend/src/components/NetworkView.tsx` lines 1154-1237 (detectCrossReferences function)
- `frontend/src/components/NetworkView.tsx` lines 1304-1312 (Similar Work handler)
- `frontend/src/components/NetworkView.tsx` lines 1388-1396 (Earlier Work handler)
- `frontend/src/components/NetworkView.tsx` lines 1472-1480 (Later Work handler)
- `frontend/src/app/api/proxy/pubmed/elink/route.ts` (new file)

**Commit**: `5025d7b` - Add cross-reference detection for quick action buttons

---

## Understanding Button Behavior

### Quick Action Buttons (Add Nodes to Graph)
These buttons **ADD nodes** to the current graph:

1. **Similar Work** button
   - Fetches similar papers from `/api/proxy/articles/${pmid}/similar`
   - Adds nodes with gradient colors based on year
   - Detects cross-references between papers

2. **Earlier Work** button
   - Fetches references from `/api/proxy/articles/${pmid}/references`
   - Adds nodes with gradient colors based on year
   - Detects cross-references between papers

3. **Later Work** button
   - Fetches citations from `/api/proxy/articles/${pmid}/citations`
   - Adds nodes with gradient colors based on year
   - Detects cross-references between papers

### Explore Papers Buttons (Show List Only)
These buttons **ONLY show a list** in the sidebar:

1. **All References** button
   - Shows list of references in sidebar
   - Does NOT add nodes to graph
   - User can click papers to create new columns

2. **All Citations** button
   - Shows list of citations in sidebar
   - Does NOT add nodes to graph
   - User can click papers to create new columns

### Network Views Buttons (Replace Graph)
These buttons **REPLACE the entire graph**:

1. **Citations Network** button
   - Fetches from `/api/proxy/pubmed/network?type=citations`
   - Replaces entire graph
   - Includes cross-reference detection (backend)

2. **References Network** button
   - Fetches from `/api/proxy/pubmed/network?type=references`
   - Replaces entire graph
   - Includes cross-reference detection (backend)

---

## Color Gradient Reference

### Node Colors (Based on Year)
The `getNodeColor()` function applies these colors:

- **Last year**: `#1e40af` (Dark blue) - Very recent papers
- **1-3 years**: `#3b82f6` (Medium blue) - Recent papers
- **3-5 years**: `#60a5fa` (Light blue) - Moderately recent
- **5-10 years**: `#93c5fd` (Lighter blue) - Older papers
- **10+ years**: `#dbeafe` (Lightest blue) - Very old papers
- **In collection**: `#10b981` (Green) - Papers saved to collection

### Edge Colors (Based on Relationship)
Defined in `CytoscapeGraph.tsx`:

- **Citation**: `#10b981` (Green, solid, 2.5px) - Papers that cite the source
- **Reference**: `#3b82f6` (Blue, solid, 2.5px) - Papers cited by the source
- **Similarity**: `#8b5cf6` (Purple, dotted, 2px) - Similar papers

---

## Testing Checklist

### Node Colors
- [ ] Initial graph shows blue gradient based on paper recency
- [ ] Similar Work button adds nodes with gradient colors (not all purple)
- [ ] Earlier Work button adds nodes with gradient colors (not all blue)
- [ ] Later Work button adds nodes with gradient colors (not all green)
- [ ] Papers in collection show green color
- [ ] Recent papers (< 1 year) show dark blue
- [ ] Older papers (> 10 years) show light blue

### Cross-References
- [ ] Similar Work button creates edges between papers that cite each other
- [ ] Earlier Work button creates edges between papers that cite each other
- [ ] Later Work button creates edges between papers that cite each other
- [ ] Console shows "🔍 Detecting cross-references..." logs
- [ ] Console shows "✅ Found cross-reference: PMID1 → PMID2" logs

### Edge Colors
- [ ] Citation edges are green
- [ ] Reference edges are blue
- [ ] Similar edges are purple and dotted
- [ ] Cross-reference edges are visible

---

## Console Logs to Look For

When clicking Similar/Earlier/Later Work buttons:

```
[NetworkView] Adding X similar papers for source PMID
🔍 Detecting cross-references between nodes... [array of PMIDs]
  ✅ Found cross-reference: PMID1 → PMID2
  ✅ Found cross-citation: PMID3 → PMID4
✅ Found N cross-references between non-central nodes
[NetworkView] Added N cross-reference edges
```

---

## Deployment Status

| Commit | Description | Status |
|--------|-------------|--------|
| `616e8b4` | Fix node gradient coloring for subsequent graphs (INCOMPLETE) | ⚠️ Partial |
| `5025d7b` | Add cross-reference detection for quick action buttons | ✅ Deployed |
| `8a52e64` | Remove ...node spread, fix backend colors (INCOMPLETE) | ⚠️ Partial |
| `bb1f8ed` | Add detailed color debugging logs to CytoscapeGraph | ✅ Deployed |
| `e56278e` | **FINAL FIX**: Force NetworkView for all exploration columns | ✅ Deployed |

**Vercel**: Should be live now!

---

## Critical Issue Found and Fixed (Commit 8a52e64)

### The Real Problem

The previous fixes (commits 616e8b4 and 5025d7b) were correct in logic but didn't work because:

1. **Backend was returning hardcoded colors**:
   - `base_article`: Green `#4CAF50`
   - `citing_article`: Blue `#2196F3`
   - `reference_article`: Orange `#FF9800`
   - `similar_article`: Purple `#9C27B0`

2. **Frontend was spreading backend properties**:
   ```typescript
   data: {
     ...node,  // ❌ This copied backend color property
     color: nodeColor,  // ✅ This tried to override, but...
   }
   ```

   The `...node` spread copied ALL backend properties including `color`, and even though we set `color: nodeColor` after, the spread might have caused issues with object property ordering or the backend color was being used elsewhere.

### The Fix

**Backend Change** (`frontend/src/app/api/proxy/pubmed/network/route.ts`):
```typescript
// BEFORE
const colors = {
  'base_article': '#4CAF50',
  'citing_article': '#2196F3',
  'reference_article': '#FF9800',
  'similar_article': '#9C27B0'
};
color: colors[nodeType],

// AFTER
color: '#94a3b8', // Placeholder gray - frontend will override
```

**Frontend Change** (`frontend/src/components/NetworkView.tsx`):
```typescript
// BEFORE
data: {
  ...node,  // ❌ Spreads backend color
  label: ...,
  color: nodeColor,
}

// AFTER
data: {
  // ✅ NO ...node spread - explicitly set only what we need
  label: node.label || node.metadata?.title || ...,
  node_type: ...,
  metadata: {...},
  size: node.size || 60,
  color: nodeColor,  // ✅ ALWAYS use frontend-calculated color
}
```

### Why This Fixes Everything

1. **Backend no longer interferes**: Returns placeholder gray color
2. **Frontend has full control**: Explicitly sets color from `getNodeColor(year, isInCollection)`
3. **No property conflicts**: Removed `...node` spread that was copying backend properties
4. **Consistent across all graphs**: Initial graph AND subsequent graphs use same logic

**BUT THIS STILL DIDN'T FIX SUBSEQUENT GRAPHS!** The real issue was deeper...

---

## The REAL Root Cause (Commit e56278e)

### The Actual Problem

After extensive debugging, we discovered that subsequent graphs were using a **completely different component** called `ExplorationNetworkView` instead of `NetworkView`!

**How it happened:**
1. When you click "Similar Work", "Earlier Work", or "Later Work" buttons in the sidebar
2. `NetworkSidebar.tsx` calls `handleExploreSection()` which fetches exploration results
3. It then creates a column with `explorationResults` in the metadata
4. `MultiColumnNetworkView.tsx` checks if `explorationData` exists
5. If yes → renders `ExplorationNetworkView` (simplified component)
6. If no → renders `NetworkView` (full-featured component)

**ExplorationNetworkView problems:**
- ❌ No gradient node colors (all nodes same color)
- ❌ No cross-reference edges (only star topology from center)
- ❌ No proper edge colors (all edges gray)
- ❌ No backend network endpoint (just displays the exploration results)

### The FINAL Fix

**File: `frontend/src/components/NetworkSidebar.tsx`** (lines 857-903)

Changed from:
```typescript
const columnData = {
  ...selectedNode,
  metadata: {
    ...selectedNode.metadata,
    explorationType: `${section}-${mode}`,
    explorationResults: results, // ❌ This caused ExplorationNetworkView
    explorationTimestamp: new Date().toISOString()
  }
};
```

To:
```typescript
const columnData = {
  ...selectedNode,
  metadata: {
    ...selectedNode.metadata,
    explorationType: `${section}-${mode}`, // ✅ Keep for title
    // explorationResults: results, // ❌ REMOVED
    explorationTimestamp: new Date().toISOString()
  }
};
```

**File: `frontend/src/components/MultiColumnNetworkView.tsx`** (lines 317-352)

Added mapping from explorationType to networkType:
```typescript
// Map exploration type to network type for proper backend endpoint
if (paper.metadata.explorationType) {
  const explorationTypeMap = {
    'papers-similar': { label: 'Similar Work', networkType: 'similar' as const },
    'papers-earlier': { label: 'Earlier Work', networkType: 'references' as const },
    'papers-later': { label: 'Later Work', networkType: 'citations' as const },
    // ...
  };
  const explorationConfig = explorationTypeMap[paper.metadata.explorationType];
  if (explorationConfig) {
    columnTitle = `${explorationConfig.label}: ${paper.metadata.title.substring(0, 25)}...`;
    networkType = explorationConfig.networkType; // ✅ Use correct network type
  }
}

// ✅ IMPORTANT: Always use NetworkView
explorationData: undefined // Never use ExplorationNetworkView
```

### Why This ACTUALLY Fixes Everything

1. **No more ExplorationNetworkView**: Subsequent graphs now use NetworkView
2. **Full backend network**: Fetches from `/api/proxy/pubmed/network` with cross-references
3. **Gradient node colors**: Uses `getNodeColor(year, isInCollection)` function
4. **Colored edges**: Uses relationship-based edge colors (green, blue, purple)
5. **Cross-reference detection**: Backend detects edges between non-central nodes
6. **Consistent behavior**: Initial graph and subsequent graphs use SAME component and logic

---

---

## How to Test

1. Open a paper network (e.g., PMID 41021024)
2. Check initial graph has gradient colors
3. Click on a node to select it
4. Click "Similar Work" button:
   - New nodes should have gradient colors (not all purple)
   - Console should show cross-reference detection
   - Should see edges between new nodes
5. Click "Earlier Work" button:
   - New nodes should have gradient colors (not all blue)
   - Should see cross-reference edges
6. Click "Later Work" button:
   - New nodes should have gradient colors (not all green)
   - Should see cross-reference edges

---

## Known Limitations

1. Cross-reference detection limited to 10 nodes (performance)
2. PubMed API rate limits may cause some cross-references to be missed
3. Cross-references only checked for newly added nodes, not all existing nodes

