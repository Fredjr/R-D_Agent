# 🔍 Network View Left Panel Logic Analysis

## Executive Summary

**Status**: ✅ **CORRECTLY IMPLEMENTED**

The left panel "references view" logic is correctly implemented from UI to backend. All components work together properly:
- ✅ Search functionality works correctly
- ✅ Sort by dropdown works correctly  
- ✅ Quick Actions (Seeds, Recent, Highly Cited) work correctly
- ✅ Filter by Relationship works correctly
- ✅ Relationship counting is accurate
- ✅ Backend API provides correct data structure
- ✅ Data flow from backend → NetworkView → PaperListPanel is correct

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PaperListPanel.tsx (Left Panel)                         │  │
│  │  - Search bar                                            │  │
│  │  - Sort by dropdown (Relevance, Year, Citations, Title) │  │
│  │  - Quick Actions (Seeds, Recent, Highly Cited)          │  │
│  │  - Filter by Relationship (All, 🟢, 🔵, 🟣)             │  │
│  │  - Paper list with badges                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NetworkView.tsx (Main Container)                        │  │
│  │  - Fetches network data from API                         │  │
│  │  - Passes nodes, edges, sourceNodeId to PaperListPanel  │  │
│  │  - Manages state (networkData, selectedNode)            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/proxy/pubmed/network/route.ts                      │  │
│  │  - Fetches data from PubMed eUtils                       │  │
│  │  - Creates nodes and edges                               │  │
│  │  - Detects cross-references                              │  │
│  │  - Returns NetworkData { nodes, edges, metadata }        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PubMed eUtils API                                        │  │
│  │  - elink.fcgi (find related articles)                    │  │
│  │  - efetch.fcgi (fetch article details)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Analysis

### 1. PaperListPanel.tsx (UI Component)

**Location**: `frontend/src/components/PaperListPanel.tsx`

**Props Interface**:
```typescript
interface PaperListPanelProps {
  papers: NetworkNode[];              // All papers in the network
  selectedPaperId: string | null;     // Currently selected paper
  onSelectPaper: (paperId: string) => void;
  seedPapers?: string[];              // PMIDs of seed papers
  sourceNodeId?: string;              // The original source paper
  edges?: Array<{ id, from, to, relationship }>;
  collectionsMap?: Map<string, boolean>;
}
```

**Key Functions**:

#### 1.1 `getRelationship(paperId: string)` (Lines 33-42)
```typescript
const getRelationship = (paperId: string): string | null => {
  if (!sourceNodeId || paperId === sourceNodeId) return null;
  
  const edge = edges.find(
    e => (e.from === paperId && e.to === sourceNodeId) || 
         (e.from === sourceNodeId && e.to === paperId)
  );
  
  return edge?.relationship || null;
};
```

**✅ CORRECT**: 
- Checks both directions (from→to and to→from)
- Returns null for source node itself
- Returns the relationship type from the edge

#### 1.2 `getRelationshipBadge(relationship)` (Lines 45-58)
```typescript
const badges: Record<string, { icon, color, label }> = {
  citation: { icon: '🟢', color: 'bg-green-100...', label: 'Cites' },
  reference: { icon: '🔵', color: 'bg-blue-100...', label: 'Ref' },
  similarity: { icon: '🟣', color: 'bg-purple-100...', label: 'Similar' },
  'co-authored': { icon: '🟠', ... },
  'same-journal': { icon: '🩷', ... },
  'topic-related': { icon: '🔷', ... }
};
```

**✅ CORRECT**: Matches the relationship types from backend API

#### 1.3 `filteredAndSortedPapers` (Lines 73-130)
```typescript
const filteredAndSortedPapers = useMemo(() => {
  let filtered = papers;

  // 1. Search filter (lines 77-84)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(paper =>
      paper.metadata.title?.toLowerCase().includes(query) ||
      paper.metadata.authors?.some(author => author.toLowerCase().includes(query)) ||
      paper.metadata.journal?.toLowerCase().includes(query)
    );
  }

  // 2. Relationship filter (lines 87-92)
  if (filterRelationship !== 'all') {
    filtered = filtered.filter(paper => {
      const rel = getRelationship(paper.id);
      return rel === filterRelationship;
    });
  }

  // 3. Smart Filters (lines 95-112)
  if (showSeedsOnly) {
    filtered = filtered.filter(paper => seedPapers.includes(paper.id));
  }

  if (showRecentOnly) {
    const currentYear = new Date().getFullYear();
    filtered = filtered.filter(paper => {
      const year = paper.metadata.year || 0;
      return currentYear - year <= 3; // Last 3 years
    });
  }

  if (showHighlyCitedOnly) {
    const citationThreshold = 50;
    filtered = filtered.filter(paper =>
      (paper.metadata.citation_count || 0) >= citationThreshold
    );
  }

  // 4. Sort (lines 115-127)
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'year') {
      return (b.metadata.year || 0) - (a.metadata.year || 0);
    } else if (sortBy === 'citations') {
      return (b.metadata.citation_count || 0) - (a.metadata.citation_count || 0);
    } else if (sortBy === 'title') {
      const titleA = a.metadata.title?.toLowerCase() || '';
      const titleB = b.metadata.title?.toLowerCase() || '';
      return titleA.localeCompare(titleB);
    }
    return 0; // relevance (original order)
  });

  return sorted;
}, [papers, searchQuery, sortBy, filterRelationship, showSeedsOnly, showRecentOnly, showHighlyCitedOnly, seedPapers, edges, sourceNodeId]);
```

**✅ CORRECT**: 
- All filters work independently and can be combined
- Search is case-insensitive and searches title, authors, journal
- Relationship filter uses `getRelationship()` correctly
- Sort options work correctly
- Dependencies array is complete

#### 1.4 `relationshipCounts` (Lines 133-152)
```typescript
const relationshipCounts = useMemo(() => {
  const counts: Record<string, number> = {
    all: papers.length,
    citation: 0,
    reference: 0,
    similarity: 0,
    'co-authored': 0,
    'same-journal': 0,
    'topic-related': 0
  };

  papers.forEach(paper => {
    const rel = getRelationship(paper.id);
    if (rel && counts[rel] !== undefined) {
      counts[rel]++;
    }
  });

  return counts;
}, [papers, edges, sourceNodeId]);
```

**✅ CORRECT**: 
- Counts all papers by relationship type
- Uses `getRelationship()` for each paper
- Dependencies include edges and sourceNodeId

---

### 2. NetworkView.tsx (Container Component)

**Location**: `frontend/src/components/NetworkView.tsx`

**Data Flow** (Lines 1887-1920):
```typescript
<PaperListPanel
  papers={networkData.nodes}                    // ✅ All nodes from API
  selectedPaperId={selectedNode?.id || null}    // ✅ Current selection
  onSelectPaper={(paperId) => { ... }}          // ✅ Selection handler
  seedPapers={(() => {                          // ✅ Extract from collections
    const seedPmids: string[] = [];
    collections.forEach(collection => {
      collection.articles?.forEach(article => {
        if (article.is_seed) {
          seedPmids.push(article.pmid);
        }
      });
    });
    return seedPmids;
  })()}
  sourceNodeId={sourceId}                       // ✅ Source PMID
  edges={networkData.edges || []}               // ✅ All edges from API
  collectionsMap={(() => { ... })()}            // ✅ Collection membership
/>
```

**✅ CORRECT**: All props are correctly passed from networkData

**API Fetch** (Lines 641-750):
```typescript
const fetchNetworkData = useCallback(async () => {
  // Determine endpoint based on navigation mode
  switch (navigationMode) {
    case 'similar':
      endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=similar&limit=15`;
      break;
    case 'earlier':
      endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=references&limit=15`;
      break;
    case 'later':
      endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=15`;
      break;
    default:
      endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=12`;
  }

  const response = await fetch(endpoint);
  const data = await response.json();
  setNetworkData(data);  // ✅ Sets { nodes, edges, metadata }
}, [sourceId, navigationMode, ...]);
```

**✅ CORRECT**: Fetches from correct API endpoint and stores in state

---

### 3. Backend API (/api/proxy/pubmed/network/route.ts)

**Location**: `frontend/src/app/api/proxy/pubmed/network/route.ts`

**Response Structure** (Lines 35-44):
```typescript
interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    source_pmid: string;
    network_type: string;
    total_nodes: number;
    total_edges: number;
  };
}
```

**Node Structure** (Lines 9-25):
```typescript
interface NetworkNode {
  id: string;                    // PMID
  label: string;                 // Truncated title
  size: number;                  // Node size
  color: string;                 // Placeholder gray
  metadata: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    url: string;
    abstract?: string;
    node_type: 'base_article' | 'citing_article' | 'reference_article' | 'similar_article';
  };
}
```

**Edge Structure** (Lines 27-33):
```typescript
interface NetworkEdge {
  id: string;                                    // Unique edge ID
  from: string;                                  // Source PMID
  to: string;                                    // Target PMID
  relationship: 'citation' | 'reference' | 'similarity';
  weight?: number;
}
```

**✅ CORRECT**: All required fields are present

**Edge Creation Logic**:

1. **Citation Edges** (Lines 388-396):
```typescript
edges.push({
  id: `${article.pmid}-cites-${pmid}`,
  from: article.pmid,    // Citing paper
  to: pmid,              // Source paper
  relationship: 'citation',
  weight: 1
});
```

2. **Reference Edges** (Lines 409-416):
```typescript
edges.push({
  id: `${pmid}-refs-${article.pmid}`,
  from: pmid,            // Source paper
  to: article.pmid,      // Referenced paper
  relationship: 'reference',
  weight: 1
});
```

3. **Similarity Edges** (Lines 433-440):
```typescript
edges.push({
  id: `${pmid}-similar-${article.pmid}`,
  from: pmid,            // Source paper
  to: article.pmid,      // Similar paper
  relationship: 'similarity',
  weight: 0.8
});
```

**✅ CORRECT**: Edge directions match semantic meaning

**Cross-Reference Detection** (Lines 443-500):
```typescript
// For each non-central node, check if it cites/references other nodes
for (let i = 0; i < nodePmids.length && i < 10; i++) {
  const nodePmid = nodePmids[i];
  
  // Check citations
  const citedByThisNode = await findRelatedArticles(nodePmid, 'pubmed_pubmed_refs', 50);
  for (const citedPmid of citedByThisNode) {
    if (nodePmids.includes(citedPmid) && citedPmid !== nodePmid) {
      edges.push({
        id: `${nodePmid}-refs-${citedPmid}`,
        from: nodePmid,
        to: citedPmid,
        relationship: 'reference',
        weight: 0.5
      });
    }
  }
  
  // Check references
  const citingThisNode = await findRelatedArticles(nodePmid, 'pubmed_pubmed_citedin', 50);
  for (const citingPmid of citingThisNode) {
    if (nodePmids.includes(citingPmid) && citingPmid !== nodePmid) {
      edges.push({
        id: `${citingPmid}-cites-${nodePmid}`,
        from: citingPmid,
        to: nodePmid,
        relationship: 'citation',
        weight: 0.5
      });
    }
  }
}
```

**✅ CORRECT**: Detects relationships between non-central nodes

---

## Verification Checklist

### ✅ Data Structure
- [x] Backend returns `{ nodes, edges, metadata }`
- [x] Nodes have all required metadata fields
- [x] Edges have `from`, `to`, `relationship` fields
- [x] Relationship types match between backend and frontend

### ✅ Data Flow
- [x] NetworkView fetches from correct API endpoint
- [x] NetworkView stores data in `networkData` state
- [x] NetworkView passes `networkData.nodes` to PaperListPanel
- [x] NetworkView passes `networkData.edges` to PaperListPanel
- [x] NetworkView passes `sourceId` as `sourceNodeId`

### ✅ UI Functionality
- [x] Search filters by title, authors, journal
- [x] Sort by works for all options (relevance, year, citations, title)
- [x] Seeds filter shows only seed papers
- [x] Recent filter shows papers from last 3 years
- [x] Highly Cited filter shows papers with 50+ citations
- [x] Relationship filter shows correct counts
- [x] Relationship badges display correct colors/icons

### ✅ Logic Correctness
- [x] `getRelationship()` checks both edge directions
- [x] `getRelationship()` returns null for source node
- [x] Relationship counting uses `getRelationship()`
- [x] Filters can be combined
- [x] useMemo dependencies are complete

---

## Conclusion

**The left panel logic is CORRECTLY IMPLEMENTED from UI to backend.**

All components work together properly:
1. Backend API creates correct nodes and edges
2. NetworkView fetches and stores data correctly
3. PaperListPanel receives correct props
4. All filters and sorting work as expected
5. Relationship detection is accurate

**No bugs found in the implementation.**

