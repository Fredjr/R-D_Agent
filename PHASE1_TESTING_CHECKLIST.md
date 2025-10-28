# 🧪 PHASE 1 TESTING CHECKLIST

## ✅ **FIXES IMPLEMENTED**

### **Fix 1.1: Context-Aware UI Labels**
- ✅ Added `supportsMultiColumn` prop to NetworkSidebar interface
- ✅ Labels dynamically change based on context
- ✅ Multi-column mode: "Click papers in list to create new columns"
- ✅ Single-panel mode: "Shows article list below"

### **Fix 1.2: Enhanced Exploration Paper Click Handler**
- ✅ Priority 1: Create column if `supportsMultiColumn && onCreatePaperColumn`
- ✅ Priority 2: Expand node if `onExpandNode` available
- ✅ Priority 3: Open in new tab (fallback)
- ✅ Comprehensive logging for debugging

### **Fix 1.3: Visual Mode Indicators**
- ✅ Green banner for Multi-Column Mode
- ✅ Blue banner for Single-Panel Mode
- ✅ Clear instructions for each mode

### **Fix 1.4: Updated All Callers**
- ✅ MultiColumnNetworkView: `supportsMultiColumn={true}`
- ✅ NetworkViewWithSidebar: `supportsMultiColumn={false}`

---

## 🧪 **TEST SCENARIOS**

### **TEST GROUP A: Multi-Column Mode (Project/Collection Network Tab)**

#### **Test A1: Visual Indicators**
**Location:** Project → Network Tab OR Collections → Network View

**Steps:**
1. Navigate to Project page
2. Click "Network" tab
3. Click any node in the graph
4. Observe sidebar

**Expected Results:**
- ✅ Green banner at top: "🎯 Multi-Column Mode Active"
- ✅ Instructions include: "Click papers in list → Create new columns"
- ✅ Instructions include: "Scroll horizontally → View all columns"
- ✅ Section labels say: "Click papers in list to create new columns"

**Status:** [ ] PASS [ ] FAIL

---

#### **Test A2: Explore Similar Work → Create Column**
**Location:** Project → Network Tab

**Steps:**
1. Click any node in main graph
2. Sidebar opens
3. Click "Similar Work" button (under 📄 Explore Papers)
4. Wait for article list to appear in sidebar
5. Click any paper in the list

**Expected Results:**
- ✅ Console log: "🔍 Exploration paper clicked"
- ✅ Console log: "✅ Creating new column for paper"
- ✅ NEW COLUMN appears to the right of main panel
- ✅ Column shows network graph for selected paper
- ✅ Can scroll horizontally to see both panels

**Status:** [ ] PASS [ ] FAIL

**Notes:**
_____________________________________________________________________

---

#### **Test A3: Explore Earlier Work → Create Column**
**Location:** Project → Network Tab

**Steps:**
1. Click any node in main graph
2. Click "Earlier Work" button
3. Wait for article list
4. Click any paper in the list

**Expected Results:**
- ✅ NEW COLUMN created
- ✅ Column shows references network for selected paper

**Status:** [ ] PASS [ ] FAIL

---

#### **Test A4: Explore Later Work → Create Column**
**Location:** Project → Network Tab

**Steps:**
1. Click any node
2. Click "Later Work" button
3. Wait for article list
4. Click any paper in the list

**Expected Results:**
- ✅ NEW COLUMN created
- ✅ Column shows citations network for selected paper

**Status:** [ ] PASS [ ] FAIL

---

#### **Test A5: These Authors → Create Column**
**Location:** Project → Network Tab

**Steps:**
1. Click any node
2. Click "These Authors" button (under 👥 Explore People)
3. Wait for article list
4. Click any paper in the list

**Expected Results:**
- ✅ NEW COLUMN created
- ✅ Column shows network for selected paper

**Status:** [ ] PASS [ ] FAIL

---

#### **Test A6: Multiple Columns**
**Location:** Project → Network Tab

**Steps:**
1. Create first column (Test A2)
2. Click node in first column
3. Click "Similar Work"
4. Click paper in list
5. Verify second column appears

**Expected Results:**
- ✅ Multiple columns visible
- ✅ Horizontal scrolling works
- ✅ Each column has independent sidebar
- ✅ Can close columns individually

**Status:** [ ] PASS [ ] FAIL

---

### **TEST GROUP B: Single-Panel Mode (NetworkViewWithSidebar)**

#### **Test B1: Visual Indicators**
**Location:** Collections → Article Detail → Network View

**Steps:**
1. Navigate to Collections page
2. Click any collection
3. Click "View Articles"
4. Click any article
5. Click network icon
6. Click any node in graph

**Expected Results:**
- ✅ Blue banner at top: "💡 Navigation:"
- ✅ Instructions: "Explore buttons → Show article list"
- ✅ Instructions: "Network buttons → Update graph"
- ✅ Section labels say: "Shows article list below"
- ❌ NO mention of creating columns

**Status:** [ ] PASS [ ] FAIL

---

#### **Test B2: Explore Similar Work → Shows List Only**
**Location:** Collections → Article Detail → Network View

**Steps:**
1. Click any node
2. Click "Similar Work" button
3. Wait for article list
4. Click any paper in the list

**Expected Results:**
- ✅ Console log: "🔍 Exploration paper clicked"
- ✅ Console log: "⚠️ No handler available, opening in new tab"
- ✅ Article opens in new browser tab
- ❌ NO new column created
- ✅ Main graph unchanged

**Status:** [ ] PASS [ ] FAIL

**Notes:**
_____________________________________________________________________

---

#### **Test B3: Citations Network → Updates Main Graph**
**Location:** Collections → Article Detail → Network View

**Steps:**
1. Click any node
2. Click "Citations Network" button (under 🕸️ Network Views)
3. Wait for graph to update

**Expected Results:**
- ✅ Main graph updates to show citations
- ❌ NO new column created
- ✅ Graph shows citing articles

**Status:** [ ] PASS [ ] FAIL

---

#### **Test B4: References Network → Updates Main Graph**
**Location:** Collections → Article Detail → Network View

**Steps:**
1. Click any node
2. Click "References Network" button
3. Wait for graph to update

**Expected Results:**
- ✅ Main graph updates to show references
- ❌ NO new column created
- ✅ Graph shows referenced articles

**Status:** [ ] PASS [ ] FAIL

---

### **TEST GROUP C: OA/Full-Text Toggle Integration**

#### **Test C1: OA Toggle in Multi-Column Mode**
**Location:** Project → Network Tab

**Steps:**
1. Toggle "OA/Full-Text Only" ON
2. Click node
3. Click "Similar Work"
4. Verify only OA articles in list
5. Click paper to create column
6. Verify column respects OA filter

**Expected Results:**
- ✅ Only Open Access articles in exploration list
- ✅ Column created successfully
- ✅ Column network respects OA filter

**Status:** [ ] PASS [ ] FAIL

---

#### **Test C2: OA Toggle in Single-Panel Mode**
**Location:** Collections → Article Detail → Network View

**Steps:**
1. Toggle "OA/Full-Text Only" ON
2. Click node
3. Click "Similar Work"
4. Verify only OA articles in list

**Expected Results:**
- ✅ Only Open Access articles shown
- ✅ Clicking paper opens in new tab

**Status:** [ ] PASS [ ] FAIL

---

### **TEST GROUP D: Regression Testing**

#### **Test D1: Top Navigation Still Works**
**Location:** Project → Network Tab

**Steps:**
1. Click "Similar Work" in TOP navigation bar
2. Verify main graph updates

**Expected Results:**
- ✅ Main graph shows similar articles network
- ✅ No sidebar interference

**Status:** [ ] PASS [ ] FAIL

---

#### **Test D2: Node Selection Still Works**
**Location:** Any network view

**Steps:**
1. Click any node
2. Verify sidebar opens
3. Verify node details shown

**Expected Results:**
- ✅ Sidebar opens
- ✅ Article details displayed
- ✅ All buttons functional

**Status:** [ ] PASS [ ] FAIL

---

## 📊 **TEST RESULTS SUMMARY**

| Test Group | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| A: Multi-Column Mode | 6 | ___ | ___ | |
| B: Single-Panel Mode | 4 | ___ | ___ | |
| C: OA Toggle | 2 | ___ | ___ | |
| D: Regression | 2 | ___ | ___ | |
| **TOTAL** | **14** | ___ | ___ | |

---

## 🐛 **ISSUES FOUND**

### Issue #1:
**Description:**
_____________________________________________________________________

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

**Steps to Reproduce:**
_____________________________________________________________________

**Expected:**
_____________________________________________________________________

**Actual:**
_____________________________________________________________________

---

## ✅ **SIGN-OFF**

- [ ] All critical tests passed
- [ ] No regressions introduced
- [ ] UI labels are accurate
- [ ] Multi-column mode works as expected
- [ ] Single-panel mode works as expected
- [ ] Ready for production

**Tested By:** _____________________
**Date:** _____________________
**Commit:** 8aba431

