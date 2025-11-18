# 🚨 Critical Fixes Plan - Weeks 3, 4, 5

**Date**: 2025-11-18  
**Priority**: P0 - Must Fix Immediately  
**Estimated Time**: 2-3 hours

---

## 📋 **Fix Checklist**

### **P0 - Critical (Fix Now)**
- [ ] **Fix #1**: Evidence type mismatch (add 'context' and 'methodology')
- [ ] **Fix #2**: Field name inconsistency (key_finding vs key_findings)
- [ ] **Fix #3**: Add error logging to all API calls
- [ ] **Fix #4**: Debug question creation failure (INVESTIGATING)

---

## 🔧 **Fix #1: Evidence Type Mismatch**

### **Problem**
Backend accepts 5 evidence types, frontend only 3.

### **Files to Change**
1. `frontend/src/lib/types/questions.ts`
2. `frontend/src/components/project/questions/LinkEvidenceModal.tsx`
3. `frontend/src/components/project/questions/EvidenceCard.tsx`

### **Step 1: Update Type Definition**

**File**: `frontend/src/lib/types/questions.ts` (Line 106)

**Before**:
```typescript
export type EvidenceType = 'supports' | 'contradicts' | 'neutral';
```

**After**:
```typescript
export type EvidenceType = 'supports' | 'contradicts' | 'neutral' | 'context' | 'methodology';
```

---

### **Step 2: Update LinkEvidenceModal**

**File**: `frontend/src/components/project/questions/LinkEvidenceModal.tsx` (Line 233-260)

**Add two new buttons after the "neutral" button**:

```typescript
<button
  onClick={() => setEvidenceType('context')}
  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
    evidenceType === 'context'
      ? 'bg-purple-500/20 border-purple-500 text-purple-500'
      : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
  }`}
>
  <DocumentTextIcon className="w-5 h-5" />
  <span className="text-sm font-medium">Context</span>
</button>

<button
  onClick={() => setEvidenceType('methodology')}
  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
    evidenceType === 'methodology'
      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500'
      : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
  }`}
>
  <BeakerIcon className="w-5 h-5" />
  <span className="text-sm font-medium">Methodology</span>
</button>
```

**Import needed icons**:
```typescript
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  DocumentTextIcon,  // ADD THIS
  BeakerIcon         // ADD THIS
} from '@heroicons/react/24/outline';
```

---

### **Step 3: Update EvidenceCard**

**File**: `frontend/src/components/project/questions/EvidenceCard.tsx` (Line 34-76)

**Add two new cases to `getEvidenceTypeConfig`**:

```typescript
case 'context':
  return {
    icon: <DocumentTextIcon className="w-4 h-4" />,
    label: 'Context',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  };
case 'methodology':
  return {
    icon: <BeakerIcon className="w-4 h-4" />,
    label: 'Methodology',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20'
  };
```

**Import needed icons**:
```typescript
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  BeakerIcon  // ADD THIS
} from '@heroicons/react/24/outline';
```

---

## 🔧 **Fix #2: Field Name Inconsistency**

### **Problem**
Backend uses `key_finding` (singular), frontend uses `key_findings` (plural).

### **Decision**: Change frontend to match backend (less risky)

### **Files to Change**
1. `frontend/src/lib/types/questions.ts`
2. `frontend/src/lib/api/questions.ts`
3. `frontend/src/components/project/questions/LinkEvidenceModal.tsx`
4. `frontend/src/components/project/questions/EvidenceCard.tsx`

### **Step 1: Update Type Definitions**

**File**: `frontend/src/lib/types/questions.ts`

**Line 114** - Change:
```typescript
key_findings?: string;  // OLD
```
To:
```typescript
key_finding?: string;  // NEW
```

**Line 129** - Change:
```typescript
key_findings?: string;  // OLD
```
To:
```typescript
key_finding?: string;  // NEW
```

**Line 153** - Change:
```typescript
key_finding?: string;  // Already correct! ✅
```

---

### **Step 2: Update LinkEvidenceModal**

**File**: `frontend/src/components/project/questions/LinkEvidenceModal.tsx`

**Search for**: `key_findings` (should be 2-3 occurrences)  
**Replace with**: `key_finding`

**Example** (Line 45):
```typescript
const [keyFindings, setKeyFindings] = useState('');  // Variable name is OK
```

**But when creating the request object** (Line ~150):
```typescript
{
  article_pmid: pmid,
  evidence_type: evidenceType,
  relevance_score: relevanceScore,
  key_finding: keyFindings  // Change from key_findings to key_finding
}
```

---

### **Step 3: Update EvidenceCard**

**File**: `frontend/src/components/project/questions/EvidenceCard.tsx`

**Search for**: `evidence.key_findings`  
**Replace with**: `evidence.key_finding`

---

## 🔧 **Fix #3: Add Error Logging**

### **Problem**
API calls fail silently, making debugging impossible.

### **Files to Change**
1. `frontend/src/lib/api/questions.ts` (all functions)

### **Pattern to Apply**

**Before**:
```typescript
export async function createQuestion(
  data: QuestionCreateInput,
  userId: string
): Promise<ResearchQuestion> {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create question');
  }

  return response.json();
}
```

**After**:
```typescript
export async function createQuestion(
  data: QuestionCreateInput,
  userId: string
): Promise<ResearchQuestion> {
  console.log('[API] Creating question:', { data, userId });
  
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error creating question:', {
      status: response.status,
      error,
      data
    });
    throw new Error(error.detail || 'Failed to create question');
  }

  const result = await response.json();
  console.log('[API] Question created successfully:', result.question_id);
  return result;
}
```

**Apply this pattern to**:
- `createQuestion()`
- `updateQuestion()`
- `deleteQuestion()`
- `createHypothesis()`
- `updateHypothesis()`
- `deleteHypothesis()`
- `linkQuestionEvidence()`
- `linkHypothesisEvidence()`

---

## ✅ **Testing After Fixes**

### **Test 1: Evidence Types**
1. Create a question
2. Click "Link Evidence"
3. Verify 5 buttons appear: Supports, Contradicts, Neutral, Context, Methodology
4. Select "Context" and link a paper
5. Verify evidence card shows purple "Context" badge

### **Test 2: Key Findings**
1. Link evidence with key findings text
2. Verify text appears in evidence card
3. Check browser console - no errors about undefined fields

### **Test 3: Error Logging**
1. Open browser console
2. Create a question
3. Verify console shows:
   - `[API] Creating question: {...}`
   - `[API] Response status: 201 Created`
   - `[API] Question created successfully: abc-123-...`

---

## 📊 **Expected Results**

### **Before Fixes**
- ❌ Only 3 evidence types available
- ❌ Key findings data lost
- ❌ Silent failures, no debugging info
- ❌ 25.4% test pass rate

### **After Fixes**
- ✅ All 5 evidence types available
- ✅ Key findings preserved
- ✅ Detailed console logging
- ✅ Expected: 40-50% test pass rate (once question creation works)

---

## 🚀 **Deployment Steps**

1. Make all code changes
2. Run `npm run build` to verify no TypeScript errors
3. Test locally with `npm run dev`
4. Commit changes: `git commit -m "🔧 Fix evidence types and field naming"`
5. Push to GitHub: `git push origin main`
6. Vercel will auto-deploy
7. Re-run comprehensive test suite
8. Share new test results

---

**Estimated Time**: 1-2 hours  
**Risk Level**: Low (mostly additive changes)  
**Rollback Plan**: Revert commit if issues arise

