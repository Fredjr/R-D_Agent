# 🚀 Quick Test Reference - Week 16-18

**TL;DR**: How to test AI optimization and protocol extraction in 5 minutes

---

## ⚡ Fastest Way to Test (2 minutes)

### Automated Browser Test

1. **Open**: https://r-d-agent.vercel.app
2. **Login**: fredericle75019@gmail.com
3. **Navigate**: Go to any project page
4. **Console**: Press `F12` (or `Cmd+Option+J` on Mac)
5. **Copy**: Get script from `tests/browser-console-test-week16-18.js`
6. **Paste**: Into console and press Enter
7. **Watch**: 20+ tests run automatically! 🎉

**Expected**: 80%+ pass rate, detailed results in console

---

## 🖱️ Manual Quick Test (5 minutes)

### Test Protocol Extraction

1. **Navigate**: Project → Papers → Inbox
2. **Click**: "Extract Protocol" button on any paper
3. **Wait**: 2-5 seconds for AI extraction
4. **Verify**: Success notification appears
5. **Check**: Protocols tab (if available) shows new protocol

### Test AI Triage Optimization

1. **Navigate**: Project → Papers → Inbox
2. **Check**: Papers load quickly (<500ms if cached)
3. **Verify**: Papers show confidence scores and evidence
4. **Refresh**: Page loads fast again (cache hit)

---

## 🔧 Backend API Quick Test

### Test Protocol Extraction API

```bash
# Replace YOUR_PROJECT_ID and YOUR_USER_ID
curl -X POST "https://r-dagent-production.up.railway.app/api/protocols/extract" \
  -H "Content-Type: application/json" \
  -H "User-ID: YOUR_USER_ID" \
  -d '{
    "article_pmid": "38901234",
    "protocol_type": null,
    "force_refresh": false
  }'
```

**Expected**: JSON response with protocol data in 2-5 seconds

### Test Triage API

```bash
curl -X GET "https://r-dagent-production.up.railway.app/api/triage/project/YOUR_PROJECT_ID/inbox" \
  -H "User-ID: YOUR_USER_ID"
```

**Expected**: JSON array of papers with enhanced fields (<500ms if cached)

---

## 📊 What to Look For

### Week 16: AI Cost Optimization ✅
- ✅ Fast triage load times (<500ms cached)
- ✅ Confidence scores on papers (e.g., "85% match")
- ✅ Evidence excerpts highlighted
- ✅ Question relevance scores

### Week 17-18: Protocol Extraction ✅
- ✅ "Extract Protocol" button in Inbox
- ✅ Protocol extraction works (2-5s first time, <100ms cached)
- ✅ Protocols tab shows extracted protocols
- ✅ Protocol details modal with materials, steps, equipment
- ✅ Copy/download/edit/delete functionality

---

## 🐛 Quick Troubleshooting

### Problem: "Extract Protocol" button not visible
**Fix**: Refresh page, make sure you're on Inbox tab

### Problem: Protocol extraction fails
**Fix**: Check Railway logs: `railway logs`

### Problem: Slow performance
**Fix**: First load is slow (cache miss), subsequent loads fast (cache hit)

### Problem: No enhanced triage fields
**Fix**: Force refresh or re-triage papers (may be old cached data)

---

## 📞 Need More Details?

- **Full Testing Guide**: `TESTING_GUIDE_WEEK_16_18.md`
- **Implementation Details**: `WEEK_17_18_PROTOCOL_EXTRACTION_COMPLETE.md`
- **Browser Test Script**: `tests/browser-console-test-week16-18.js`
- **Backend Test**: `backend/test_protocol_extraction.py`

---

## 🎯 Success Criteria

**Pass if**:
- ✅ Automated test: >80% pass rate
- ✅ Protocol extraction: Works end-to-end
- ✅ Triage: Fast load times (<500ms cached)
- ✅ UI: All buttons and modals work
- ✅ API: All endpoints return 200 OK

**You're good to go! 🚀**

---

## 📝 Quick Commands

```bash
# Check Railway deployment
railway status

# View Railway logs
railway logs

# Run backend test
python backend/test_protocol_extraction.py

# Build frontend locally
cd frontend && npm run build

# Check git status
git status
```

---

**Last Updated**: November 20, 2025  
**Status**: ✅ Week 16-18 Complete & Deployed

