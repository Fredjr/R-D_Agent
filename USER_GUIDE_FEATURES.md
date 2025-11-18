# 🎯 User Guide - Where to Find Everything

**Date**: 2025-11-18  
**Status**: All features working! Hypothesis button now always visible!

---

## 📍 **Your Question Card - Annotated**

```
┌─────────────────────────────────────────────────────────────────┐
│  Insuline                                    [Hover for buttons]│
│  Insuline                                    🔗 Link Evidence   │
│                                              ➕ Add Sub-Question│
│  [🔍 Exploring] [MEDIUM] [💡 Add Hypothesis] ✏️ Edit Question   │
│                                              🗑️ Delete          │
└─────────────────────────────────────────────────────────────────┘
         ↑              ↑              ↑
      Status        Priority    Hypothesis Button (NEW!)
```

---

## 🎯 **Answer to Your Question: "Where do I add/edit hypothesis?"**

### **To ADD a Hypothesis:**

1. **Look at your question card** (like "Insuline")
2. **Find the cyan/blue button** that says **"Add Hypothesis"** 💡
3. **Click it** - The hypotheses section expands below
4. **Click the green "+ Add Hypothesis" button** in the expanded section
5. **Fill in the form** and click "Add Hypothesis"

### **To EDIT a Hypothesis:**

1. **Click the hypothesis count badge** (e.g., "1 hypothesis")
2. **Find your hypothesis** in the list
3. **Hover over it** to see action buttons
4. **Click the pencil icon** ✏️
5. **Make changes** and click "Save Changes"

---

## 🔗 **About the "Link Evidence" Modal You Showed**

That modal is for **linking papers to QUESTIONS**, not hypotheses.

**What you can do with it:**
- ✅ Select papers from your collection
- ✅ Choose evidence type (5 options now!)
  - Supports (green)
  - Contradicts (red)
  - Neutral (gray)
  - **Context (purple)** ← NEW!
  - **Methodology (indigo)** ← NEW!
- ✅ Set relevance score (1-10)
- ✅ Add key findings (your notes)

**Note:** You can ALSO link evidence to hypotheses (separate modal)

---

## 🆕 **What Just Got Fixed**

### **Problem:**
- The "Add Hypothesis" button only appeared if you already had hypotheses
- No way to add the FIRST hypothesis
- Users couldn't find where to add hypotheses

### **Solution:**
- ✅ Button now ALWAYS visible on every question
- ✅ Shows "Add Hypothesis" when you have 0 hypotheses
- ✅ Shows "X hypotheses" when you have 1 or more
- ✅ Hypotheses section opens even when empty

---

## 🚀 **Try It Now!**

### **Step 1: Wait for Deployment** (5-10 minutes)
Vercel is deploying the fix right now.

### **Step 2: Refresh Your Page**
Press F5 or Cmd+R to reload.

### **Step 3: Look at Your "Insuline" Question**
You should now see a **cyan "Add Hypothesis" button** 💡

### **Step 4: Click It!**
The hypotheses section will expand.

### **Step 5: Click "+ Add Hypothesis"**
The modal opens.

### **Step 6: Create Your First Hypothesis**
Example:
- **Text**: "Insulin regulates glucose metabolism"
- **Type**: Mechanistic
- **Status**: Proposed
- **Confidence**: 50%

---

## 📊 **Complete Feature Map**

### **On Question Card (Always Visible):**
- Status badge (click Edit to change)
- Priority badge (click Edit to change)
- **Add Hypothesis button** ← Click here!
- Evidence count (if you have linked papers)

### **On Hover (Right Side):**
- 🔗 Link Evidence (to question)
- ➕ Add Sub-Question
- ✏️ Edit Question
- 🗑️ Delete Question

### **In Hypotheses Section (After Clicking "Add Hypothesis"):**
- List of all hypotheses
- "+ Add Hypothesis" button
- Each hypothesis card has:
  - Type badge (Mechanistic, Predictive, etc.)
  - Status badge (Proposed, Testing, etc.)
  - Confidence level (0-100%)
  - Evidence counts (supporting/contradicting)
  - Quick status buttons (💭 🔬 ✅ ❌ ⚖️)
  - Link Evidence button
  - Edit button
  - Delete button

---

## 🎨 **Visual Hierarchy**

```
Project
  └─ Questions Tab
      └─ Question Card: "Insuline"
          ├─ [Add Hypothesis] ← Click here first!
          │   └─ Hypotheses Section (expands)
          │       ├─ [+ Add Hypothesis] ← Then click here!
          │       └─ Hypothesis Cards
          │           ├─ Quick status buttons
          │           ├─ Link Evidence
          │           ├─ Edit
          │           └─ Delete
          │
          ├─ [Link Evidence] ← For linking papers to question
          ├─ [Add Sub-Question]
          ├─ [Edit]
          └─ [Delete]
```

---

## ✅ **Summary**

**To add a hypothesis:**
1. Click the **cyan "Add Hypothesis" button** on your question card
2. Click **"+ Add Hypothesis"** in the expanded section
3. Fill in the form
4. Done!

**The button is now always visible** - you don't need to have hypotheses first!

---

**Need more help?** Check out:
- **HOW_TO_USE_HYPOTHESES.md** - Detailed guide with examples
- **COMPREHENSIVE_FEATURE_TEST.js** - Test all features step-by-step
- **FEATURE_LOGIC_ANALYSIS.md** - Understand what each feature does

---

🎉 **You're all set! Refresh your page and try it out!**

