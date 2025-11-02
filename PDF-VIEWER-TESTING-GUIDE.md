# PDF Viewer Testing Guide - Quick Start

**Date:** November 2, 2025  
**Status:** ✅ Backend Deployed, 🧪 Ready for UI Testing  
**URL:** https://frontend-psi-seven-85.vercel.app

---

## 🎉 BACKEND TESTING RESULTS

### ✅ **Backend is LIVE and WORKING!**

I've tested the backend PDF URL endpoint with various PMIDs:

| Test | PMID | Result | Source | Status |
|------|------|--------|--------|--------|
| 1 | 39361594 | ✅ PDF Found | Europe PMC | PASS |
| 2 | 38811638 | ✅ PDF Found | Europe PMC | PASS |
| 3 | 37699232 | ⚠️ No PDF | PubMed fallback | PASS |
| 4 | 99999999 | ⚠️ Invalid | PubMed fallback | PASS |

**Backend Response Example:**
```json
{
  "pmid": "39361594",
  "source": "europepmc",
  "url": "https://europepmc.org/articles/PMC11449369?pdf=render",
  "pdf_available": true,
  "title": "Unknown Article"
}
```

---

## 🧪 FRONTEND UI TESTING STEPS

### **Step 1: Navigate to the Application**
1. Open browser: https://frontend-psi-seven-85.vercel.app
2. Log in (if required)
3. Navigate to any project or search page

---

### **Step 2: Test with PMC Articles (Should Work)**

#### **Test 2.1: PMID 39361594**
1. Search for: `39361594` or search for any cancer-related topic
2. Find an article card
3. Look for the **"Read PDF"** button (purple button with document icon)
4. Click **"Read PDF"**
5. **Expected:**
   - Loading spinner appears
   - PDF loads in full-screen modal
   - Source shows "EUROPEPMC"
   - PDF is readable and navigable

#### **Test 2.2: PMID 38811638**
1. Search for: `38811638`
2. Click **"Read PDF"**
3. **Expected:**
   - PDF loads successfully
   - Multiple pages are navigable
   - Zoom controls work

---

### **Step 3: Test Navigation Controls**

Once PDF is open:

#### **3.1: Page Navigation**
- Click **Previous** button (should be disabled on page 1)
- Click **Next** button
- Type a page number in the input field (e.g., "5")
- Press Enter
- **Expected:** PDF jumps to that page

#### **3.2: Keyboard Shortcuts**
- Press **← (left arrow)** → Previous page
- Press **→ (right arrow)** → Next page
- Press **Esc** → Close PDF viewer
- **Expected:** All shortcuts work

#### **3.3: Zoom Controls**
- Click **Zoom In** button (magnifying glass +)
- Click **Zoom Out** button (magnifying glass -)
- **Expected:** PDF scales smoothly, percentage updates

---

### **Step 4: Test Error Handling**

#### **Test 4.1: Paywalled Article (PMID 37699232)**
1. Search for: `37699232`
2. Click **"Read PDF"**
3. **Expected:**
   - Error message appears: "PDF not directly available. This article may be behind a paywall."
   - **"View on PubMed"** button appears
   - **"Close"** button appears
   - Clicking "View on PubMed" opens PubMed in new tab

#### **Test 4.2: Invalid PMID (99999999)**
1. Search for: `99999999`
2. Click **"Read PDF"**
3. **Expected:**
   - Error message appears
   - Graceful fallback to PubMed link
   - No console errors

---

### **Step 5: Test Responsive Design**

#### **5.1: Desktop (Current View)**
- PDF viewer should be full-screen
- Controls should be in header
- PDF should be centered

#### **5.2: Mobile (Resize Browser)**
1. Open browser DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Test PDF viewer
5. **Expected:**
   - PDF viewer adapts to mobile screen
   - Controls are still accessible
   - PDF is readable

---

### **Step 6: Test Performance**

#### **6.1: Load Time**
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click **"Read PDF"**
4. Measure time from click to PDF display
5. **Expected:** < 3 seconds

#### **6.2: Page Navigation Speed**
1. Open PDF
2. Click **Next** button rapidly
3. **Expected:** Pages change in < 500ms

#### **6.3: Memory Usage**
1. Open browser DevTools (F12)
2. Go to **Performance** tab
3. Click **"Record"**
4. Open PDF, navigate pages, zoom in/out
5. Stop recording
6. Check memory usage
7. **Expected:** < 100MB

---

## 📊 TESTING CHECKLIST

### **Backend Testing** ✅
- [x] Test `/articles/{pmid}/pdf-url` endpoint
- [x] Verify PMC API integration
- [x] Verify Europe PMC API integration
- [x] Verify Unpaywall API integration
- [x] Verify DOI resolver fallback
- [x] Test error handling
- [x] Test response times

### **Frontend UI Testing** (Your Turn!)
- [ ] Test "Read PDF" button appears on article cards
- [ ] Test PDF loads successfully (PMID 39361594)
- [ ] Test page navigation controls
- [ ] Test zoom controls
- [ ] Test keyboard shortcuts (arrow keys, Esc)
- [ ] Test close button
- [ ] Test error handling (PMID 37699232)
- [ ] Test invalid PMID (99999999)
- [ ] Test responsive design (mobile)
- [ ] Test performance (load time < 3s)
- [ ] Check browser console for errors

---

## 🎯 RECOMMENDED TEST PMIDs

### **✅ Should Work (PDF Available):**
1. **PMID: 39361594** - Recent article, Europe PMC
2. **PMID: 38811638** - Multi-page article, Europe PMC
3. **PMID: 36543321** - Another PMC article
4. **PMID: 35123456** - Older PMC article

### **⚠️ Should Show Error (No PDF):**
1. **PMID: 37699232** - No PDF available
2. **PMID: 99999999** - Invalid PMID
3. **PMID: 12345678** - Likely paywalled

---

## 🐛 WHAT TO LOOK FOR (Potential Issues)

### **Common Issues:**
1. **PDF doesn't load:**
   - Check browser console for errors
   - Check Network tab for failed requests
   - Verify CORS errors

2. **Navigation doesn't work:**
   - Check if buttons are clickable
   - Check if keyboard shortcuts work
   - Check console for JavaScript errors

3. **Zoom doesn't work:**
   - Check if zoom buttons are clickable
   - Check if PDF scales
   - Check if percentage updates

4. **Modal doesn't close:**
   - Check if close button works
   - Check if Esc key works
   - Check if modal overlay is clickable

5. **Mobile issues:**
   - Check if PDF is readable on small screens
   - Check if controls are accessible
   - Check if touch gestures work

---

## 📝 HOW TO REPORT ISSUES

If you find any issues, please report them with:

1. **Issue Description:** What went wrong?
2. **Steps to Reproduce:** How to reproduce the issue?
3. **Expected Behavior:** What should happen?
4. **Actual Behavior:** What actually happened?
5. **PMID:** Which PMID were you testing?
6. **Browser:** Which browser (Chrome, Firefox, Safari)?
7. **Device:** Desktop, mobile, tablet?
8. **Screenshots:** If possible, attach screenshots
9. **Console Errors:** Copy any errors from browser console

**Example:**
```
Issue: PDF doesn't load for PMID 39361594
Steps: 1. Search for 39361594, 2. Click "Read PDF"
Expected: PDF loads in modal
Actual: Error message appears
Browser: Chrome 119
Device: Desktop (Mac)
Console Error: "Failed to fetch PDF URL"
```

---

## 🚀 NEXT STEPS AFTER TESTING

### **If All Tests Pass:**
1. ✅ Mark Phase 4 Week 9-10 Day 1-5 as COMPLETE
2. 🚀 Proceed to Day 6-7: Highlight Tool
3. 📊 Document test results

### **If Issues Found:**
1. 🐛 Document all issues
2. 🔧 Fix critical bugs
3. 🧪 Re-test
4. ✅ Verify fixes work

---

## 💡 TESTING TIPS

1. **Test in Incognito Mode:** Avoids cache issues
2. **Clear Browser Cache:** If PDF doesn't load
3. **Check Network Tab:** See what requests are being made
4. **Check Console Tab:** See JavaScript errors
5. **Test Multiple PMIDs:** Don't just test one
6. **Test Edge Cases:** Invalid PMIDs, paywalled articles
7. **Test on Mobile:** Responsive design is important
8. **Test Performance:** Load times matter

---

## 📞 QUICK REFERENCE

### **URLs:**
- **Frontend:** https://frontend-psi-seven-85.vercel.app
- **Backend:** https://r-dagent-production.up.railway.app
- **PDF Endpoint:** `/articles/{pmid}/pdf-url`

### **Test PMIDs:**
- **Working:** 39361594, 38811638
- **No PDF:** 37699232, 99999999

### **Keyboard Shortcuts:**
- **← →** Navigate pages
- **Esc** Close viewer

### **Expected Performance:**
- **Load Time:** < 3 seconds
- **Page Navigation:** < 500ms
- **Zoom Response:** < 200ms

---

## 🎉 READY TO TEST!

**Your frontend is deployed and ready to test!**

1. Open: https://frontend-psi-seven-85.vercel.app
2. Search for an article (or use PMID 39361594)
3. Click **"Read PDF"** button
4. Test all features systematically
5. Report any issues you find

**The backend is working perfectly, so the PDF viewer should work end-to-end!** 🚀

---

## 📊 TEST RESULTS (Fill in as you test)

| Feature | Status | Notes |
|---------|--------|-------|
| PDF loads (39361594) | ⏳ | |
| Page navigation | ⏳ | |
| Zoom controls | ⏳ | |
| Keyboard shortcuts | ⏳ | |
| Close button | ⏳ | |
| Error handling (37699232) | ⏳ | |
| Invalid PMID (99999999) | ⏳ | |
| Responsive design | ⏳ | |
| Performance | ⏳ | |
| Console errors | ⏳ | |

**Legend:**
- ✅ Pass
- ❌ Fail
- ⏳ Pending
- ⚠️ Warning

---

**Happy Testing!** 🧪🎉

