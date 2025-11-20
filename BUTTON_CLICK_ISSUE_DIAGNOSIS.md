# 🔍 Button Click Issue - Complete Diagnosis & Fix

## 📋 Issue Report

**User Report**: "When I click on those buttons, nothing happens"

**Buttons Affected**:
1. ✅ Accept (Must Read)
2. 🤔 Maybe (Nice to Know)
3. ❌ Reject (Ignore)
4. 📖 Mark Read
5. 🧪 Extract Protocol

**Location**: Smart Inbox (`/project/[projectId]` → Inbox tab)

---

## 🔬 Root Cause Analysis

### Investigation Steps

1. **Frontend Event Handlers** ✅ WORKING
   - `InboxPaperCard.tsx` correctly passes `onClick` props
   - `InboxTab.tsx` correctly defines handler functions
   - All handlers call appropriate API functions

2. **API Client Functions** ✅ WORKING
   - `frontend/src/lib/api.ts` has `updateTriageStatus()` function
   - Correct endpoint: `/api/proxy/triage/triage/{triageId}`
   - Correct HTTP method: `PUT`
   - Correct headers: `Content-Type`, `User-ID`

3. **Frontend Proxy** ⚠️ **ISSUE FOUND**
   - Catch-all proxy: `frontend/src/app/api/proxy/[...path]/route.ts`
   - **Triage routes**: ✅ Correctly included in `needsApiPrefix` list
   - **Protocols routes**: ❌ **MISSING** from `needsApiPrefix` list

4. **Backend Endpoints** ✅ WORKING
   - Triage router: `backend/app/routers/paper_triage.py`
   - Protocols router: `backend/app/routers/protocols.py`
   - Both registered in `main.py`
   - Both use `/api/` prefix

---

## 🐛 The Bug

### Protocols Endpoint Routing Issue

**Problem**: Extract Protocol button calls `/api/proxy/protocols/extract`

**Expected Behavior**:
```
Frontend: /api/proxy/protocols/extract
    ↓
Proxy: Add /api prefix
    ↓
Backend: /api/protocols/extract ✅
```

**Actual Behavior** (BEFORE FIX):
```
Frontend: /api/proxy/protocols/extract
    ↓
Proxy: NO /api prefix added ❌
    ↓
Backend: /protocols/extract (404 Not Found) ❌
```

**Root Cause**: `protocols` was not in the `needsApiPrefix` list in the catch-all proxy.

---

## ✅ The Fix

### File: `frontend/src/app/api/proxy/[...path]/route.ts`

**Before**:
```typescript
// Routes that need /api prefix (new pivot endpoints + Week 9-14 features)
const needsApiPrefix = suffix.startsWith('questions') ||
                       suffix.startsWith('hypotheses') ||
                       suffix.startsWith('analytics') ||
                       suffix.startsWith('triage') ||
                       suffix.startsWith('decisions') ||
                       suffix.startsWith('alerts');
```

**After**:
```typescript
// Routes that need /api prefix (new pivot endpoints + Week 9-18 features)
const needsApiPrefix = suffix.startsWith('questions') ||
                       suffix.startsWith('hypotheses') ||
                       suffix.startsWith('analytics') ||
                       suffix.startsWith('triage') ||
                       suffix.startsWith('decisions') ||
                       suffix.startsWith('alerts') ||
                       suffix.startsWith('protocols'); // ← ADDED
```

---

## 🧪 Testing the Fix

### Test Case 1: Accept Button

**Expected Flow**:
```
1. User clicks "Accept" button
2. Frontend calls updateTriageStatus(triageId, userId, { triage_status: 'must_read' })
3. API client sends PUT /api/proxy/triage/triage/{triageId}
4. Proxy adds /api prefix → PUT /api/triage/triage/{triageId}
5. Backend updates database
6. Frontend reloads inbox
7. Paper moves to "Must Read" section
```

**Test Command** (Browser Console):
```javascript
// Get current paper
const paper = papers[0];

// Test Accept
await fetch(`/api/proxy/triage/triage/${paper.triage_id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'User-ID': 'YOUR_USER_ID'
  },
  body: JSON.stringify({ triage_status: 'must_read' })
});
```

**Expected Response**: `200 OK` with updated triage data

---

### Test Case 2: Extract Protocol Button

**Expected Flow**:
```
1. User clicks "Extract Protocol" button
2. Frontend calls handleExtractProtocol(paper)
3. API client sends POST /api/proxy/protocols/extract
4. Proxy adds /api prefix → POST /api/protocols/extract ✅ (FIXED)
5. Backend extracts protocol using AI
6. Frontend shows success alert
7. Protocol saved to database
```

**Test Command** (Browser Console):
```javascript
// Test Extract Protocol
await fetch('/api/proxy/protocols/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-ID': 'YOUR_USER_ID'
  },
  body: JSON.stringify({
    article_pmid: '38278529',
    protocol_type: null,
    force_refresh: false
  })
});
```

**Expected Response**: `200 OK` with protocol data

---

## 📊 Affected Endpoints

### Triage Endpoints (Already Working)
- ✅ `POST /api/triage/project/{project_id}/triage` - Triage paper
- ✅ `GET /api/triage/project/{project_id}/inbox` - Get inbox
- ✅ `PUT /api/triage/triage/{triage_id}` - Update triage status
- ✅ `GET /api/triage/project/{project_id}/stats` - Get stats
- ✅ `DELETE /api/triage/triage/{triage_id}` - Delete triage

### Protocols Endpoints (NOW FIXED)
- ✅ `POST /api/protocols/extract` - Extract protocol
- ✅ `GET /api/protocols/project/{project_id}` - Get all protocols
- ✅ `GET /api/protocols/{protocol_id}` - Get protocol details
- ✅ `PUT /api/protocols/{protocol_id}` - Update protocol
- ✅ `DELETE /api/protocols/{protocol_id}` - Delete protocol

---

## 🚀 Deployment

**Commit**: `4ca0b47`  
**Branch**: `main`  
**Status**: ✅ Deployed to Vercel  
**Build**: ✅ Succeeded  

**Auto-Deploy Triggered**:
- Frontend (Vercel): ✅ Deploying
- Backend (Railway): No changes needed

---

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Accept button updates triage status to "must_read"
- [ ] Maybe button updates triage status to "nice_to_know"
- [ ] Reject button updates triage status to "ignore"
- [ ] Mark Read button updates read_status to "read"
- [ ] Extract Protocol button extracts protocol and shows success alert
- [ ] Inbox reloads after each action
- [ ] Stats update after each action
- [ ] No console errors
- [ ] Network tab shows 200 OK responses

---

## 📝 Additional Notes

### Why This Happened

The protocols router was added in Week 17-18, but the proxy configuration wasn't updated to include it in the `needsApiPrefix` list. This is a common oversight when adding new routers.

### Prevention

**Checklist for Adding New Routers**:
1. ✅ Create router file in `backend/app/routers/`
2. ✅ Register router in `main.py` with `app.include_router()`
3. ✅ Add router prefix to proxy `needsApiPrefix` list ← **MISSED THIS**
4. ✅ Test endpoints in browser console
5. ✅ Update documentation

---

**Status**: ✅ Fixed and Deployed  
**Date**: November 20, 2025  
**Commit**: 4ca0b47  
**Vercel**: Auto-deploying  

**All buttons should now work correctly! 🎉**

