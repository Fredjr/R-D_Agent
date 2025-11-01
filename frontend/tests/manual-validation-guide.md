# Phase 1 Week 1 - Manual Validation Guide

## 🎯 Quick Validation (5 minutes)

Follow these steps to manually validate all Phase 1 Week 1 features:

---

## Step 1: Navigate to Project Page

1. Open your browser
2. Go to: `https://frontend-psi-seven-85.vercel.app`
3. Log in if needed
4. Click on a project (or create one if none exist)
5. You should see the project page with 4 tabs at the top

**Expected Result:** ✅ Project page loads with 4 tabs visible

---

## Step 2: Validate Tab Names & Navigation

### Check Tab Names
Look at the tabs at the top of the page. You should see:

1. **Research Question** 🎯
2. **Explore Papers** 🔍
3. **My Collections** 📚
4. **Notes & Ideas** 📝

**Expected Result:** ✅ All 4 tabs have the correct names

### Test Tab Navigation
Click each tab one by one:

- [ ] Click "Research Question" - content changes
- [ ] Click "Explore Papers" - content changes
- [ ] Click "My Collections" - content changes
- [ ] Click "Notes & Ideas" - content changes

**Expected Result:** ✅ Each tab shows different content when clicked

---

## Step 3: Validate Research Question Tab

Click on the **"Research Question"** tab.

### Check for these elements:

- [ ] **Research Question section** - Shows the main research question
- [ ] **Quick Stats Cards** - Shows counts for:
  - Papers
  - Collections
  - Notes
  - Analyses
- [ ] **Project Description** - Shows project description
- [ ] **Edit Button** - Button to edit research question (if present)
- [ ] **Project Metadata** - Shows created date, updated date, owner
- [ ] **Seed Paper** - Shows seed paper if one exists

**Expected Result:** ✅ Research Question tab displays project overview with stats

---

## Step 4: Validate Explore Papers Tab

Click on the **"Explore Papers"** tab.

### Check for these elements:

- [ ] **PubMed Search Bar** - Large search input at the top
- [ ] **Search Button** - Button to submit search
- [ ] **Quick Search Suggestions** - Buttons like:
  - "machine learning"
  - "CRISPR"
  - "climate change"
  - "neural networks"
- [ ] **Network Visualization** - Graph showing paper connections
- [ ] **Help Section** - Instructions on how to use the network view

### Test Search Functionality:

1. Type "machine learning" in the search bar
2. Click the Search button
3. **Expected:** Should navigate to search results page

OR

1. Click one of the quick search suggestion buttons
2. **Expected:** Should navigate to search results page

**Expected Result:** ✅ Explore tab shows search bar and network view

---

## Step 5: Validate My Collections Tab

Click on the **"My Collections"** tab.

### Check for these elements:

- [ ] **Collections List** - Shows your collections
- [ ] **Collection Cards** - Each collection shows:
  - Collection name
  - Description
  - Paper count
- [ ] **Create Collection Button** - Button to create new collection (if present)

### Test Collection Interaction:

1. Click on a collection (if any exist)
2. **Expected:** Should show papers in that collection

**Expected Result:** ✅ Collections tab displays collections list

---

## Step 6: Validate Notes & Ideas Tab ⭐ (Most Important)

Click on the **"Notes & Ideas"** tab.

### Check for these elements:

- [ ] **Notes Header** - "Notes & Ideas" or similar
- [ ] **Search Bar** - Input to search notes
- [ ] **Filter Button** - Button with funnel icon or "Filter" text
- [ ] **Quick Stats Cards** - Shows note counts by level:
  - Project Notes
  - Collection Notes
  - Paper Notes
- [ ] **Notes List** - Shows your notes (or empty state)

### Test Filter Functionality:

1. Click the **Filter** button
2. **Expected:** Filter panel opens

3. Check for these filter dropdowns:
   - [ ] **Type Filter** with options:
     - All Types
     - General
     - Finding
     - Hypothesis
     - Question
     - Todo
     - Comparison
     - Critique
   
   - [ ] **Priority Filter** with options:
     - All Priorities
     - Low
     - Medium
     - High
     - Critical
   
   - [ ] **Status Filter** with options:
     - All Statuses
     - Active
     - Resolved
     - Archived
   
   - [ ] **View Mode Filter** with options:
     - All Notes
     - Project Only
     - Collection Only
     - Paper Only

4. Try selecting different filter options
5. **Expected:** Notes list updates based on filters

### Test Search Functionality:

1. Type something in the search bar
2. **Expected:** Notes list filters based on search query

**Expected Result:** ✅ Notes tab shows advanced filtering system

---

## Step 7: Test Network View (Critical Feature)

Go back to the **"Explore Papers"** tab.

### Check Network View Features:

- [ ] **Network Graph** - Visual graph with nodes and edges
- [ ] **Paper Nodes** - Circles representing papers
- [ ] **Navigation Modes** - Buttons or tabs for:
  - Similar Work
  - Earlier Work
  - Later Work
  - Authors
- [ ] **Zoom Controls** - Can zoom in/out
- [ ] **Pan Controls** - Can drag the graph around

### Test Network Interaction:

1. Click on a paper node in the network
2. **Expected:** Paper details appear or node highlights
3. Try clicking "Similar Work" or other navigation modes
4. **Expected:** Network updates to show related papers

**Expected Result:** ✅ Network view is interactive and functional

---

## 🎉 Validation Complete!

### Summary Checklist

- [ ] All 4 tabs are present with correct names
- [ ] Tab navigation works (clicking tabs changes content)
- [ ] Research Question tab shows project overview
- [ ] Explore Papers tab shows search bar and network view
- [ ] My Collections tab shows collections
- [ ] Notes & Ideas tab shows advanced filtering
- [ ] Network view is interactive
- [ ] No critical errors or broken features

---

## ✅ Success Criteria

If you checked **ALL** items above, then:

**🎉 PHASE 1 WEEK 1 IS COMPLETE AND READY FOR WEEK 2! 🎉**

---

## 🐛 If You Find Issues

### Minor Issues (Don't block Week 2):
- Styling inconsistencies
- Missing tooltips
- Slow loading times
- Empty states not showing

### Major Issues (Block Week 2):
- Tabs don't work at all
- Network view doesn't load
- Filters don't work
- Page crashes or shows errors

**If you find major issues, report them before proceeding to Week 2.**

---

## 📸 Screenshot Checklist

Take screenshots of:
1. All 4 tabs (one screenshot per tab)
2. Notes filter panel open
3. Network view with papers
4. Research Question tab with stats

These will be useful for documentation and progress tracking.

---

## 🚀 Next Steps

Once validation is complete:

1. ✅ Mark Phase 1 Week 1 as COMPLETE
2. 📝 Document any minor issues found
3. 🎯 Review Phase 1 Week 2 requirements
4. 🚀 Begin Week 2 implementation

---

**Validation Date:** _____________  
**Validated By:** _____________  
**Status:** [ ] PASS [ ] FAIL  
**Notes:** _____________________________________________


