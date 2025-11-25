# Phase 2: Medium-Term Enhancements - Implementation Plan

**Date**: 2025-11-25  
**Estimated Effort**: 26-34 hours (~4-5 days)  
**LLM Cost Impact**: $0 (uses existing AI-generated data)

---

## 🎯 Features to Implement

### **Feature 2.1: Auto-Highlight AI Evidence in PDF** (16-20 hours)
When PDF opens, automatically highlight AI-extracted evidence excerpts in purple with hypothesis tooltips.

### **Feature 2.2: Smart Note Suggestions** (10-14 hours)
When user highlights text matching AI evidence, suggest linking to hypothesis with one-click conversion.

---

## 📊 Current System Understanding

### **Evidence Data Structure** (Already Exists)
```typescript
// From PaperTriage.evidence_excerpts (JSON array)
interface EvidenceExcerpt {
  quote: string;           // Exact quote from abstract
  relevance: string;       // Why this quote matters / support_type
  linked_to?: string;      // hypothesis_id (optional)
  page_section?: string;   // Methods/Results/Discussion (optional)
}
```

### **API Endpoints** (Already Exist)
1. **Get Triage Data**: `GET /api/triage/project/{projectId}/inbox`
   - Returns array of triages with `evidence_excerpts`
   - Filter by `article_pmid` to get specific paper's triage

2. **Get Hypotheses**: `GET /api/hypotheses/project/{projectId}`
   - Returns all hypotheses for project
   - Used to map `linked_to` IDs to hypothesis text

3. **Create Annotation**: `POST /api/proxy/projects/{projectId}/annotations`
   - Creates PDF annotation with highlight
   - Fields: `content`, `article_pmid`, `pdf_page`, `pdf_coordinates`, `highlight_color`, `highlight_text`, `linked_hypothesis_id`

4. **Link Hypothesis Evidence**: `POST /api/hypotheses/{hypothesisId}/evidence`
   - Links paper to hypothesis
   - Fields: `article_pmid`, `evidence_type`, `strength`, `key_finding`

### **PDF Viewer Components** (Already Exist)
- `PDFViewer.tsx` - Main PDF viewer using react-pdf
- `HighlightLayer.tsx` - Renders highlights on PDF
- `SelectionOverlay.tsx` - Handles text selection
- `AnnotationsSidebar.tsx` - Shows annotations list

---

## 🔧 Implementation Strategy

### **Phase 2.1: Auto-Highlight AI Evidence**

#### **Step 1: Create AI Evidence Fetcher Service**
**File**: `frontend/src/lib/api/evidence.ts` (NEW)

```typescript
export interface AIEvidence {
  quote: string;
  relevance: string;
  hypothesis_id?: string;
  hypothesis_text?: string;
  page_section?: string;
}

export async function fetchAIEvidenceForPaper(
  projectId: string,
  pmid: string,
  userId: string
): Promise<AIEvidence[]> {
  // 1. Fetch triage data for this paper
  const triages = await fetch(`/api/proxy/triage/project/${projectId}/inbox?article_pmid=${pmid}`, {
    headers: { 'User-ID': userId }
  });
  
  // 2. Extract evidence_excerpts
  const triage = triages[0];
  if (!triage?.evidence_excerpts) return [];
  
  // 3. Fetch hypotheses to map IDs to text
  const hypotheses = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
    headers: { 'User-ID': userId }
  });
  
  // 4. Enrich evidence with hypothesis text
  return triage.evidence_excerpts.map(e => ({
    ...e,
    hypothesis_text: hypotheses.find(h => h.hypothesis_id === e.linked_to)?.hypothesis_text
  }));
}
```

#### **Step 2: Create AI Evidence Highlight Layer Component**
**File**: `frontend/src/components/reading/AIEvidenceLayer.tsx` (NEW)

```typescript
interface AIEvidenceLayerProps {
  pmid: string;
  projectId: string;
  pdfDocument: any;  // PDF.js document
  pageNumber: number;
  scale: number;
  onEvidenceClick?: (evidence: AIEvidence) => void;
}

export default function AIEvidenceLayer({ pmid, projectId, pdfDocument, pageNumber, scale }: AIEvidenceLayerProps) {
  const [aiHighlights, setAiHighlights] = useState<AIHighlight[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    loadAIEvidence();
  }, [pmid, projectId, pdfDocument]);
  
  async function loadAIEvidence() {
    // 1. Fetch AI evidence
    const evidence = await fetchAIEvidenceForPaper(projectId, pmid, user.email);
    
    // 2. Search for each quote in PDF text
    const highlights = await Promise.all(
      evidence.map(async (e) => {
        const match = await findTextInPDF(pdfDocument, e.quote);
        return match ? { ...e, ...match } : null;
      })
    );
    
    setAiHighlights(highlights.filter(Boolean));
  }
  
  // Render purple highlights with tooltips
  return (
    <div className="absolute inset-0 pointer-events-none">
      {aiHighlights.map((h, i) => (
        <div
          key={i}
          className="absolute pointer-events-auto cursor-help"
          style={{
            left: h.x,
            top: h.y,
            width: h.width,
            height: h.height,
            backgroundColor: 'rgba(147, 51, 234, 0.3)',  // Purple
            border: '1px solid rgba(147, 51, 234, 0.6)'
          }}
          title={`AI Evidence: ${h.relevance}\n${h.hypothesis_text ? `Supports: ${h.hypothesis_text}` : ''}`}
        />
      ))}
    </div>
  );
}
```

#### **Step 3: PDF Text Search Utility**
**File**: `frontend/src/lib/pdf-text-search.ts` (NEW)

```typescript
export async function findTextInPDF(
  pdfDocument: any,
  searchText: string
): Promise<{ page: number; x: number; y: number; width: number; height: number } | null> {
  // Search all pages for the text
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Find text match and get coordinates
    const match = findTextInTextContent(textContent, searchText);
    if (match) {
      return { page: pageNum, ...match };
    }
  }
  
  return null;
}
```

#### **Step 4: Integrate into PDFViewer**
**File**: `frontend/src/components/reading/PDFViewer.tsx`

```typescript
// Add after HighlightLayer
{projectId && (
  <AIEvidenceLayer
    pmid={pmid}
    projectId={projectId}
    pdfDocument={pdfDocument}
    pageNumber={pageNumber}
    scale={scale}
    onEvidenceClick={(evidence) => {
      // Show evidence details in sidebar
      setSelectedEvidence(evidence);
    }}
  />
)}
```

---

### **Phase 2.2: Smart Note Suggestions**

#### **Step 1: Create Smart Suggestion Hook**
**File**: `frontend/src/hooks/useSmartNoteSuggestions.ts` (NEW)

```typescript
export function useSmartNoteSuggestions(
  projectId: string,
  pmid: string,
  aiEvidence: AIEvidence[]
) {
  const [suggestion, setSuggestion] = useState<NoteSuggestion | null>(null);
  
  function checkForMatch(selectedText: string) {
    // Find AI evidence that matches user's selection
    const match = aiEvidence.find(e => 
      e.quote.includes(selectedText) || 
      selectedText.includes(e.quote.substring(0, 50))
    );
    
    if (match && match.hypothesis_id) {
      setSuggestion({
        type: 'link_to_hypothesis',
        evidence: match,
        selectedText,
        action: 'Link this highlight to hypothesis?'
      });
    }
  }
  
  return { suggestion, checkForMatch, clearSuggestion: () => setSuggestion(null) };
}
```

#### **Step 2: Create Suggestion Toast Component**
**File**: `frontend/src/components/reading/SmartSuggestionToast.tsx` (NEW)

```typescript
export default function SmartSuggestionToast({ suggestion, onAccept, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 bg-purple-50 border-2 border-purple-500 rounded-lg p-4 shadow-xl z-50 max-w-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="flex-1">
          <h4 className="font-semibold text-purple-900">AI Suggestion</h4>
          <p className="text-sm text-gray-700 mt-1">
            This text matches AI-extracted evidence supporting:
          </p>
          <p className="text-sm font-medium text-purple-700 mt-1">
            "{suggestion.evidence.hypothesis_text}"
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-purple-700"
        >
          Link to Hypothesis
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

#### **Step 3: Integrate into PDFViewer**
**File**: `frontend/src/components/reading/PDFViewer.tsx`

```typescript
// Add smart suggestions
const { suggestion, checkForMatch, clearSuggestion } = useSmartNoteSuggestions(
  projectId,
  pmid,
  aiEvidence
);

// In handleDragToHighlight callback
const handleDragToHighlight = async (selection) => {
  // Check for AI evidence match
  checkForMatch(selection.text);
  
  // Continue with normal highlight creation
  // ...
};

// Render suggestion toast
{suggestion && (
  <SmartSuggestionToast
    suggestion={suggestion}
    onAccept={async () => {
      // Create annotation with hypothesis link
      await createAnnotation({
        ...highlightData,
        linked_hypothesis_id: suggestion.evidence.hypothesis_id,
        evidence_quote: suggestion.selectedText
      });
      
      // Link evidence to hypothesis
      await linkHypothesisEvidence(
        suggestion.evidence.hypothesis_id,
        {
          article_pmid: pmid,
          evidence_type: 'supports',
          strength: 'moderate',
          key_finding: suggestion.selectedText
        },
        user.email
      );
      
      clearSuggestion();
    }}
    onDismiss={clearSuggestion}
  />
)}
```

---

## ✅ Acceptance Criteria

### **Feature 2.1: Auto-Highlight AI Evidence**
- [ ] When PDF opens, AI evidence is automatically highlighted in purple
- [ ] Hovering over purple highlight shows tooltip with evidence relevance
- [ ] Tooltip shows linked hypothesis text (if available)
- [ ] Purple highlights are visually distinct from user highlights (yellow/green)
- [ ] Clicking purple highlight shows evidence details in sidebar
- [ ] Works across all pages of PDF
- [ ] No performance issues with large PDFs

### **Feature 2.2: Smart Note Suggestions**
- [ ] When user highlights text matching AI evidence, suggestion toast appears
- [ ] Toast shows which hypothesis the evidence supports
- [ ] Clicking "Link to Hypothesis" creates annotation with hypothesis link
- [ ] Clicking "Link to Hypothesis" also creates evidence link in database
- [ ] Toast can be dismissed without action
- [ ] Suggestion only appears for text matching AI evidence
- [ ] Works with partial matches (user selects part of AI evidence quote)

---

## 🧪 Testing Plan

### **Manual Testing**
1. Open PDF for paper with AI triage data
2. Verify purple highlights appear automatically
3. Hover over purple highlights to see tooltips
4. Create new highlight overlapping AI evidence
5. Verify suggestion toast appears
6. Accept suggestion and verify annotation is linked to hypothesis
7. Check database to confirm evidence link was created
8. Test with paper without triage data (should show no purple highlights)

### **Edge Cases**
- Paper not triaged yet (no evidence_excerpts)
- Evidence quote not found in PDF text
- User highlights non-AI-evidence text (no suggestion)
- Multiple AI evidence quotes on same page
- AI evidence spans multiple lines/pages

---

## 📝 Next Steps

1. Create new files for Phase 2.1
2. Implement AI evidence fetching
3. Implement PDF text search
4. Create AI Evidence Layer component
5. Integrate into PDFViewer
6. Test Phase 2.1 thoroughly
7. Create new files for Phase 2.2
8. Implement smart suggestions
9. Create suggestion toast
10. Integrate into PDFViewer
11. Test Phase 2.2 thoroughly
12. Build and deploy
