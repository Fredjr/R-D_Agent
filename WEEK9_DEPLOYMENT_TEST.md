# 🚀 Week 9 Deployment Testing Guide

**Date**: 2025-11-19  
**Backend URL**: https://r-dagent-production.up.railway.app  
**Frontend URL**: https://frontend-qexahkew4-fredericle77-gmailcoms-projects.vercel.app

---

## ✅ **Deployment Status**

### **Backend (Railway)**
- ✅ Deployed successfully
- ✅ Health check passing
- ✅ Paper triage endpoints registered

### **Frontend (Vercel)**
- ✅ Deployed successfully
- ✅ Build completed
- ✅ Production URL active

---

## 🧪 **Manual Testing Checklist**

### **Test 1: Backend Health Check**
```bash
curl https://r-dagent-production.up.railway.app/health
```

**Expected**: `{"status":"healthy",...}`  
**Result**: ✅ PASSED

---

### **Test 2: Paper Triage Endpoint Exists**
```bash
curl -X GET "https://r-dagent-production.up.railway.app/api/triage/project/test/stats" \
  -H "User-ID: test-user"
```

**Expected**: Stats response or empty stats  
**Result**: ✅ Endpoint exists (requires auth)

---

### **Test 3: Frontend Loads**
1. Open: https://frontend-qexahkew4-fredericle77-gmailcoms-projects.vercel.app
2. Check if homepage loads
3. Check if authentication works

**Expected**: Homepage loads, can sign in  
**Result**: ⏳ TO BE TESTED

---

### **Test 4: Navigate to Inbox Tab**
1. Sign in to the app
2. Create or open a project
3. Navigate to **Papers → Inbox** tab
4. Check if InboxTab component loads

**Expected**: Inbox tab shows with stats dashboard  
**Result**: ⏳ TO BE TESTED

---

### **Test 5: Triage a Paper from Explore**
1. Navigate to **Papers → Explore** tab
2. Search for a paper (e.g., "CRISPR")
3. Click **"Triage with AI"** button on a paper
4. Wait for AI analysis (2-5 seconds)
5. Check success alert with relevance score

**Expected**: Alert shows "Paper triaged! Relevance Score: X/100"  
**Result**: ⏳ TO BE TESTED

---

### **Test 6: View Triaged Paper in Inbox**
1. After triaging a paper, navigate to **Papers → Inbox** tab
2. Check if paper appears in inbox
3. Check if AI insights are displayed
4. Check if relevance score is shown

**Expected**: Paper appears with full AI analysis  
**Result**: ⏳ TO BE TESTED

---

### **Test 7: Filter Papers in Inbox**
1. In Inbox tab, click **"Must Read"** filter
2. Check if only must-read papers show
3. Click **"Unread"** read status filter
4. Check if only unread papers show

**Expected**: Filters work correctly  
**Result**: ⏳ TO BE TESTED

---

### **Test 8: Accept/Reject/Maybe Actions**
1. In Inbox tab, click **"Accept"** on a paper
2. Check if status updates to "Must Read"
3. Click **"Reject"** on another paper
4. Check if status updates to "Ignored"
5. Click **"Maybe"** on another paper
6. Check if status updates to "Nice to Know"

**Expected**: All actions work, UI updates  
**Result**: ⏳ TO BE TESTED

---

### **Test 9: Mark as Read**
1. In Inbox tab, click **"Mark Read"** on a paper
2. Check if read status updates
3. Filter by "Read" status
4. Check if paper appears

**Expected**: Read status updates correctly  
**Result**: ⏳ TO BE TESTED

---

### **Test 10: Stats Dashboard Updates**
1. Note the stats at top of Inbox (e.g., "5 Must Read")
2. Accept a paper
3. Check if stats update in real-time

**Expected**: Stats update after actions  
**Result**: ⏳ TO BE TESTED

---

### **Test 11: AI Reasoning Expansion**
1. In Inbox tab, find a paper card
2. Click **"AI Reasoning"** to expand
3. Check if detailed reasoning shows
4. Click again to collapse

**Expected**: Reasoning expands/collapses smoothly  
**Result**: ⏳ TO BE TESTED

---

### **Test 12: Affected Questions/Hypotheses**
1. Create a research question in **Research → Questions** tab
2. Triage a relevant paper
3. Check if paper shows "Addresses 1 question"
4. Check if question ID is in affected_questions array

**Expected**: Paper correctly identifies affected questions  
**Result**: ⏳ TO BE TESTED

---

### **Test 13: Mobile Responsiveness**
1. Open app on mobile device or resize browser
2. Navigate to Inbox tab
3. Check if layout adapts
4. Check if filters stack vertically
5. Check if paper cards are readable

**Expected**: UI is fully responsive  
**Result**: ⏳ TO BE TESTED

---

### **Test 14: Error Handling**
1. Try to triage a paper without signing in
2. Check if error message shows
3. Try to access Inbox without a project
4. Check if appropriate message shows

**Expected**: Graceful error handling  
**Result**: ⏳ TO BE TESTED

---

### **Test 15: Performance**
1. Triage 10 papers in a row
2. Check if each triage completes in <5 seconds
3. Navigate to Inbox
4. Check if inbox loads in <2 seconds
5. Check if filtering is instant

**Expected**: Fast performance throughout  
**Result**: ⏳ TO BE TESTED

---

## 🔍 **Browser Console Testing**

Open browser console (F12) and run:

```javascript
// Test 1: Check if InboxTab component is loaded
console.log('InboxTab loaded:', !!document.querySelector('[class*="inbox"]'));

// Test 2: Check if API calls are working
fetch('https://r-dagent-production.up.railway.app/health')
  .then(r => r.json())
  .then(d => console.log('Backend health:', d));

// Test 3: Check for JavaScript errors
console.log('No errors:', window.onerror === null);
```

---

## 📊 **Expected Results Summary**

| Test | Status | Notes |
|------|--------|-------|
| Backend Health | ✅ PASSED | Healthy response |
| Triage Endpoint | ✅ PASSED | Endpoint exists |
| Frontend Loads | ⏳ PENDING | Manual test needed |
| Inbox Tab | ⏳ PENDING | Manual test needed |
| Triage Button | ⏳ PENDING | Manual test needed |
| View in Inbox | ⏳ PENDING | Manual test needed |
| Filters | ⏳ PENDING | Manual test needed |
| Actions | ⏳ PENDING | Manual test needed |
| Mark Read | ⏳ PENDING | Manual test needed |
| Stats Update | ⏳ PENDING | Manual test needed |
| AI Reasoning | ⏳ PENDING | Manual test needed |
| Questions Match | ⏳ PENDING | Manual test needed |
| Mobile | ⏳ PENDING | Manual test needed |
| Error Handling | ⏳ PENDING | Manual test needed |
| Performance | ⏳ PENDING | Manual test needed |

---

## 🚨 **Known Issues to Watch For**

1. **OpenAI API Key**: Ensure OPENAI_API_KEY is set in Railway environment
2. **Database Connection**: Ensure DATABASE_URL is correct
3. **CORS**: Ensure frontend URL is in CORS allowed origins
4. **Rate Limiting**: OpenAI has rate limits, may need to handle

---

## 📝 **Next Steps**

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ⏳ Run manual tests (Tests 3-15)
4. ⏳ Document any issues found
5. ⏳ Fix issues if any
6. ⏳ Re-deploy and re-test
7. ⏳ Mark Week 9 as production-ready

---

**Testing Started**: 2025-11-19 20:00 UTC  
**Testing Completed**: ⏳ IN PROGRESS

