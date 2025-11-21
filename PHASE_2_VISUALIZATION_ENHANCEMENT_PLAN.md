# Phase 2: Visualization Enhancement Plan

**Date**: 2025-11-21  
**Goal**: Add visual components to display research journey and correlation maps  
**Estimated Time**: 5 hours  
**Status**: 🚀 **STARTING NOW**

---

## 🎯 **PHASE 2 OBJECTIVES**

Transform the text-based research journey and correlation maps into **interactive visual components** that make the research flow immediately clear and actionable.

### **What We're Building**:

1. **Protocol-Paper Correlation Tracking** (Backend - 1 hour)
   - Track which protocols came from which papers
   - Store source paper PMID in protocol metadata
   - Enable filtering protocols by source paper

2. **Enhanced Correlation Map Visualization** (Frontend - 2 hours)
   - Interactive flowchart showing Q → H → Paper → Protocol → Experiment
   - Clickable nodes that navigate to details
   - Visual indicators for gaps and strengths
   - Color coding by status and confidence

3. **Research Journey Timeline Component** (Frontend - 2 hours)
   - Chronological timeline with events
   - Visual markers for different event types
   - Expandable details for each event
   - Filter by event type
   - Show decision rationales inline

---

## 📋 **TASK 1: Protocol-Paper Correlation (Backend - 1 hour)**

### **Goal**: Track which papers each protocol came from

### **1.1 Update Protocol Model** (15 minutes)

**File**: `database.py`

**Current Protocol Model**:
```python
class Protocol(Base):
    __tablename__ = "protocols"
    protocol_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    article_pmid = Column(String, ForeignKey("articles.pmid"))
    # ... other fields
```

**Enhancement Needed**:
- ✅ Already has `article_pmid` field!
- Just need to ensure it's populated correctly

### **1.2 Verify Protocol Extraction Service** (15 minutes)

**File**: `backend/app/services/protocol_extraction_service.py`

**Check**: Ensure `article_pmid` is set when creating protocols

### **1.3 Add Protocol-Paper Query Helper** (30 minutes)

**File**: `backend/app/services/living_summary_service.py`

**Add method**:
```python
def _get_protocol_paper_correlations(self, project_data: Dict) -> Dict[str, List[str]]:
    """Build map of protocol_id -> [paper_pmids]"""
    correlations = {}
    
    for protocol in project_data['protocols']:
        if protocol.article_pmid:
            correlations[protocol.protocol_id] = [protocol.article_pmid]
    
    return correlations
```

**Update `_build_correlation_map()`** to use this data.

---

## 📋 **TASK 2: Enhanced Correlation Map Visualization (Frontend - 2 hours)**

### **Goal**: Interactive flowchart showing research connections

### **2.1 Create CorrelationMapVisualization Component** (1.5 hours)

**File**: `frontend/src/components/project/CorrelationMapVisualization.tsx`

**Features**:
- Uses React Flow or similar library for flowchart
- Nodes for: Questions, Hypotheses, Papers, Protocols, Experiments
- Edges showing connections
- Color coding:
  - Green: Complete chain
  - Yellow: Partial chain
  - Red: Broken chain (gaps)
- Click handlers to navigate to details
- Zoom and pan controls
- Legend explaining colors

**Component Structure**:
```typescript
interface Node {
  id: string;
  type: 'question' | 'hypothesis' | 'paper' | 'protocol' | 'experiment';
  label: string;
  status: string;
  confidence?: number;
  score?: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'supports' | 'derives' | 'implements';
}

interface CorrelationMapProps {
  projectId: string;
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string, nodeType: string) => void;
}
```

### **2.2 Integrate into SummariesTab** (30 minutes)

**File**: `frontend/src/components/project/SummariesTab.tsx`

**Add**:
- Parse correlation map from summary data
- Convert to nodes/edges format
- Render CorrelationMapVisualization component
- Add toggle to switch between text and visual view

---

## 📋 **TASK 3: Research Journey Timeline Component (Frontend - 2 hours)**

### **Goal**: Visual timeline showing chronological research progression

### **3.1 Create ResearchJourneyTimeline Component** (1.5 hours)

**File**: `frontend/src/components/project/ResearchJourneyTimeline.tsx`

**Features**:
- Vertical timeline with events
- Event types with icons:
  - ❓ Question
  - 💡 Hypothesis
  - 📄 Paper
  - 🔬 Protocol
  - 🧪 Experiment
  - ⚡ Decision
- Expandable event details
- Filter by event type
- Date/time stamps
- Decision rationales shown inline
- Color coding by status
- Smooth animations

**Component Structure**:
```typescript
interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'question' | 'hypothesis' | 'paper' | 'protocol' | 'experiment' | 'decision';
  title: string;
  description?: string;
  status?: string;
  rationale?: string;
  metadata?: Record<string, any>;
}

interface ResearchJourneyTimelineProps {
  events: TimelineEvent[];
  onEventClick: (eventId: string, eventType: string) => void;
  filterTypes?: string[];
}
```

### **3.2 Integrate into SummariesTab** (30 minutes)

**File**: `frontend/src/components/project/SummariesTab.tsx`

**Add**:
- Parse journey timeline from summary data
- Convert to TimelineEvent[] format
- Render ResearchJourneyTimeline component
- Add filter controls for event types

---

## 🎨 **DESIGN SPECIFICATIONS**

### **Color Palette**:
- **Questions**: Blue (#3B82F6)
- **Hypotheses**: Purple (#8B5CF6)
- **Papers**: Green (#10B981)
- **Protocols**: Orange (#F59E0B)
- **Experiments**: Red (#EF4444)
- **Decisions**: Yellow (#FBBF24)

### **Status Colors**:
- **Complete**: Green (#10B981)
- **In Progress**: Blue (#3B82F6)
- **Planned**: Gray (#6B7280)
- **Blocked**: Red (#EF4444)

### **Confidence/Score Indicators**:
- **High (80-100)**: Green
- **Medium (50-79)**: Yellow
- **Low (0-49)**: Red

---

## 📦 **DEPENDENCIES**

### **Frontend Libraries Needed**:
```json
{
  "react-flow-renderer": "^10.3.17",  // For flowcharts
  "framer-motion": "^10.16.4"         // For animations (may already be installed)
}
```

### **Installation**:
```bash
cd frontend
npm install react-flow-renderer
```

---

## ✅ **SUCCESS CRITERIA**

### **Backend**:
- [ ] Protocol-paper correlations tracked correctly
- [ ] Correlation map includes protocol sources
- [ ] No performance degradation

### **Frontend**:
- [ ] Correlation map renders as interactive flowchart
- [ ] Timeline shows chronological events
- [ ] Click handlers navigate to details
- [ ] Filters work correctly
- [ ] Responsive design works on all screen sizes
- [ ] Smooth animations and transitions
- [ ] No console errors

### **User Experience**:
- [ ] Research flow is immediately clear
- [ ] Gaps are visually obvious
- [ ] Navigation is intuitive
- [ ] Performance is smooth (< 1s render time)

---

## 🚀 **IMPLEMENTATION ORDER**

1. **Task 1**: Protocol-Paper Correlation (Backend) - 1 hour
2. **Task 3**: Research Journey Timeline (Frontend) - 2 hours
3. **Task 2**: Correlation Map Visualization (Frontend) - 2 hours

**Rationale**: Timeline is simpler than flowchart, so do it first to build momentum.

---

**Status**: 📋 **PLANNED - Ready to Start**  
**Next Step**: Install frontend dependencies and start with Task 1

