# 🎯 PHASE 1.3: Three-Panel Layout + Edge Visualization

## 📋 Overview

This phase combines two critical improvements:
1. **Three-Panel Layout** - Match ResearchRabbit's UI structure
2. **Edge Visualization** - Show clear relationships between papers

---

## 🎨 PART A: Edge Visualization (PRIORITY 1)

### **Current Problem**
Looking at your screenshots and our code:
- ❌ **All edges are gray** - No visual distinction between relationship types
- ❌ **No edge labels** - Users can't see HOW papers are connected
- ❌ **No legend** - Users don't know what connections mean
- ❌ **Backend sends relationship data** but frontend ignores it

### **What ResearchRabbit Shows**
From your screenshots, ResearchRabbit clearly displays:
- ✅ **Visible lines** connecting papers
- ✅ **Different line styles** for different relationships
- ✅ **Clear visual hierarchy** - which paper connects to which
- ✅ **Source paper highlighted** - easy to see the origin

### **Our Implementation Plan**

#### **1. Color-Coded Edges by Relationship Type**
```typescript
// Edge colors matching relationship types
const EDGE_COLORS = {
  citation: '#10b981',    // 🟢 Green - Papers that cite the source
  reference: '#3b82f6',   // 🔵 Blue - Papers cited by the source
  similarity: '#8b5cf6',  // 🟣 Purple - Similar papers
  'co-authored': '#f59e0b', // 🟠 Orange - Same authors
  'same-journal': '#ec4899', // 🩷 Pink - Same journal
  'topic-related': '#6366f1', // 🔷 Indigo - Related topics
  default: '#94a3b8'      // ⚪ Gray - Unknown
};
```

#### **2. Edge Labels**
```typescript
const EDGE_LABELS = {
  citation: 'cites',
  reference: 'references',
  similarity: 'similar',
  'co-authored': 'co-author',
  'same-journal': 'same journal',
  'topic-related': 'related topic'
};
```

#### **3. Enhanced Edge Rendering**
```typescript
const flowEdges: Edge[] = (data.edges || []).map((edge) => {
  const relationship = edge.relationship || 'default';
  const edgeColor = EDGE_COLORS[relationship] || EDGE_COLORS.default;
  const edgeLabel = EDGE_LABELS[relationship] || '';
  
  return {
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    animated: relationship === 'citation' || relationship === 'reference',
    label: edgeLabel,
    labelStyle: { 
      fill: edgeColor, 
      fontWeight: 600, 
      fontSize: 11,
      fontFamily: 'Inter, sans-serif'
    },
    labelBgStyle: { 
      fill: 'white', 
      fillOpacity: 0.9,
      rx: 4,
      ry: 4
    },
    style: {
      stroke: edgeColor,
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: edgeColor,
    },
    data: {
      relationship: relationship,
      tooltip: getEdgeTooltip(relationship)
    }
  };
});
```

#### **4. Legend Component**
```typescript
const EdgeLegend = () => (
  <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-10">
    <div className="text-xs font-semibold text-gray-700 mb-2">Relationships</div>
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-green-500"></div>
        <span>Cites source</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-blue-500"></div>
        <span>Referenced by source</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-purple-500"></div>
        <span>Similar topic</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-orange-500"></div>
        <span>Co-authored</span>
      </div>
    </div>
  </div>
);
```

#### **5. Sidebar Relationship Info**
When a node is selected, show how it relates to the source:
```typescript
{selectedNode && (
  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
    <div className="text-xs font-semibold text-blue-900 mb-1">
      Relationship to Source Paper
    </div>
    <div className="text-xs text-blue-700">
      {getRelationshipDescription(selectedNode.id, edges)}
    </div>
  </div>
)}
```

---

## 🎨 PART B: Three-Panel Layout

### **Current Layout**
```
┌─────────────────────────────────────────┐
│         Network Graph (Full Width)      │
│                                         │
│  [Sidebar on right when node selected]  │
└─────────────────────────────────────────┘
```

### **ResearchRabbit Layout** (from your screenshots)
```
┌──────────┬─────────────────────┬──────────┐
│  LEFT    │      CENTER         │  RIGHT   │
│  PANEL   │      PANEL          │  PANEL   │
│          │                     │          │
│ Paper    │   Network Graph     │  Paper   │
│ List     │   Visualization     │  Details │
│          │                     │          │
│ - Seeds  │   [Interactive      │  Title   │
│ - Papers │    Graph with       │  Authors │
│          │    Nodes & Edges]   │  Abstract│
│ Filters  │                     │  Actions │
│          │   Zoom Controls     │          │
└──────────┴─────────────────────┴──────────┘
```

### **Implementation Structure**

#### **1. Layout Component**
```typescript
<div className="flex h-screen">
  {/* LEFT PANEL - Paper List */}
  <div className="w-80 border-r bg-white overflow-y-auto">
    <PaperListPanel 
      papers={papers}
      selectedPaperId={selectedNode?.id}
      onSelectPaper={handleSelectPaper}
      seedPapers={seedPapers}
    />
  </div>
  
  {/* CENTER PANEL - Network Graph */}
  <div className="flex-1 relative">
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      {...otherProps}
    />
    <EdgeLegend />
  </div>
  
  {/* RIGHT PANEL - Paper Details */}
  <div className="w-96 border-l bg-white overflow-y-auto">
    <NetworkSidebar
      selectedNode={selectedNode}
      {...otherProps}
    />
  </div>
</div>
```

#### **2. Left Panel - Paper List**
Features:
- ✅ List of all papers in network
- ✅ Seed papers highlighted with ⭐
- ✅ Click to select/focus in graph
- ✅ Search/filter papers
- ✅ Sort by: relevance, date, citations
- ✅ Show relationship type badge

#### **3. Center Panel - Network Graph**
Features:
- ✅ Interactive graph visualization
- ✅ Color-coded edges
- ✅ Edge labels
- ✅ Legend
- ✅ Zoom controls
- ✅ Fit to screen button

#### **4. Right Panel - Paper Details**
Features:
- ✅ Current NetworkSidebar content
- ✅ Relationship info
- ✅ Seed paper toggle
- ✅ Add to collection
- ✅ Exploration buttons

---

## 📊 Implementation Priority

### **Phase 1.3A: Edge Visualization** (Day 1-2)
1. ✅ Add color-coded edges
2. ✅ Add edge labels
3. ✅ Add legend component
4. ✅ Add relationship info to sidebar
5. ✅ Test and verify

### **Phase 1.3B: Three-Panel Layout** (Day 3-4)
1. ✅ Create PaperListPanel component
2. ✅ Restructure NetworkView layout
3. ✅ Add responsive design
4. ✅ Add panel collapse/expand
5. ✅ Test and verify

---

## 🎯 Success Criteria

### **Edge Visualization**
- ✅ Users can see HOW papers are connected
- ✅ Different relationship types have different colors
- ✅ Edge labels are readable
- ✅ Legend explains the colors
- ✅ Sidebar shows relationship to source

### **Three-Panel Layout**
- ✅ Left panel shows paper list
- ✅ Center panel shows network graph
- ✅ Right panel shows paper details
- ✅ Panels are resizable/collapsible
- ✅ Layout is responsive

---

## 📁 Files to Modify

1. **frontend/src/components/NetworkView.tsx**
   - Update edge rendering (lines 949-963)
   - Add legend component
   - Restructure layout for 3 panels

2. **frontend/src/components/NetworkSidebar.tsx**
   - Add relationship info section
   - Update styling for right panel

3. **frontend/src/components/PaperListPanel.tsx** (NEW)
   - Create left panel component
   - Paper list with filters
   - Seed paper indicators

---

## 🚀 Let's Start!

I'll begin with **Phase 1.3A: Edge Visualization** since it's the most critical for user understanding.

