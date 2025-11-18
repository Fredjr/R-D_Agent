# 📖 Week 5: Hypothesis UI - User Guide

## 🎯 What's New?

You can now create, manage, and track hypotheses for your research questions! Each hypothesis has:
- **Status** (Proposed → Testing → Supported/Rejected/Inconclusive)
- **Type** (Mechanistic, Predictive, Descriptive, Null)
- **Confidence Level** (0-100%)
- **Evidence Counts** (Supporting/Contradicting)

---

## 🚀 How to Use

### 1. **View Hypotheses for a Question**

1. Navigate to the **Questions** tab
2. Find a question with hypotheses (shows badge: "🔆 X hypotheses")
3. Click the hypothesis count badge
4. The hypotheses section expands below the question

**Visual Indicator**:
```
┌─────────────────────────────────────────────────┐
│ What is the mechanism of insulin resistance?   │
│                                                 │
│ 🔍 Exploring  HIGH  🧪 3 evidence  🔆 2 hypotheses ← Click here!
└─────────────────────────────────────────────────┘
```

---

### 2. **Add a New Hypothesis**

1. Click the hypothesis count badge to expand the section
2. Click the **"Add Hypothesis"** button (green button with + icon)
3. Fill out the form:
   - **Hypothesis** (required): Your hypothesis statement
   - **Type**: Select from dropdown
     - Mechanistic: Explains *how* something works
     - Predictive: Predicts *what* will happen
     - Descriptive: Describes *what* is observed
     - Null: States there is *no* effect
   - **Status**: Select from dropdown
     - Proposed: Just an idea
     - Testing: Currently being tested
     - Supported: Evidence supports it
     - Rejected: Evidence contradicts it
     - Inconclusive: Not enough evidence
   - **Confidence Level**: Drag slider (0-100%)
   - **Description** (optional): Additional context
4. Click **"Add Hypothesis"** button

**Keyboard Shortcuts**:
- `Escape` - Close modal
- `Cmd/Ctrl + Enter` - Save hypothesis

---

### 3. **Edit a Hypothesis**

1. Find the hypothesis in the list
2. Click the **pencil icon** (✏️) in the top-right corner
3. Update any fields
4. Click **"Save Changes"**

---

### 4. **Update Hypothesis Status (Quick Actions)**

For hypotheses in "Proposed" or "Testing" status, you'll see quick action buttons:

1. Scroll to the bottom of the hypothesis card
2. Click one of the quick action buttons:
   - **"Mark as Supported"** (green) - Evidence supports the hypothesis
   - **"Mark as Rejected"** (red) - Evidence contradicts the hypothesis

This is faster than opening the edit modal!

---

### 5. **Delete a Hypothesis**

1. Find the hypothesis in the list
2. Click the **trash icon** (🗑️) in the top-right corner
3. Confirm deletion in the popup

⚠️ **Warning**: This action cannot be undone!

---

### 6. **View Hypothesis Details**

Each hypothesis card shows:

**Top Section**:
- Hypothesis text
- Status badge (color-coded with icon)
- Type badge
- Confidence level percentage

**Evidence Counts** (if any evidence linked):
- ✅ X supporting (green)
- ❌ X contradicting (red)

**Expandable Description**:
- Click the chevron (▶) to expand/collapse
- Shows additional context and notes

---

## 🎨 Status Badge Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Proposed | Gray | ❓ | Just an idea, not tested yet |
| Testing | Blue | 🧪 | Currently being tested |
| Supported | Green | ✅ | Evidence supports this hypothesis |
| Rejected | Red | ❌ | Evidence contradicts this hypothesis |
| Inconclusive | Yellow | ➖ | Not enough evidence to decide |

---

## 🔬 Hypothesis Types Explained

### Mechanistic
**Explains HOW something works**

Example: "Insulin resistance is caused by mitochondrial dysfunction in muscle cells"

### Predictive
**Predicts WHAT will happen**

Example: "Increasing exercise will reduce insulin resistance by 30%"

### Descriptive
**Describes WHAT is observed**

Example: "Insulin resistance is more common in sedentary individuals"

### Null
**States there is NO effect**

Example: "There is no relationship between diet and insulin resistance"

---

## 💡 Best Practices

### 1. **Start with "Proposed" Status**
When you first create a hypothesis, use "Proposed" status. Update to "Testing" when you start gathering evidence.

### 2. **Use Confidence Levels Wisely**
- **0-30%**: Very uncertain, just a hunch
- **30-60%**: Some evidence, but not conclusive
- **60-80%**: Strong evidence, fairly confident
- **80-100%**: Very strong evidence, highly confident

### 3. **Add Descriptions**
Use the description field to:
- Explain your reasoning
- Note key assumptions
- Link to related papers
- Track changes over time

### 4. **Update Status as You Learn**
Don't be afraid to change status! Science is iterative:
- Proposed → Testing (when you start gathering evidence)
- Testing → Supported (when evidence accumulates)
- Testing → Rejected (when evidence contradicts)
- Testing → Inconclusive (when evidence is mixed)

### 5. **Link Evidence**
(Coming soon!) You'll be able to link papers directly to hypotheses to track supporting/contradicting evidence.

---

## 🐛 Troubleshooting

### "I don't see the hypothesis count badge"
- Make sure the question has at least one hypothesis
- Try refreshing the page
- Check that you're on the Questions tab

### "The Add Hypothesis button doesn't work"
- Make sure you've clicked the hypothesis count badge first
- Check your internet connection
- Try refreshing the page

### "My hypothesis didn't save"
- Check that you filled in the required field (hypothesis text)
- Check your internet connection
- Look for error messages in red at the top of the modal

### "I can't delete a hypothesis"
- Make sure you clicked "OK" in the confirmation dialog
- Check your internet connection
- Try refreshing the page and trying again

---

## 📊 Example Workflow

### Research Question: "What causes insulin resistance?"

**Hypothesis 1**:
- **Text**: "Mitochondrial dysfunction in muscle cells causes insulin resistance"
- **Type**: Mechanistic
- **Status**: Testing
- **Confidence**: 65%
- **Evidence**: 5 supporting, 2 contradicting

**Hypothesis 2**:
- **Text**: "Chronic inflammation leads to insulin resistance"
- **Type**: Mechanistic
- **Status**: Supported
- **Confidence**: 85%
- **Evidence**: 12 supporting, 1 contradicting

**Hypothesis 3**:
- **Text**: "Genetic factors have no impact on insulin resistance"
- **Type**: Null
- **Status**: Rejected
- **Confidence**: 90%
- **Evidence**: 0 supporting, 8 contradicting

---

## 🎉 What's Next?

### Coming Soon:
- **Link Evidence to Hypotheses**: Connect papers directly to hypotheses
- **Evidence Strength Indicators**: Weak, Moderate, Strong
- **Hypothesis Comparison**: Compare multiple hypotheses side-by-side
- **Export Hypotheses**: Download as markdown or PDF

---

**Need help? Have feedback?** Open an issue on GitHub or contact the development team!

**Happy researching!** 🔬✨

