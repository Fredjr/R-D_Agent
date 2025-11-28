# Phase 3: Read-Only Mode Implementation Plan

**Date**: 2025-11-28  
**Status**: 🚀 READY TO START  
**Estimated Duration**: 1 week  
**Risk Level**: Low (No data changes, only UI updates)

---

## 🎯 **Phase 3 Overview**

**Goal**: Implement Read-Only Mode to allow users to view and test the new many-to-many collections structure without modifying data.

**Context**: We're in Week 4 of the 8-Week Master Implementation Plan for migrating from one-to-many (Project → Collections) to many-to-many (Projects ↔ Collections) relationships.

**Progress So Far**:
- ✅ **Phase 0** (Week 1): Created new tables (project_collections, etc.)
- ✅ **Phase 1** (Week 2): Implemented Dual-Write Pattern
- ✅ **Phase 2** (Week 3): Implemented Dashboard UI with 4 widgets
- 🚀 **Phase 3** (Week 4): **Implement Read-Only Mode** ← WE ARE HERE

---

## 📋 **What is Read-Only Mode?**

Read-Only Mode allows users to:
1. ✅ **View** collections in the new many-to-many structure
2. ✅ **Browse** collections across multiple projects
3. ✅ **Test** the new UI without risk
4. ❌ **Cannot** create, update, or delete collections (disabled)

**Why Read-Only Mode?**
- Allows users to explore the new structure safely
- Provides time to gather feedback before full migration
- Reduces risk of data inconsistencies
- Allows gradual rollout

---

## 🎯 **Phase 3 Goals**

### **Goal 1: Add Read-Only Mode Toggle**
- Add admin endpoint to enable/disable read-only mode
- Store mode in environment variable or database
- Add UI indicator showing current mode

### **Goal 2: Disable Write Operations in Read-Only Mode**
- Disable "Create Collection" buttons
- Disable "Update Collection" buttons
- Disable "Delete Collection" buttons
- Disable "Add to Collection" buttons
- Show informative tooltips explaining why

### **Goal 3: Update UI to Show Read-Only State**
- Add banner at top of collections page
- Add badges to disabled buttons
- Add tooltips with explanations
- Update Dashboard widgets to show read-only state

### **Goal 4: Test Read-Only Mode**
- Verify all write operations are blocked
- Verify read operations still work
- Verify UI updates correctly
- Test with real users

---

## 🛠️ **Implementation Steps**

### **Step 1: Backend - Add Read-Only Mode Configuration** (1 hour)

**File**: `main.py`

**Changes**:
1. Add environment variable: `READ_ONLY_MODE=false`
2. Add helper function to check mode:
```python
def is_read_only_mode() -> bool:
    return os.getenv("READ_ONLY_MODE", "false").lower() == "true"
```

3. Add admin endpoint to toggle mode:
```python
@app.post("/admin/toggle-read-only-mode")
async def toggle_read_only_mode(enabled: bool):
    # Update environment variable or database
    return {"read_only_mode": enabled}
```

4. Add endpoint to check current mode:
```python
@app.get("/admin/read-only-mode")
async def get_read_only_mode():
    return {"read_only_mode": is_read_only_mode()}
```

---

### **Step 2: Backend - Block Write Operations** (2 hours)

**Files**: `main.py` (collection endpoints)

**Changes**:
1. Update POST `/projects/{project_id}/collections` endpoint:
```python
@app.post("/projects/{project_id}/collections")
async def create_collection(...):
    if is_read_only_mode():
        raise HTTPException(
            status_code=403,
            detail="Collections are in read-only mode. Write operations are disabled."
        )
    # ... existing code
```

2. Update PUT `/projects/{project_id}/collections/{collection_id}` endpoint
3. Update DELETE `/projects/{project_id}/collections/{collection_id}` endpoint
4. Update POST `/collections/{collection_id}/articles` endpoint (add to collection)

---

### **Step 3: Frontend - Add Read-Only Mode Context** (1 hour)

**File**: `frontend/src/contexts/ReadOnlyModeContext.tsx` (new)

**Code**:
```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ReadOnlyModeContextType {
  isReadOnly: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ReadOnlyModeContext = createContext<ReadOnlyModeContextType>({
  isReadOnly: false,
  loading: true,
  refresh: async () => {},
});

export function ReadOnlyModeProvider({ children }: { children: React.ReactNode }) {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMode = async () => {
    try {
      const response = await fetch('/api/proxy/admin/read-only-mode');
      const data = await response.json();
      setIsReadOnly(data.read_only_mode);
    } catch (error) {
      console.error('Error fetching read-only mode:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMode();
  }, []);

  return (
    <ReadOnlyModeContext.Provider value={{ isReadOnly, loading, refresh: fetchMode }}>
      {children}
    </ReadOnlyModeContext.Provider>
  );
}

export const useReadOnlyMode = () => useContext(ReadOnlyModeContext);
```

---

### **Step 4: Frontend - Add Read-Only Banner** (1 hour)

**File**: `frontend/src/components/ui/ReadOnlyBanner.tsx` (new)

**Code**:
```typescript
'use client';

import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useReadOnlyMode } from '@/contexts/ReadOnlyModeContext';

export default function ReadOnlyBanner() {
  const { isReadOnly } = useReadOnlyMode();

  if (!isReadOnly) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <InformationCircleIcon className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            📖 Read-Only Mode Active
          </h3>
          <p className="text-sm text-blue-800">
            Collections are currently in read-only mode. You can view and browse collections, 
            but creating, updating, or deleting collections is temporarily disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### **Step 5: Frontend - Disable Write Buttons** (2 hours)

**Files to Update**:
1. `frontend/src/app/collections/page.tsx`
2. `frontend/src/components/project/ProjectDashboardTab.tsx`
3. `frontend/src/components/project/ProjectCollectionsWidget.tsx`

**Changes**:
```typescript
import { useReadOnlyMode } from '@/contexts/ReadOnlyModeContext';

// In component:
const { isReadOnly } = useReadOnlyMode();

// Update buttons:
<button
  onClick={() => setShowCreateModal(true)}
  disabled={isReadOnly}
  className={`... ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
  title={isReadOnly ? 'Collections are in read-only mode' : 'Create new collection'}
>
  <PlusIcon className="w-5 h-5 mr-2" />
  New Collection
  {isReadOnly && <span className="ml-2 text-xs">(Read-Only)</span>}
</button>
```

---

## 📊 **Success Criteria**

### **Backend**:
- ✅ Read-only mode can be toggled via admin endpoint
- ✅ All write operations return 403 error in read-only mode
- ✅ Read operations continue to work normally
- ✅ Mode persists across server restarts

### **Frontend**:
- ✅ Read-only banner appears when mode is active
- ✅ All write buttons are disabled with tooltips
- ✅ UI clearly indicates read-only state
- ✅ No console errors or warnings

### **User Experience**:
- ✅ Users can browse collections normally
- ✅ Users understand why buttons are disabled
- ✅ No confusion or frustration
- ✅ Smooth transition when mode is disabled

---

## 🧪 **Testing Plan**

### **Test 1: Enable Read-Only Mode**
```bash
curl -X POST "https://r-dagent-production.up.railway.app/admin/toggle-read-only-mode" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### **Test 2: Verify Write Operations Blocked**
```bash
# Should return 403
curl -X POST "https://r-dagent-production.up.railway.app/projects/{id}/collections" \
  -H "User-ID: test@example.com" \
  -d '{"collection_name": "Test"}'
```

### **Test 3: Verify Read Operations Work**
```bash
# Should return 200
curl "https://r-dagent-production.up.railway.app/projects/{id}/collections" \
  -H "User-ID: test@example.com"
```

### **Test 4: Verify UI Updates**
1. Open collections page
2. Verify banner appears
3. Verify buttons are disabled
4. Verify tooltips show correct message

---

## 📝 **Files to Create/Modify**

### **New Files** (2):
1. `frontend/src/contexts/ReadOnlyModeContext.tsx` (~80 lines)
2. `frontend/src/components/ui/ReadOnlyBanner.tsx` (~40 lines)

### **Modified Files** (4):
1. `main.py` (+50 lines) - Add read-only mode logic
2. `frontend/src/app/collections/page.tsx` (+20 lines) - Add banner and disable buttons
3. `frontend/src/components/project/ProjectDashboardTab.tsx` (+10 lines) - Disable buttons
4. `frontend/src/components/project/ProjectCollectionsWidget.tsx` (+10 lines) - Disable buttons

**Total**: ~210 lines of new/modified code

---

## 🚀 **Next Steps After Phase 3**

Once Phase 3 is complete:
1. **Phase 4** (Week 5): Gradual Migration - Migrate 10% of users
2. **Phase 5** (Week 6): Full Migration - Migrate remaining users
3. **Phase 6** (Week 7): Deprecate Old Tables
4. **Phase 7** (Week 8): Cleanup and Optimization

---

**Ready to start Phase 3 implementation!** 🎉

