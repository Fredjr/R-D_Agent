# 🔬 How to Add/Edit Hypotheses

**Date**: 2025-11-18  
**Status**: Fixed - Hypothesis button now always visible!

---

## 🎯 **Where to Find Hypotheses**

### **Step 1: Look at Your Question Card**

On each question card, you'll see badges at the bottom:
- 🔍 Status badge (Exploring, Investigating, etc.)
- Priority badge (LOW, MEDIUM, HIGH, CRITICAL)
- 🧪 Evidence count (if you have linked papers)
- 💡 **"Add Hypothesis" button** ← **THIS IS NEW!**

---

## ✅ **How to Add a Hypothesis**

### **Step 1: Click "Add Hypothesis" Button**
- Look for the cyan/blue button with a lightbulb icon 💡
- It says "Add Hypothesis" (or shows count if you already have hypotheses)
- Click it to expand the hypotheses section

### **Step 2: Click "Add Hypothesis" in the Expanded Section**
- The hypotheses section will open below the question
- You'll see a green "+ Add Hypothesis" button
- Click it to open the modal

### **Step 3: Fill in the Hypothesis Form**

**Required Fields:**
- **Hypothesis Text**: Your hypothesis statement
  - Example: "Insulin resistance is caused by mitochondrial dysfunction"

**Optional Fields:**
- **Type**: Choose one
  - 🔧 Mechanistic (explains HOW something works)
  - 📊 Predictive (predicts WHAT will happen)
  - 📝 Descriptive (describes WHAT is observed)
  - ❌ Null (no effect expected)

- **Status**: Choose one
  - 💭 Proposed (just an idea)
  - 🔬 Testing (actively investigating)
  - ✅ Supported (evidence supports it)
  - ❌ Rejected (evidence contradicts it)
  - ⚖️ Inconclusive (mixed evidence)

- **Confidence Level**: Slider from 0-100%
  - How confident are you in this hypothesis?

- **Description**: Additional context or notes

### **Step 4: Click "Add Hypothesis"**
- The modal closes
- Your hypothesis appears in the list
- The count badge updates (e.g., "1 hypothesis")

---

## ✏️ **How to Edit a Hypothesis**

### **Step 1: Expand the Hypotheses Section**
- Click the hypothesis count badge (e.g., "1 hypothesis")

### **Step 2: Find Your Hypothesis**
- You'll see all hypotheses listed as cards

### **Step 3: Click the Edit Icon (Pencil)**
- Hover over the hypothesis card
- Click the pencil icon on the right
- The edit modal opens

### **Step 4: Make Changes**
- Update any fields you want
- Click "Save Changes"

---

## ⚡ **Quick Status Update**

You can change the status WITHOUT opening the modal:

### **Step 1: Expand Hypotheses Section**
- Click the hypothesis count badge

### **Step 2: Click a Status Button**
- Each hypothesis card has quick action buttons:
  - 💭 Proposed
  - 🔬 Testing
  - ✅ Supported
  - ❌ Rejected
  - ⚖️ Inconclusive

### **Step 3: Status Updates Immediately**
- No modal needed!
- Badge color changes instantly

---

## 🗑️ **How to Delete a Hypothesis**

### **Step 1: Expand Hypotheses Section**
- Click the hypothesis count badge

### **Step 2: Click the Trash Icon**
- Hover over the hypothesis card
- Click the red trash icon
- Confirm deletion

### **Step 3: Hypothesis Removed**
- Card disappears
- Count badge updates

---

## 🔗 **How to Link Evidence to Hypothesis**

### **Step 1: Expand Hypotheses Section**
- Click the hypothesis count badge

### **Step 2: Click "Link Evidence" on Hypothesis Card**
- Each hypothesis has a "Link Evidence" button
- Click it to open the evidence modal

### **Step 3: Select Papers**
- Search for papers or use PMID
- Select evidence type (Supports, Contradicts, Neutral)
- Set strength (Weak, Moderate, Strong)
- Add key findings

### **Step 4: Evidence Linked**
- Evidence count indicators update
- Shows "X supporting, Y contradicting"

---

## 🎨 **Visual Guide**

```
┌─────────────────────────────────────────────────────────────┐
│ Question Card                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  What causes insulin resistance?                            │
│                                                              │
│  [🔍 Investigating] [HIGH] [🧪 3 evidence] [💡 Add Hypothesis] │
│                                                              │
│  [Edit] [Delete] [Add Sub-Question] [Link Evidence]         │
└─────────────────────────────────────────────────────────────┘
                              ↓ Click "Add Hypothesis"
┌─────────────────────────────────────────────────────────────┐
│ Hypotheses Section (Expanded)                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [+ Add Hypothesis]                                          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Hypothesis Card                                       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Mitochondrial dysfunction causes insulin resistance  │  │
│  │                                                       │  │
│  │ [🔧 Mechanistic] [🔬 Testing] [Confidence: 70%]      │  │
│  │ [✅ 2 supporting] [❌ 0 contradicting]                │  │
│  │                                                       │  │
│  │ Quick Actions: [💭] [🔬] [✅] [❌] [⚖️]                │  │
│  │                                                       │  │
│  │ [Link Evidence] [Edit] [Delete]                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 **What Was Fixed**

**Before:**
- ❌ "Add Hypothesis" button only appeared if hypothesis_count > 0
- ❌ No way to add the FIRST hypothesis
- ❌ Users couldn't find where to add hypotheses

**After:**
- ✅ "Add Hypothesis" button ALWAYS visible
- ✅ Shows "Add Hypothesis" when count = 0
- ✅ Shows "X hypotheses" when count > 0
- ✅ Hypotheses section expands even when empty

---

## 🚀 **Try It Now!**

1. Refresh your page (to get the latest code)
2. Look at your "Insuline" question
3. You should see a cyan "Add Hypothesis" button
4. Click it and create your first hypothesis!

---

**Need help?** Let me know if you have any issues!

