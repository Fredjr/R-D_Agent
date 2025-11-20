# 🧪 Testing Guide: Week 16-18 (AI Optimization & Protocol Extraction)

**Date**: November 20, 2025  
**Features**: AI Cost Optimization (Week 16) + Protocol Extraction (Week 17-18)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Automated Browser Test](#automated-browser-test)
3. [Manual Testing Steps](#manual-testing-steps)
4. [Backend API Testing](#backend-api-testing)
5. [Performance Testing](#performance-testing)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Deployed backend (Railway): https://r-dagent-production.up.railway.app
- ✅ Deployed frontend (Vercel): https://r-d-agent.vercel.app
- ✅ User account with at least one project
- ✅ Papers in Smart Inbox (for protocol extraction testing)

### What You'll Test
1. **Week 16**: AI Cost Optimization
   - 7-day caching for triage results
   - Question/hypothesis prioritization (top 10)
   - Abstract truncation (300 words)
   - Performance improvements

2. **Week 17-18**: Protocol Extraction
   - AI-powered protocol extraction from papers
   - 30-day caching for protocols
   - Protocol viewing, editing, exporting
   - Full CRUD operations

---

## 🤖 Automated Browser Test

### Option 1: Run Browser Console Test (Recommended)

**Steps**:
1. Open https://r-d-agent.vercel.app in your browser
2. Log in with your credentials
3. Navigate to any project page
4. Open browser console:
   - **Mac**: `Cmd + Option + J`
   - **Windows/Linux**: `Ctrl + Shift + J` or `F12`
5. Copy the entire script from `tests/browser-console-test-week16-18.js`
6. Paste into console and press Enter
7. Watch the automated tests run!

**What It Tests**:
- ✅ AI triage endpoint with caching
- ✅ Enhanced triage fields (confidence scores, evidence)
- ✅ Triage response time (cache performance)
- ✅ Protocol extraction endpoint
- ✅ Protocol data structure
- ✅ Frontend UI components (buttons, modals)
- ✅ Protocol extraction workflow
- ✅ Protocol features (copy, download, edit, delete)
- ✅ Caching performance (speedup measurement)

**Expected Results**:
- Total Tests: ~20
- Success Rate: >80% (some tests may fail if no data exists yet)
- Response Times:
  - Triage (cache hit): <500ms
  - Triage (cache miss): <2000ms
  - Protocol extraction (cache hit): <100ms
  - Protocol extraction (cache miss): 2-5 seconds

---

## 🖱️ Manual Testing Steps

### Test 1: AI Triage Optimization (Week 16)

**1.1 Test Triage Caching**:
1. Navigate to a project
2. Go to Papers → Inbox
3. Note the load time (should be fast if cached)
4. Refresh the page
5. Load time should be similar (cache hit)
6. **Expected**: <500ms load time for cached results

**1.2 Test Enhanced Triage Fields**:
1. In Smart Inbox, look at a paper card
2. Check for:
   - ✅ Confidence score (e.g., "85% match")
   - ✅ Evidence excerpts (highlighted text)
   - ✅ Question relevance scores
   - ✅ Reasoning explanation
3. **Expected**: All enhanced fields visible

**1.3 Test Question Prioritization**:
1. Create a project with >10 research questions
2. Triage a paper
3. Check backend logs or response
4. **Expected**: Only top 10 questions used in triage (reduces tokens)

---

### Test 2: Protocol Extraction (Week 17-18)

**2.1 Extract Protocol from Paper**:
1. Navigate to a project
2. Go to Papers → Inbox
3. Find a paper with experimental methods
4. Click "Extract Protocol" button (beaker icon)
5. Wait 2-5 seconds for AI extraction
6. **Expected**: Success notification "Protocol extracted successfully!"

**2.2 View Protocols Tab**:
1. Navigate to Protocols tab (if available in navigation)
2. **Expected**: Grid view of all extracted protocols
3. Check for:
   - ✅ Protocol cards with name, type, stats
   - ✅ Filter by protocol type
   - ✅ View details button

**2.3 View Protocol Details**:
1. Click "View Details" on a protocol card
2. **Expected**: Modal opens with:
   - ✅ Protocol name and type
   - ✅ Materials list (with catalog numbers, suppliers)
   - ✅ Steps list (with durations, temperatures)
   - ✅ Equipment list
   - ✅ Duration estimate
   - ✅ Difficulty badge
   - ✅ Source paper link

**2.4 Copy Protocol to Clipboard**:
1. In protocol detail modal
2. Click "Copy to Clipboard" button
3. Paste into a text editor
4. **Expected**: Formatted protocol text

**2.5 Download Protocol as JSON**:
1. In protocol detail modal
2. Click "Download JSON" button
3. **Expected**: JSON file downloads with protocol data

**2.6 Edit Protocol**:
1. In protocol detail modal
2. Click "Edit" button
3. Modify protocol name or steps
4. Click "Save"
5. **Expected**: Changes saved, modal updates

**2.7 Delete Protocol**:
1. In protocol detail modal
2. Click "Delete Protocol" button
3. Confirm deletion
4. **Expected**: Protocol removed, modal closes

**2.8 Test Protocol Caching**:
1. Extract protocol from a paper (first time)
2. Note the time (2-5 seconds)
3. Extract same protocol again
4. **Expected**: Instant response (<100ms) from cache

---

## 🔧 Backend API Testing

### Using cURL or Postman

**Test 1: Get Triage Results**
```bash
curl -X GET "https://r-dagent-production.up.railway.app/api/triage/project/YOUR_PROJECT_ID/inbox" \
  -H "User-ID: YOUR_USER_ID"
```

**Expected Response**:
```json
[
  {
    "article_pmid": "12345678",
    "title": "Paper title",
    "decision": "accept",
    "confidence_score": 0.85,
    "evidence_excerpts": ["excerpt 1", "excerpt 2"],
    "question_relevance_scores": {...},
    "reasoning": "This paper is relevant because..."
  }
]
```

**Test 2: Extract Protocol**
```bash
curl -X POST "https://r-dagent-production.up.railway.app/api/protocols/extract" \
  -H "Content-Type: application/json" \
  -H "User-ID: YOUR_USER_ID" \
  -d '{
    "article_pmid": "12345678",
    "protocol_type": null,
    "force_refresh": false
  }'
```

**Expected Response**:
```json
{
  "protocol_id": "uuid",
  "protocol_name": "CRISPR Gene Editing Protocol",
  "protocol_type": "editing",
  "materials": [...],
  "steps": [...],
  "equipment": [...],
  "duration_estimate": "4-6 hours",
  "difficulty_level": "moderate"
}
```

**Test 3: Get All Protocols**
```bash
curl -X GET "https://r-dagent-production.up.railway.app/api/protocols/project/YOUR_PROJECT_ID" \
  -H "User-ID: YOUR_USER_ID"
```

**Test 4: Update Protocol**
```bash
curl -X PUT "https://r-dagent-production.up.railway.app/api/protocols/PROTOCOL_ID" \
  -H "Content-Type: application/json" \
  -H "User-ID: YOUR_USER_ID" \
  -d '{
    "protocol_name": "Updated Protocol Name",
    "notes": "Added manual corrections"
  }'
```

**Test 5: Delete Protocol**
```bash
curl -X DELETE "https://r-dagent-production.up.railway.app/api/protocols/PROTOCOL_ID" \
  -H "User-ID: YOUR_USER_ID"
```

---

## ⚡ Performance Testing

### Test Cache Performance

**Python Script** (`backend/test_protocol_extraction.py`):
```bash
cd backend
python test_protocol_extraction.py
```

**Expected Output**:
```
🧪 Testing Protocol Extraction Service

Test 1: Cache Behavior
✅ First extraction (cache miss): 2.3s
✅ Second extraction (cache hit): 0.05s
✅ Speedup: 46x faster

Test 2: Protocol Structure
✅ Protocol has required fields
✅ Materials structure valid
✅ Steps structure valid
✅ Equipment structure valid

📊 Summary: 8/8 tests passed
```

### Measure Response Times

**Triage Performance**:
- Cache hit: <500ms ✅
- Cache miss: <2000ms ✅

**Protocol Extraction Performance**:
- Cache hit: <100ms ✅
- Cache miss: 2-5 seconds ✅

---

## 🐛 Troubleshooting

### Issue 1: "Extract Protocol" button not visible
**Solution**: 
- Make sure you're on the Inbox tab
- Check if papers are loaded
- Refresh the page
- Check browser console for errors

### Issue 2: Protocol extraction fails
**Possible Causes**:
- Paper has no abstract (AI needs abstract to extract)
- OpenAI API key not configured
- Backend error (check Railway logs)

**Solution**:
```bash
railway logs
```

### Issue 3: Protocols tab not visible
**Solution**:
- Protocols tab may need to be added to project navigation
- For now, access via direct API or browser console test
- Check `frontend/src/components/project/ProtocolsTab.tsx` is imported

### Issue 4: Slow triage performance
**Possible Causes**:
- Cache miss (first time loading)
- Large project (>100 papers)
- Network latency

**Solution**:
- Wait for cache to populate (subsequent loads will be fast)
- Check Railway logs for performance issues
- Monitor OpenAI API usage

### Issue 5: Enhanced triage fields missing
**Possible Causes**:
- Old cached data (before Week 16 deployment)
- Backend not updated

**Solution**:
- Force refresh triage: add `?force_refresh=true` to API call
- Clear cache and re-triage papers
- Check backend deployment status

---

## 📊 Success Criteria

### Week 16: AI Cost Optimization
- ✅ Triage cache hit rate: >60%
- ✅ Response time (cache hit): <500ms
- ✅ Token reduction: ~30% (question prioritization)
- ✅ Cost reduction: ~64% overall

### Week 17-18: Protocol Extraction
- ✅ Protocol extraction success rate: >90%
- ✅ Cache hit rate: >60%
- ✅ Response time (cache hit): <100ms
- ✅ Protocol structure valid: 100%
- ✅ All CRUD operations work: 100%

---

## 📞 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check browser console for frontend errors
3. Review `WEEK_17_18_PROTOCOL_EXTRACTION_COMPLETE.md` for details
4. Check GitHub commits for recent changes

---

**Happy Testing! 🚀**

