# 🔧 WEEK 11 TECHNICAL SPECIFICATION

**Date:** November 2, 2025  
**Purpose:** Detailed technical specifications for implementation

---

## 📊 DATABASE SCHEMA CHANGES

### **1. Annotation Table Updates**

**Current Schema:**
```sql
CREATE TABLE annotations (
    annotation_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    article_pmid VARCHAR(50),
    note_type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author_id VARCHAR(255) NOT NULL
);
```

**New Columns to Add:**
```sql
ALTER TABLE annotations 
ADD COLUMN pdf_page INTEGER,
ADD COLUMN pdf_coordinates JSONB,
ADD COLUMN highlight_color VARCHAR(7),
ADD COLUMN highlight_text TEXT;
```

**JSONB Structure for pdf_coordinates:**
```json
{
  "x": 0.25,        // Normalized X position (0-1)
  "y": 0.35,        // Normalized Y position (0-1)
  "width": 0.15,    // Normalized width (0-1)
  "height": 0.02,   // Normalized height (0-1)
  "pageWidth": 612, // Original page width in points
  "pageHeight": 792 // Original page height in points
}
```

**Migration Script:**
```python
# backend/migrations/add_pdf_annotations.py
from sqlalchemy import text
from database import get_session_local

def migrate():
    db = get_session_local()()
    try:
        db.execute(text("""
            ALTER TABLE annotations 
            ADD COLUMN IF NOT EXISTS pdf_page INTEGER,
            ADD COLUMN IF NOT EXISTS pdf_coordinates JSONB,
            ADD COLUMN IF NOT EXISTS highlight_color VARCHAR(7),
            ADD COLUMN IF NOT EXISTS highlight_text TEXT;
        """))
        db.commit()
        print("✅ Migration successful")
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
```

---

### **2. Project Settings Schema**

**Current:** `settings` column is JSON

**New Fields to Add:**
```json
{
  "research_question": "What are the mechanisms of cancer immunotherapy?",
  "seed_pmid": "39361594",
  "seed_title": "Cancer immunotherapy: mechanisms and clinical applications",
  "onboarding_completed": true,
  "onboarding_completed_at": "2025-11-02T10:30:00Z"
}
```

**No migration needed** - JSON column is flexible

---

## 🎨 FRONTEND COMPONENTS SPECIFICATION

### **1. HighlightTool Component**

**Location:** `frontend/src/components/reading/HighlightTool.tsx`

**Props:**
```typescript
interface HighlightToolProps {
  selectedText: string;
  selection: {
    pageNumber: number;
    boundingRect: DOMRect;
    textContent: string;
  } | null;
  onCreateHighlight: (highlight: {
    text: string;
    color: string;
    page: number;
    coordinates: HighlightCoordinates;
  }) => void;
  onCancel: () => void;
}
```

**State:**
```typescript
const [selectedColor, setSelectedColor] = useState('#FFEB3B'); // Yellow default
const [showColorPicker, setShowColorPicker] = useState(false);
```

**Colors:**
```typescript
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FFEB3B', bg: 'bg-yellow-300' },
  { name: 'Green', hex: '#4CAF50', bg: 'bg-green-300' },
  { name: 'Blue', hex: '#2196F3', bg: 'bg-blue-300' },
  { name: 'Pink', hex: '#E91E63', bg: 'bg-pink-300' },
  { name: 'Orange', hex: '#FF9800', bg: 'bg-orange-300' },
];
```

**UI Layout:**
```
┌─────────────────────────────────┐
│  "Selected text preview..."     │
│                                 │
│  ● ● ● ● ●  [Create Highlight]  │
│  Colors     [Cancel]            │
└─────────────────────────────────┘
```

---

### **2. HighlightLayer Component**

**Location:** `frontend/src/components/reading/HighlightLayer.tsx`

**Props:**
```typescript
interface HighlightLayerProps {
  highlights: Highlight[];
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  onHighlightClick: (highlight: Highlight) => void;
}
```

**Rendering Logic:**
```typescript
// Convert normalized coordinates to pixel positions
const getHighlightStyle = (highlight: Highlight, scale: number) => {
  const coords = highlight.pdf_coordinates;
  return {
    position: 'absolute',
    left: `${coords.x * 100}%`,
    top: `${coords.y * 100}%`,
    width: `${coords.width * 100}%`,
    height: `${coords.height * 100}%`,
    backgroundColor: highlight.highlight_color,
    opacity: 0.3,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };
};
```

**Z-Index Layering:**
```
PDF Canvas (z-index: 1)
Text Layer (z-index: 2)
Highlight Layer (z-index: 3)
Annotation Layer (z-index: 4)
```

---

### **3. AnnotationsSidebar Component**

**Location:** `frontend/src/components/reading/AnnotationsSidebar.tsx`

**Props:**
```typescript
interface AnnotationsSidebarProps {
  pmid: string;
  projectId: string;
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
  onAddNote: (highlightId: string, note: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Annotations (5)             │
│ ─────────────────────────── │
│                             │
│ Page 1                      │
│ ┌─────────────────────────┐ │
│ │ "cancer immunotherapy"  │ │
│ │ mechanisms...           │ │
│ │ [Add Note] [Delete]     │ │
│ └─────────────────────────┘ │
│                             │
│ Page 2                      │
│ ┌─────────────────────────┐ │
│ │ "clinical trials show"  │ │
│ │ Note: Important finding │ │
│ │ [Edit] [Delete]         │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

### **4. Step4FirstProject Component**

**Location:** `frontend/src/components/onboarding/Step4FirstProject.tsx`

**Props:**
```typescript
interface Step4FirstProjectProps {
  researchInterests: {
    topics: string[];
    keywords: string[];
    careerStage: string;
  };
  onProjectCreated: (projectId: string, projectName: string) => void;
  onBack: () => void;
}
```

**State:**
```typescript
const [projectName, setProjectName] = useState('');
const [researchQuestion, setResearchQuestion] = useState('');
const [description, setDescription] = useState('');
const [creating, setCreating] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Project Name Suggestions:**
```typescript
const suggestProjectName = (topics: string[]) => {
  if (topics.length === 0) return 'My Research Project';
  if (topics.length === 1) {
    const topic = RESEARCH_TOPICS.find(t => t.id === topics[0]);
    return `${topic?.name} Research`;
  }
  return 'Multi-Topic Research Project';
};
```

**Validation:**
```typescript
const isValid = 
  projectName.trim().length >= 3 &&
  researchQuestion.trim().length >= 20 &&
  researchQuestion.trim().length <= 500;
```

---

### **5. Step5SeedPaper Component**

**Location:** `frontend/src/components/onboarding/Step5SeedPaper.tsx`

**Props:**
```typescript
interface Step5SeedPaperProps {
  projectId: string;
  researchQuestion: string;
  researchInterests: {
    topics: string[];
    keywords: string[];
  };
  onSeedPaperSelected: (pmid: string, title: string) => void;
  onSkip: () => void;
  onBack: () => void;
}
```

**Search Query Generation:**
```typescript
const generateSearchQuery = (question: string, interests: any) => {
  // Extract keywords from research question
  const stopWords = ['what', 'how', 'why', 'when', 'where', 'are', 'is', 'the', 'of', 'in', 'to', 'for'];
  const words = question.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));
  
  // Take first 3-5 keywords
  const keywords = words.slice(0, 5).join(' ');
  
  // Fallback to research interests
  if (keywords.length < 10 && interests.keywords.length > 0) {
    return interests.keywords.slice(0, 3).join(' ');
  }
  
  return keywords;
};
```

**Paper Display:**
```typescript
interface PaperResult {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
}
```

---

### **6. Step6ExploreOrganize Component**

**Location:** `frontend/src/components/onboarding/Step6ExploreOrganize.tsx`

**Props:**
```typescript
interface Step6ExploreOrganizeProps {
  projectId: string;
  seedPmid: string;
  seedTitle: string;
  onComplete: (collectionId: string) => void;
  onBack: () => void;
}
```

**State:**
```typescript
const [relatedPapers, setRelatedPapers] = useState<PaperResult[]>([]);
const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
const [collectionName, setCollectionName] = useState('');
const [loading, setLoading] = useState(true);
const [creating, setCreating] = useState(false);
```

**Collection Name Suggestion:**
```typescript
const suggestCollectionName = (seedTitle: string) => {
  // Extract first 3-4 words from seed title
  const words = seedTitle.split(' ').slice(0, 4).join(' ');
  return `${words} Collection`;
};
```

---

### **7. Step7FirstNote Component**

**Location:** `frontend/src/components/onboarding/Step7FirstNote.tsx`

**Props:**
```typescript
interface Step7FirstNoteProps {
  projectId: string;
  seedPmid: string;
  seedTitle: string;
  onComplete: () => void;
  onBack: () => void;
}
```

**Note Type Examples:**
```typescript
const NOTE_TYPE_EXAMPLES = {
  finding: 'Key finding: This paper shows that...',
  hypothesis: 'Hypothesis: Based on this, I think...',
  question: 'Question: How does this relate to...?',
  todo: 'TODO: Read the methods section in detail',
  comparison: 'Comparison: This differs from Smith et al. because...',
  critique: 'Critique: The sample size is too small...',
  general: 'General note: Interesting paper on...',
};
```

---

## 🔌 API ENDPOINTS SPECIFICATION

### **1. Create Annotation with PDF Coordinates**

**Endpoint:** `POST /projects/{projectId}/annotations`

**Request Body:**
```json
{
  "content": "Important finding about cancer immunotherapy",
  "article_pmid": "39361594",
  "note_type": "finding",
  "priority": "high",
  "status": "active",
  "pdf_page": 3,
  "pdf_coordinates": {
    "x": 0.25,
    "y": 0.35,
    "width": 0.15,
    "height": 0.02,
    "pageWidth": 612,
    "pageHeight": 792
  },
  "highlight_color": "#FFEB3B",
  "highlight_text": "cancer immunotherapy mechanisms"
}
```

**Response:**
```json
{
  "annotation_id": "uuid-here",
  "project_id": "project-uuid",
  "content": "Important finding...",
  "article_pmid": "39361594",
  "pdf_page": 3,
  "pdf_coordinates": {...},
  "highlight_color": "#FFEB3B",
  "created_at": "2025-11-02T10:30:00Z"
}
```

---

### **2. Get Annotations for Article**

**Endpoint:** `GET /projects/{projectId}/annotations?article_pmid={pmid}`

**Response:**
```json
{
  "annotations": [
    {
      "annotation_id": "uuid-1",
      "content": "Important finding",
      "pdf_page": 3,
      "pdf_coordinates": {...},
      "highlight_color": "#FFEB3B",
      "highlight_text": "cancer immunotherapy",
      "created_at": "2025-11-02T10:30:00Z"
    }
  ]
}
```

---

### **3. Update Project Settings**

**Endpoint:** `PUT /projects/{projectId}`

**Request Body:**
```json
{
  "settings": {
    "research_question": "What are the mechanisms?",
    "seed_pmid": "39361594",
    "seed_title": "Cancer immunotherapy paper",
    "onboarding_completed": true
  }
}
```

---

## 🧪 TESTING SCRIPTS

### **1. PDF Annotation Testing Script**

```javascript
// Test PDF annotation flow
async function testPDFAnnotations() {
  const pmid = '39361594';
  const projectId = 'your-project-id';
  
  // 1. Open PDF viewer
  console.log('1. Opening PDF viewer...');
  // Click "Read PDF" button
  
  // 2. Select text
  console.log('2. Selecting text...');
  // Manually select text in PDF
  
  // 3. Create highlight
  console.log('3. Creating highlight...');
  const highlight = {
    text: 'cancer immunotherapy',
    color: '#FFEB3B',
    page: 1,
    coordinates: { x: 0.25, y: 0.35, width: 0.15, height: 0.02 }
  };
  
  // 4. Add note to highlight
  console.log('4. Adding note...');
  const note = 'Important finding about mechanisms';
  
  // 5. Verify persistence
  console.log('5. Reloading PDF...');
  // Close and reopen PDF viewer
  // Verify highlight appears
  
  console.log('✅ PDF annotation test complete');
}
```

---

### **2. Onboarding Flow Testing Script**

```javascript
// Test complete onboarding flow
async function testOnboardingFlow() {
  console.log('Starting onboarding test...');
  
  // Step 1-3: Existing steps
  console.log('✅ Steps 1-3 complete');
  
  // Step 4: Create project
  console.log('Testing Step 4: Create Project');
  const projectData = {
    name: 'Cancer Immunotherapy Research',
    question: 'What are the mechanisms of cancer immunotherapy?',
    description: 'Research project on cancer immunotherapy'
  };
  // Verify project created
  
  // Step 5: Find seed paper
  console.log('Testing Step 5: Find Seed Paper');
  // Search for papers
  // Select seed paper
  // Verify seed saved
  
  // Step 6: Explore & organize
  console.log('Testing Step 6: Explore & Organize');
  // View related papers
  // Select papers
  // Create collection
  // Verify collection created
  
  // Step 7: Add first note
  console.log('Testing Step 7: Add First Note');
  // Create note
  // Verify note saved
  
  // Verify redirect to project page
  console.log('✅ Onboarding flow test complete');
}
```

---

**Ready for implementation!** 🚀

