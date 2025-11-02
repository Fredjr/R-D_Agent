# PDF Viewer Testing Plan - Phase 4 Week 9-10

**Date:** November 2, 2025  
**Status:** 🧪 Ready for Testing  
**Implementation:** ✅ Complete (Day 1-5)

---

## 🎯 TESTING OBJECTIVES

1. **Verify PDF retrieval** from multiple sources (PMC, Europe PMC, Unpaywall, DOI)
2. **Test edge cases** (paywalled articles, missing PDFs, invalid PMIDs)
3. **Validate UI/UX** (loading states, error handling, navigation)
4. **Ensure performance** (load times, responsiveness)
5. **Test across devices** (desktop, mobile, tablet)

---

## 📋 TEST CASES

### **Test Case 1: PubMed Central (PMC) Articles** ✅
**Objective:** Verify PDF retrieval from PMC (most reliable source)

**Test PMIDs:**
1. **PMID: 39361594** - Recent PMC article (2024)
   - Expected: PDF from PMC
   - URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11447184/pdf/

2. **PMID: 38811638** - PMC article with multiple pages
   - Expected: PDF from PMC
   - URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11135634/pdf/

3. **PMID: 37699232** - PMC article (2023)
   - Expected: PDF from PMC
   - URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10495440/pdf/

**Test Steps:**
1. Navigate to project page
2. Search for article by PMID
3. Click "Read PDF" button
4. Verify loading state appears
5. Verify PDF loads successfully
6. Verify source shows "PMC"
7. Test page navigation (prev/next)
8. Test zoom controls (in/out)
9. Test keyboard shortcuts (arrow keys, Esc)

**Expected Results:**
- ✅ PDF loads in < 3 seconds
- ✅ All pages are navigable
- ✅ Zoom controls work smoothly
- ✅ Keyboard shortcuts work
- ✅ Close button works

---

### **Test Case 2: Europe PMC Articles** ✅
**Objective:** Verify PDF retrieval from Europe PMC (alternative source)

**Test PMIDs:**
1. **PMID: 39361594** - Should also be in Europe PMC
   - Expected: PDF from Europe PMC if PMC fails
   - URL: https://europepmc.org/articles/PMC11447184?pdf=render

2. **PMID: 38811638** - Europe PMC article
   - Expected: PDF from Europe PMC
   - URL: https://europepmc.org/articles/PMC11135634?pdf=render

**Test Steps:**
1. Same as Test Case 1
2. Verify source shows "EUROPEPMC"

**Expected Results:**
- ✅ PDF loads successfully
- ✅ Source is correctly identified

---

### **Test Case 3: Open Access (Unpaywall) Articles** ✅
**Objective:** Verify PDF retrieval from Unpaywall API

**Test PMIDs:**
1. **PMID: 39361594** - Has DOI, should be in Unpaywall
   - DOI: 10.1186/s12967-024-05686-y
   - Expected: PDF from Unpaywall or publisher

2. **PMID: 38811638** - Has DOI
   - DOI: 10.1186/s13045-024-01561-5
   - Expected: PDF from Unpaywall

**Test Steps:**
1. Same as Test Case 1
2. Verify source shows "UNPAYWALL"

**Expected Results:**
- ✅ PDF loads successfully
- ✅ Source is correctly identified

---

### **Test Case 4: Paywalled Articles** ⚠️
**Objective:** Verify graceful handling of paywalled articles

**Test PMIDs:**
1. **PMID: 39361595** - Potentially paywalled
2. **PMID: 12345678** - Older article, likely paywalled

**Test Steps:**
1. Navigate to project page
2. Search for article by PMID
3. Click "Read PDF" button
4. Verify loading state appears
5. Verify error message appears
6. Verify "View on PubMed" button appears
7. Click "View on PubMed" button
8. Verify PubMed page opens in new tab

**Expected Results:**
- ✅ Error message: "PDF not directly available. This article may be behind a paywall."
- ✅ "View on PubMed" button works
- ✅ "Close" button works
- ✅ No console errors

---

### **Test Case 5: Invalid PMIDs** ❌
**Objective:** Verify error handling for invalid PMIDs

**Test PMIDs:**
1. **PMID: 99999999** - Non-existent PMID
2. **PMID: invalid** - Invalid format
3. **PMID: 0** - Edge case

**Test Steps:**
1. Same as Test Case 4

**Expected Results:**
- ✅ Error message appears
- ✅ Graceful fallback to PubMed link
- ✅ No crashes or console errors

---

### **Test Case 6: UI/UX Testing** 🎨
**Objective:** Verify user interface and experience

**Test Scenarios:**

#### **6.1: Loading State**
- ✅ Loading spinner appears immediately
- ✅ Loading message is clear
- ✅ Loading state disappears when PDF loads

#### **6.2: Navigation Controls**
- ✅ Previous button disabled on page 1
- ✅ Next button disabled on last page
- ✅ Page number input works
- ✅ Page number input validates (1 to numPages)
- ✅ Arrow keys work for navigation

#### **6.3: Zoom Controls**
- ✅ Zoom in button works (max 300%)
- ✅ Zoom out button works (min 50%)
- ✅ Zoom percentage displays correctly
- ✅ PDF scales smoothly

#### **6.4: Close Functionality**
- ✅ Close button (X) works
- ✅ Esc key works
- ✅ Modal closes completely
- ✅ No memory leaks

#### **6.5: Responsive Design**
- ✅ Works on desktop (1920x1080)
- ✅ Works on laptop (1366x768)
- ✅ Works on tablet (768x1024)
- ✅ Works on mobile (375x667)

---

### **Test Case 7: Performance Testing** ⚡
**Objective:** Verify performance and load times

**Metrics to Measure:**
1. **PDF Load Time** (target: < 3 seconds)
2. **Page Navigation Time** (target: < 500ms)
3. **Zoom Response Time** (target: < 200ms)
4. **Memory Usage** (target: < 100MB)

**Test Steps:**
1. Open browser DevTools
2. Go to Performance tab
3. Start recording
4. Click "Read PDF" button
5. Navigate through pages
6. Zoom in/out
7. Stop recording
8. Analyze metrics

**Expected Results:**
- ✅ PDF loads in < 3 seconds
- ✅ Page navigation < 500ms
- ✅ Zoom response < 200ms
- ✅ Memory usage < 100MB
- ✅ No memory leaks

---

### **Test Case 8: Error Handling** 🚨
**Objective:** Verify error handling and recovery

**Test Scenarios:**

#### **8.1: Network Errors**
- Disconnect internet
- Click "Read PDF" button
- Verify error message appears
- Reconnect internet
- Verify retry works

#### **8.2: Backend Errors**
- Backend returns 500 error
- Verify error message appears
- Verify graceful fallback

#### **8.3: PDF Load Errors**
- PDF file is corrupted
- Verify error message appears
- Verify no console errors

**Expected Results:**
- ✅ All errors handled gracefully
- ✅ User-friendly error messages
- ✅ No crashes or blank screens

---

### **Test Case 9: Cross-Browser Testing** 🌐
**Objective:** Verify compatibility across browsers

**Browsers to Test:**
1. ✅ Chrome (latest)
2. ✅ Firefox (latest)
3. ✅ Safari (latest)
4. ✅ Edge (latest)

**Test Steps:**
1. Open each browser
2. Navigate to production URL
3. Test PDF viewer functionality
4. Verify all features work

**Expected Results:**
- ✅ Works in all browsers
- ✅ No browser-specific bugs
- ✅ Consistent UI/UX

---

### **Test Case 10: Integration Testing** 🔗
**Objective:** Verify integration with existing features

**Test Scenarios:**

#### **10.1: Article Card Integration**
- ✅ "Read PDF" button appears on all article cards
- ✅ Button is styled consistently
- ✅ Button works from search results
- ✅ Button works from collections
- ✅ Button works from reports

#### **10.2: Deep Dive Integration**
- ✅ PDF viewer works alongside deep dive
- ✅ No conflicts with other modals
- ✅ State management works correctly

#### **10.3: Annotations Integration** (Future)
- 🔲 Highlights can be created
- 🔲 Highlights are saved
- 🔲 Highlights persist across sessions

---

## 🧪 TESTING CHECKLIST

### **Backend Testing:**
- [ ] Test `/articles/{pmid}/pdf-url` endpoint directly
- [ ] Verify PMC API integration
- [ ] Verify Europe PMC API integration
- [ ] Verify Unpaywall API integration
- [ ] Verify DOI resolver fallback
- [ ] Test error handling
- [ ] Test response times
- [ ] Check Railway logs for errors

### **Frontend Testing:**
- [ ] Test PDF proxy route
- [ ] Test PDFViewer component
- [ ] Test ArticleCard integration
- [ ] Test loading states
- [ ] Test error states
- [ ] Test navigation controls
- [ ] Test zoom controls
- [ ] Test keyboard shortcuts
- [ ] Test responsive design
- [ ] Check browser console for errors

### **End-to-End Testing:**
- [ ] Test full user flow (search → click → view PDF)
- [ ] Test with various PMIDs
- [ ] Test edge cases
- [ ] Test performance
- [ ] Test cross-browser
- [ ] Test mobile devices

---

## 📊 TEST RESULTS TEMPLATE

### **Test Execution Date:** [Date]
### **Tester:** [Name]
### **Environment:** [Production/Staging]

| Test Case | PMID | Expected Result | Actual Result | Status | Notes |
|-----------|------|-----------------|---------------|--------|-------|
| TC1.1 | 39361594 | PDF from PMC | | ⏳ | |
| TC1.2 | 38811638 | PDF from PMC | | ⏳ | |
| TC1.3 | 37699232 | PDF from PMC | | ⏳ | |
| TC2.1 | 39361594 | PDF from Europe PMC | | ⏳ | |
| TC3.1 | 39361594 | PDF from Unpaywall | | ⏳ | |
| TC4.1 | 39361595 | Error message | | ⏳ | |
| TC5.1 | 99999999 | Error message | | ⏳ | |
| TC6.1 | - | Loading state | | ⏳ | |
| TC6.2 | - | Navigation works | | ⏳ | |
| TC6.3 | - | Zoom works | | ⏳ | |
| TC6.4 | - | Close works | | ⏳ | |
| TC6.5 | - | Responsive | | ⏳ | |
| TC7.1 | - | Performance | | ⏳ | |
| TC8.1 | - | Error handling | | ⏳ | |
| TC9.1 | - | Cross-browser | | ⏳ | |
| TC10.1 | - | Integration | | ⏳ | |

**Legend:**
- ✅ Pass
- ❌ Fail
- ⏳ Pending
- ⚠️ Warning

---

## 🚀 TESTING COMMANDS

### **Backend Testing:**
```bash
# Test PDF URL endpoint directly
curl "https://r-dagent-production.up.railway.app/articles/39361594/pdf-url" \
  -H "User-ID: default_user" | jq

# Test with various PMIDs
for pmid in 39361594 38811638 37699232 99999999; do
  echo "Testing PMID: $pmid"
  curl -s "https://r-dagent-production.up.railway.app/articles/$pmid/pdf-url" \
    -H "User-ID: default_user" | jq '.source, .pdf_available'
  echo "---"
done
```

### **Frontend Testing:**
```bash
# Test frontend proxy route
curl "https://frontend-psi-seven-85.vercel.app/api/proxy/articles/39361594/pdf-url" \
  -H "User-ID: default_user" | jq

# Open production URL in browser
open "https://frontend-psi-seven-85.vercel.app"
```

---

## 📝 KNOWN ISSUES & LIMITATIONS

### **Current Limitations:**
1. **PDF.js Worker:** Loaded from CDN (may be slow on first load)
2. **CORS:** Some publisher PDFs may have CORS restrictions
3. **Paywalled Content:** Cannot access paywalled articles
4. **Large PDFs:** May be slow to load (> 10MB)

### **Future Enhancements:**
1. **Offline Support:** Cache PDFs for offline reading
2. **Highlight Tool:** Add text highlighting and annotations
3. **Reading Progress:** Track reading progress
4. **Reading List:** "Read Later" queue
5. **Full-Text Search:** Search within PDF
6. **Download:** Download PDF for offline reading

---

## 🎯 SUCCESS CRITERIA

### **Must Have (MVP):**
- ✅ PDF loads from at least one source (PMC)
- ✅ Navigation controls work
- ✅ Zoom controls work
- ✅ Error handling works
- ✅ Mobile responsive

### **Should Have:**
- ✅ Multiple PDF sources (PMC, Europe PMC, Unpaywall)
- ✅ Keyboard shortcuts
- ✅ Performance < 3 seconds
- ✅ Cross-browser compatible

### **Nice to Have:**
- 🔲 Highlight tool
- 🔲 Reading progress
- 🔲 Reading list
- 🔲 Offline support

---

## 📞 NEXT STEPS

1. **Wait for deployments** (Railway + Vercel)
2. **Test backend endpoint** with curl
3. **Test frontend UI** in browser
4. **Execute test cases** systematically
5. **Document results** in test results template
6. **Fix bugs** if any found
7. **Iterate** until all tests pass

**Ready to start testing!** 🚀

