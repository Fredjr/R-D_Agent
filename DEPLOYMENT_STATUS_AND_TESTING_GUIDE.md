# Deployment Status & Testing Guide

**Date**: 2025-11-21  
**Feature**: Phase 1 Context-Aware AI Enhancement  
**Status**: 🚀 **DEPLOYED - Ready for Testing**

---

## ✅ **DEPLOYMENT STATUS**

### **Git Commits Pushed**:
1. ✅ `723b9a5` - Context-aware AI enhancement plan documents
2. ✅ `056a6b4` - Phase 1 implementation (560+ lines of new logic)

### **Railway Deployment**:
- ⏳ **Status**: Deploying (2-5 minutes)
- 🔗 **Check**: https://railway.app (your dashboard)
- 📋 **What to look for**: 
  - Build status: "Building" → "Deploying" → "Active"
  - No error logs in deployment logs
  - Health check passes

### **Vercel Deployment**:
- ⏳ **Status**: Deploying (1-3 minutes)
- 🔗 **Check**: https://vercel.com (your dashboard)
- 📋 **What to look for**:
  - Build status: "Building" → "Ready"
  - No build errors

---

## 🧪 **TESTING GUIDE**

### **Step 1: Wait for Deployment** (5 minutes)
1. Check Railway dashboard - wait for "Active" status
2. Check Vercel dashboard - wait for "Ready" status
3. Check Railway logs for any startup errors

### **Step 2: Test Summaries Tab** (5 minutes)

#### **Navigate to Summaries**:
1. Go to your project
2. Click on "Lab" tab
3. Click on "Summaries" sub-tab

#### **What to Test**:
- [ ] Page loads without errors
- [ ] Click "Regenerate" button
- [ ] Wait for summary to generate (10-30 seconds)
- [ ] **NEW**: Check for "Research Journey" section
- [ ] **NEW**: Check for "Correlation Map" section
- [ ] **NEW**: Check for decision rationales in timeline
- [ ] **NEW**: Check that next steps include "rationale" and "closes_loop"
- [ ] Verify "Last updated" timestamp appears
- [ ] Reload page - verify summary persists (cache works)

#### **What to Look For**:
✅ **Research Journey Timeline**:
- Chronological list of events (questions, hypotheses, papers, protocols, experiments, decisions)
- Each paper should show WHY it was triaged (AI reasoning)
- Decisions should show rationales

✅ **Correlation Map**:
- Shows Question → Hypothesis → Papers → Protocols → Experiments chains
- Identifies gaps (e.g., "No papers linked to this hypothesis yet")
- Shows orphaned papers

✅ **Enhanced Next Steps**:
- Each step should have:
  - `action`: What to do
  - `priority`: high/medium/low
  - `estimated_effort`: Time estimate
  - `rationale`: WHY this step makes sense
  - `closes_loop`: Which question/hypothesis it addresses

### **Step 3: Test Insights Tab** (5 minutes)

#### **Navigate to Insights**:
1. Go to your project
2. Click on "Analysis" tab
3. Click on "Insights" sub-tab

#### **What to Test**:
- [ ] Page loads without errors
- [ ] Click "Regenerate" button
- [ ] Wait for insights to generate (10-30 seconds)
- [ ] **NEW**: Check progress insights mention evidence chains
- [ ] **NEW**: Check gap insights identify breaks in research loop
- [ ] **NEW**: Check recommendations include "closes_loop"
- [ ] Verify "Last updated" timestamp appears
- [ ] Reload page - verify insights persist (cache works)

#### **What to Look For**:
✅ **Progress Insights**:
- Should mention which questions are well-supported
- Should identify where research is stuck
- Should reference specific Q/H/Papers

✅ **Connection Insights**:
- Should show cross-cutting themes
- Should mention which papers connect multiple hypotheses
- Should identify reinforcing elements

✅ **Gap Insights**:
- Should identify breaks in evidence chain
- Should mention what's blocking progress
- Should suggest specific actions to close gaps

✅ **Recommendations**:
- Each should have:
  - `action`: Specific action
  - `rationale`: Why it matters in research journey
  - `priority`: high/medium/low
  - `estimated_effort`: Time estimate
  - `closes_loop`: Which Q/H/gap it addresses

### **Step 4: Check Browser Console** (2 minutes)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors (red text)
4. If errors exist, copy and share them

### **Step 5: Check Railway Logs** (2 minutes)
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Look for:
   - ✅ "📦 Gathering project data with context..."
   - ✅ "🗺️ Building research journey timeline..."
   - ✅ "🔗 Building correlation map..."
   - ✅ "✅ Built journey with X events"
   - ✅ "✅ Summary generated and cached until..."
   - ❌ Any error messages

---

## 📊 **EXPECTED BEHAVIOR**

### **Before Enhancement**:
```
Summary:
- Generic overview
- List of papers
- List of protocols
- Generic next steps

Insights:
- Basic progress observations
- Simple recommendations
```

### **After Enhancement**:
```
Summary:
- 🗺️ Research Journey Timeline (chronological)
  - 2024-01-15: Question: How does X affect Y?
  - 2024-01-16: Hypothesis: X increases Y by 50%
  - 2024-01-17: Paper: "Study on X" (Score: 85/100)
    → Why: Directly addresses hypothesis about X-Y relationship
  - 2024-01-18: Protocol: "Measure X effect" (Confidence: 90%)
  - 2024-01-19: Experiment: "Test X on Y" [planned]
  
- 🔗 Correlation Map
  - Question: How does X affect Y?
    ↓ Hypothesis: X increases Y by 50%
      ↓ Evidence Papers (3):
        • Paper 1 (Score: 85/100)
          ↓ Extracted Protocols (1):
            • Protocol 1
              ↓ Experiments (1):
                • Experiment 1 [planned]
  
- Next Steps with Context:
  - Action: "Run experiment to test X effect"
    Rationale: "This will validate the hypothesis about X-Y relationship"
    Closes Loop: "Question: How does X affect Y?"

Insights:
- Progress: "Question 'How does X affect Y?' is well-supported with 3 papers and 1 protocol"
- Gap: "Hypothesis about Z lacks supporting papers - breaks evidence chain"
- Recommendation: "Search for papers on Z to close evidence gap"
  Closes Loop: "Hypothesis: Z affects outcome"
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue 1: 500 Error on Summaries/Insights**
**Symptoms**: Page shows error message
**Check**:
1. Railway logs for Python errors
2. Browser console for API errors
3. Check if it's a JSON parsing error

**Possible Causes**:
- AI returned invalid JSON (should be fixed with `response_format`)
- Database query error (check field names)
- Missing data (empty project)

### **Issue 2: No Research Journey Appears**
**Symptoms**: Summary loads but no timeline section
**Check**:
1. Railway logs - look for "Building research journey timeline..."
2. Check if project has data (questions, hypotheses, papers)

**Possible Causes**:
- Empty project (no data to build timeline)
- Error in `_build_research_journey()` method

### **Issue 3: High Token Usage**
**Symptoms**: Slow generation or high costs
**Check**:
1. Railway logs for token counts
2. Check if timeline is too long

**Solution**:
- Timeline is limited to 30 most recent events
- Papers limited to top 20
- This should keep costs reasonable

### **Issue 4: Cache Not Working**
**Symptoms**: Regenerates every time
**Check**:
1. Database - check `cache_valid_until` field
2. Railway logs - should say "Using cached summary"

**Possible Causes**:
- Cache expiry time not set correctly
- Database timezone issues

---

## 📈 **SUCCESS METRICS**

After testing, you should see:

✅ **Functionality**:
- [ ] Both tabs load without errors
- [ ] Research journey timeline appears
- [ ] Correlation map appears
- [ ] AI reasoning/rationales are included
- [ ] Next steps include "closes_loop"
- [ ] Cache works (persists on reload)

✅ **Quality**:
- [ ] AI understands research progression
- [ ] Recommendations are context-aware
- [ ] Gaps in evidence are identified
- [ ] Timeline shows evolution over time

✅ **Performance**:
- [ ] Generation takes 10-30 seconds
- [ ] Cache works (instant on reload)
- [ ] No 500 errors
- [ ] Token usage reasonable (~4000-5000 tokens)

---

## 🚀 **NEXT STEPS AFTER TESTING**

### **If Everything Works** ✅:
1. Celebrate! 🎉
2. Use the feature with real projects
3. Gather feedback on AI quality
4. Move to Phase 2 (Protocol-Paper Correlation + Visualization)

### **If Issues Found** ❌:
1. Share error messages from:
   - Browser console
   - Railway logs
   - Screenshots of issues
2. I'll debug and fix immediately
3. Redeploy and retest

---

**Status**: 🚀 **READY FOR TESTING**  
**Estimated Testing Time**: 20 minutes  
**Expected Result**: Dramatically improved AI quality with full context awareness

