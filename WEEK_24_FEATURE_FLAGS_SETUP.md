# Week 24: Feature Flags Setup Instructions

## 🚩 **FEATURE FLAGS TO ENABLE ON RAILWAY**

### **Step 1: Access Railway Dashboard**
1. Go to https://railway.app
2. Navigate to your project: `r-dagent-production`
3. Click on the backend service
4. Go to "Variables" tab

### **Step 2: Add Feature Flags**

Add the following environment variables:

```bash
# Auto Evidence Linking (Week 24 - Phase 1)
AUTO_EVIDENCE_LINKING=false

# Auto Hypothesis Status Updates (Week 24 - Phase 1)
AUTO_HYPOTHESIS_STATUS=false

# Collections + Hypotheses Integration (Week 24 - Phase 2)
ENABLE_COLLECTIONS_HYPOTHESES=false

# Notes + Evidence Integration (Week 24 - Phase 3)
ENABLE_NOTES_EVIDENCE=false

# Network + Context Integration (Week 24 - Phase 4)
ENABLE_NETWORK_CONTEXT=false
```

### **Step 3: Deploy Changes**
After adding the variables, Railway will automatically redeploy the service.

---

## 🧪 **TESTING PROCEDURE**

### **Phase 1: Test Auto Evidence Linking**

1. **Enable feature flags**:
   ```bash
   AUTO_EVIDENCE_LINKING=true
   AUTO_HYPOTHESIS_STATUS=true
   ```

2. **Run test script**:
   ```bash
   ./test_auto_evidence_linking.sh
   ```

3. **Expected results**:
   - ✅ Evidence links created automatically
   - ✅ Hypothesis status updated automatically
   - ✅ Evidence counts increase after triage
   - ✅ No duplicate evidence links

4. **Monitor Railway logs**:
   ```bash
   railway logs --tail 100
   
   # Look for:
   # 🔗 Auto-linking evidence from triage for PMID 35650602
   # ✅ Auto-linked 2 evidence links
   # ✅ Updated hypothesis ... status: proposed → testing
   ```

5. **Verify in UI**:
   - Go to Smart Inbox
   - Run AI Triage on a paper
   - Go to Questions tab
   - Check hypothesis evidence counts increased
   - Check hypothesis status updated

---

### **Phase 2: Test Collections + Hypotheses**

1. **Enable feature flag**:
   ```bash
   ENABLE_COLLECTIONS_HYPOTHESES=true
   ```

2. **Test in UI**:
   - Go to Smart Inbox
   - Run AI Triage on a paper
   - Check for "Suggested Collections" section
   - Click "Create Collection" and link to hypothesis
   - Go to Collections tab
   - Verify hypothesis badge appears on collection card
   - Filter collections by hypothesis

3. **Expected results**:
   - ✅ Auto-suggestions appear after triage
   - ✅ Collections can be linked to hypotheses
   - ✅ Filter by hypothesis works
   - ✅ Hypothesis badges visible on collection cards

---

### **Phase 3: Test Notes + Evidence**

1. **Enable feature flag**:
   ```bash
   ENABLE_NOTES_EVIDENCE=true
   ```

2. **Test in UI**:
   - Go to Smart Inbox
   - Run AI Triage on a paper
   - Click "Add Note" button next to evidence excerpt
   - Verify note content pre-filled with evidence quote
   - Save note
   - Go to Notes tab
   - Verify evidence badge appears on note card

3. **Expected results**:
   - ✅ "Add Note" button appears next to evidence
   - ✅ Note content pre-filled correctly
   - ✅ Evidence badge visible on note cards
   - ✅ Notes linked to evidence excerpts

---

### **Phase 4: Test Network + Context**

1. **Enable feature flag**:
   ```bash
   ENABLE_NETWORK_CONTEXT=true
   ```

2. **Test in UI**:
   - Go to Collections tab
   - Click "Network View" on a collection
   - Verify nodes color-coded by triage relevance:
     - Red: must_read (70-100)
     - Yellow: nice_to_know (40-69)
     - Gray: ignore (0-39)
   - Verify protocol badges visible on nodes
   - Use "Filter by Hypothesis" dropdown
   - Hover over nodes to see triage info in tooltip

3. **Expected results**:
   - ✅ Network nodes color-coded correctly
   - ✅ Protocol badges visible
   - ✅ Filter by hypothesis works
   - ✅ Tooltip shows triage info

---

## 🔄 **ROLLBACK PROCEDURE**

If any issues occur, immediately disable the feature flag:

```bash
# Disable specific feature
AUTO_EVIDENCE_LINKING=false
ENABLE_COLLECTIONS_HYPOTHESES=false
ENABLE_NOTES_EVIDENCE=false
ENABLE_NETWORK_CONTEXT=false
```

Railway will automatically redeploy with the feature disabled.

---

## 📊 **SUCCESS METRICS**

### **Phase 1: Auto Evidence Linking**
- ✅ 100% of triaged papers create evidence links
- ✅ 0 duplicate evidence links
- ✅ Hypothesis status updates correctly
- ✅ 0 errors in Railway logs

### **Phase 2: Collections + Hypotheses**
- ✅ Auto-suggestions appear within 1s after triage
- ✅ 100% of collections can be linked to hypotheses
- ✅ Filter by hypothesis returns correct results
- ✅ 0 regressions in collection creation

### **Phase 3: Notes + Evidence**
- ✅ "Add Note" button appears next to all evidence
- ✅ Note content pre-filled correctly 100% of the time
- ✅ 100% of notes can be linked to evidence
- ✅ 0 regressions in note creation

### **Phase 4: Network + Context**
- ✅ 100% of network nodes color-coded correctly
- ✅ Protocol badges visible on all nodes with protocols
- ✅ Filter by hypothesis works correctly
- ✅ 0 regressions in network rendering

---

## 🎯 **CURRENT STATUS**

- ✅ **Phase 1 Code**: Implemented and committed
- ⏳ **Phase 1 Deployment**: Awaiting feature flag enablement
- ⏳ **Phase 2 Code**: Ready to implement
- ⏳ **Phase 3 Code**: Ready to implement
- ⏳ **Phase 4 Code**: Ready to implement

---

**Next Action**: Enable `AUTO_EVIDENCE_LINKING=true` and `AUTO_HYPOTHESIS_STATUS=true` on Railway to test Phase 1.

