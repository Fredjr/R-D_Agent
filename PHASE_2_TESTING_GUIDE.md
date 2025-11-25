# Phase 2: Testing Guide - Auto-Highlight AI Evidence + Smart Note Suggestions

**Date**: 2025-11-25  
**Features**: Auto-Highlight AI Evidence (2.1) + Smart Note Suggestions (2.2)

---

## 🎯 Quick Start Testing

### **Prerequisites**
1. ✅ Phase 2 code deployed to production
2. ✅ User account with existing project
3. ✅ At least one paper that has been triaged with AI
4. ✅ At least one hypothesis in the project

### **How to Find a Triaged Paper**
1. Go to your project
2. Navigate to "Smart Inbox" or "Triage" tab
3. Look for papers with triage status badges (Must Read, Nice to Know, etc.)
4. Click on any paper to open PDF viewer

---

## 🧪 Test 1: Auto-Highlight AI Evidence (Feature 2.1)

### **Test 1.1: Purple Highlights Appear**
**Steps**:
1. Open a paper that has been triaged with AI
2. Wait for PDF to load (2-3 seconds)
3. Look for **purple highlights** on the PDF pages

**Expected Result**:
- ✅ Purple highlights appear automatically (no user action needed)
- ✅ Purple color: `rgba(147, 51, 234, 0.25)` with purple border
- ✅ Highlights appear within first 10 pages
- ✅ Multiple highlights may appear if multiple evidence excerpts exist

**If No Highlights Appear**:
- Check browser console for errors (F12 → Console tab)
- Verify paper has triage data: Check Smart Inbox for triage status
- Verify evidence excerpts exist in triage data

---

### **Test 1.2: Tooltips Show Hypothesis Information**
**Steps**:
1. Hover mouse over a purple highlight
2. Wait 1 second for tooltip to appear

**Expected Result**:
- ✅ Tooltip appears with text like:
  ```
  🤖 AI Evidence
  Supports: [Hypothesis text]
  Relevance: [Why this evidence matters]
  ```
- ✅ Tooltip is readable and well-formatted
- ✅ Hypothesis text matches actual hypothesis in project

**If Tooltip Doesn't Appear**:
- Try clicking on the purple highlight instead
- Check browser console for errors
- Verify hypothesis is linked to evidence in database

---

### **Test 1.3: Purple Highlights Don't Interfere with User Highlights**
**Steps**:
1. Create a user highlight (drag to select text, choose color)
2. Verify user highlight appears on top of purple highlight (if overlapping)

**Expected Result**:
- ✅ User highlights have higher z-index (10) than AI highlights (5)
- ✅ User can still create highlights normally
- ✅ Both types of highlights are visible

---

### **Test 1.4: Performance with Large PDFs**
**Steps**:
1. Open a paper with 20+ pages
2. Measure time for purple highlights to appear

**Expected Result**:
- ✅ Highlights appear within 3-5 seconds
- ✅ PDF scrolling is smooth (no lag)
- ✅ Only first 10 pages are searched (performance optimization)

---

## 🧪 Test 2: Smart Note Suggestions (Feature 2.2)

### **Test 2.1: Suggestion Toast Appears**
**Steps**:
1. Open a paper with AI evidence (purple highlights visible)
2. Manually highlight text that matches a purple highlight:
   - Drag to select the same text as a purple highlight
   - Choose any color from the color picker
   - Release to create highlight
3. Wait 1 second

**Expected Result**:
- ✅ **Gradient toast** appears in bottom-right corner
- ✅ Toast has purple/indigo gradient background
- ✅ Toast shows sparkles icon (✨) and "🤖 AI Suggestion" title
- ✅ Toast shows text: "This text matches AI-extracted evidence!"
- ✅ Toast shows hypothesis text in white box
- ✅ Toast has two buttons: "✨ Link to Hypothesis" and "Not Now"

**If Toast Doesn't Appear**:
- Verify you highlighted text matching AI evidence (purple highlight)
- Check that selected text is at least 20 characters
- Check browser console for errors
- Try highlighting a different purple highlight

---

### **Test 2.2: Link to Hypothesis Button Works**
**Steps**:
1. Follow Test 2.1 to get suggestion toast
2. Click "✨ Link to Hypothesis" button
3. Wait 2 seconds

**Expected Result**:
- ✅ Toast disappears
- ✅ Your highlight now shows hypothesis badge in sidebar
- ✅ Annotation is linked to hypothesis (check in Notes panel)
- ✅ Evidence link is created in database
- ✅ No errors in console

**Verification**:
- Open the Notes/Annotations panel in sidebar
- Find your highlight in the list
- Verify it shows the linked hypothesis

---

### **Test 2.3: Dismiss Button Works**
**Steps**:
1. Follow Test 2.1 to get suggestion toast
2. Click "Not Now" button

**Expected Result**:
- ✅ Toast disappears immediately
- ✅ Highlight remains but is NOT linked to hypothesis
- ✅ User can continue working normally

---

### **Test 2.4: No Suggestion for Non-AI-Evidence Text**
**Steps**:
1. Open a paper with AI evidence
2. Highlight text that does NOT match any purple highlight
3. Wait 2 seconds

**Expected Result**:
- ✅ NO suggestion toast appears
- ✅ Highlight is created normally
- ✅ User workflow is not interrupted

---

## 🧪 Test 3: Integration Testing

### **Test 3.1: Multiple Evidence Excerpts**
**Steps**:
1. Open a paper with multiple AI evidence excerpts (3+)
2. Verify multiple purple highlights appear
3. Highlight each one and verify suggestions work for all

**Expected Result**:
- ✅ All evidence excerpts are highlighted in purple
- ✅ Each has correct tooltip with hypothesis
- ✅ Suggestions work for all excerpts

---

### **Test 3.2: Paper Without Triage Data**
**Steps**:
1. Open a paper that has NOT been triaged
2. Wait for PDF to load

**Expected Result**:
- ✅ NO purple highlights appear
- ✅ PDF loads normally
- ✅ User can still create highlights manually
- ✅ No errors in console

---

### **Test 3.3: Evidence Linked to Multiple Hypotheses**
**Steps**:
1. Find a paper where evidence supports multiple hypotheses
2. Open PDF and verify purple highlights
3. Check tooltips

**Expected Result**:
- ✅ Tooltip shows the primary linked hypothesis
- ✅ Suggestion links to correct hypothesis

---

## 🐛 Troubleshooting

### **Purple Highlights Not Appearing**
1. Check browser console (F12 → Console)
2. Look for errors related to:
   - `/api/proxy/triage/project/{projectId}/inbox`
   - `/api/proxy/hypotheses/project/{projectId}`
3. Verify paper has triage data in Smart Inbox
4. Verify `evidence_excerpts` field exists in triage data

### **Suggestion Toast Not Appearing**
1. Check browser console for errors
2. Verify you're highlighting text that matches AI evidence (purple highlight)
3. Verify selected text is at least 20 characters
4. Check that `useSmartNoteSuggestions` hook is working

### **Link to Hypothesis Button Not Working**
1. Check browser console for errors
2. Look for failed API calls:
   - `PATCH /api/proxy/projects/{projectId}/annotations/{annotationId}`
   - `POST /api/proxy/hypotheses/{hypothesisId}/evidence`
3. Verify user has permission to update annotations
4. Verify hypothesis exists in database

---

## ✅ Acceptance Criteria Checklist

### **Feature 2.1: Auto-Highlight AI Evidence**
- [ ] Purple highlights appear automatically when PDF opens
- [ ] Tooltips show hypothesis text and relevance
- [ ] Purple highlights are visually distinct from user highlights
- [ ] Works with papers that have multiple evidence excerpts
- [ ] Handles papers without triage data gracefully
- [ ] No performance issues with large PDFs

### **Feature 2.2: Smart Note Suggestions**
- [ ] Toast appears when highlighting AI evidence
- [ ] Toast shows correct hypothesis information
- [ ] "Link to Hypothesis" button creates annotation link
- [ ] "Link to Hypothesis" button creates evidence link
- [ ] "Not Now" button dismisses toast without action
- [ ] No suggestion for non-AI-evidence text
- [ ] Works with multiple evidence excerpts

---

## 📊 Success Metrics

**User Value**:
- ✅ AI evidence is visible in PDF viewer
- ✅ One-click hypothesis linking saves time
- ✅ Seamless integration between AI and manual workflows

**Technical Quality**:
- ✅ Zero TypeScript errors
- ✅ No console errors during normal operation
- ✅ Smooth performance (no lag or blocking)

**Ready for Production**: All tests pass ✅

