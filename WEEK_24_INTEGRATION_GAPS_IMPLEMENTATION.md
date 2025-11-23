# Week 24: Integration Gaps Implementation Plan

## 🎯 **OBJECTIVE**

Implement the 3 most critical integration gaps to connect AI research flow with user organization features:

1. **Gap 1**: Collections Orphaned from AI Research Flow 🔴 CRITICAL
2. **Gap 2**: Notes Disconnected from Evidence Chain 🔴 CRITICAL  
3. **Gap 3**: Network Tree Blind to Research Context 🟡 HIGH

---

## 🚨 **LESSONS LEARNED FROM EXPERIMENT PLANNER REGRESSION**

### **What Went Wrong:**
1. ❌ Multi-agent system generated LESS detail than legacy
2. ❌ No validation before deployment
3. ❌ No A/B testing
4. ❌ No output quality comparison

### **What We'll Do Differently:**
1. ✅ **Validate output quality** - Compare before/after
2. ✅ **Feature flags** - Deploy behind flags
3. ✅ **Incremental rollout** - One feature at a time
4. ✅ **Regression tests** - Automated quality checks
5. ✅ **No AI changes** - Only data integration (zero token cost)

---

## 📋 **IMPLEMENTATION ORDER**

### **Phase 1: Gap 1 - Collections + Hypotheses (Days 1-3)** 🔴

**Problem**: Collections have NO IDEA about triage results, hypotheses, or research context.

**Solution**: Link collections to hypotheses and auto-suggest collections during triage.

**Database Changes**:
```sql
-- Add to collections table
ALTER TABLE collections ADD COLUMN linked_hypothesis_ids TEXT[] DEFAULT '{}';
ALTER TABLE collections ADD COLUMN auto_suggested BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN suggestion_reason TEXT;
```

**API Changes**:
1. `POST /api/collections` - Accept `linked_hypothesis_ids` parameter
2. `GET /api/collections/project/{project_id}/suggestions` - New endpoint for auto-suggestions
3. `GET /api/collections/project/{project_id}` - Include hypothesis info in response

**Frontend Changes**:
1. Show "Suggested Collections" in Smart Inbox after triage
2. Add "Link to Hypothesis" dropdown in collection creation modal
3. Show hypothesis badges on collection cards
4. Filter collections by hypothesis

**Success Criteria**:
- ✅ Collections can be linked to hypotheses
- ✅ Auto-suggestions appear after triage
- ✅ Filter collections by hypothesis works
- ✅ No regression in collection creation
- ✅ Existing collections still work

---

### **Phase 2: Gap 2 - Notes + Evidence (Days 4-5)** 🔴

**Problem**: Notes don't reference AI-extracted evidence, causing duplicate work.

**Solution**: Link notes to evidence excerpts and pre-fill notes with AI evidence.

**Database Changes**:
```sql
-- Add to annotations table (already has research_question field)
ALTER TABLE annotations ADD COLUMN linked_evidence_excerpt_id TEXT;
ALTER TABLE annotations ADD COLUMN evidence_quote TEXT;
ALTER TABLE annotations ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
```

**API Changes**:
1. `POST /api/annotations` - Accept `linked_evidence_excerpt_id` parameter
2. `GET /api/annotations/article/{pmid}` - Include evidence info in response
3. `POST /api/annotations/from-evidence` - New endpoint to create note from evidence

**Frontend Changes**:
1. Show "Add Note" button next to each evidence excerpt in triage view
2. Pre-fill note content with evidence quote
3. Show evidence badge on note cards
4. Link note to evidence excerpt in database

**Success Criteria**:
- ✅ Notes can be linked to evidence excerpts
- ✅ "Add Note" button appears next to evidence
- ✅ Note content pre-filled with evidence quote
- ✅ No regression in note creation
- ✅ Existing notes still work

---

### **Phase 3: Gap 3 - Network + Context (Days 6-7)** 🟡

**Problem**: Network tree doesn't show triage scores, protocol status, or hypothesis links.

**Solution**: Enhance network visualization with research context.

**Database Changes**:
```sql
-- No database changes needed - all data already exists
```

**API Changes**:
1. `GET /api/articles/{pmid}/citations-network` - Include triage scores in response
2. `GET /api/articles/{pmid}/citations-network` - Include protocol status in response
3. `GET /api/articles/{pmid}/citations-network` - Include hypothesis links in response

**Frontend Changes**:
1. Color-code network nodes by triage relevance score:
   - Red: must_read (70-100)
   - Yellow: nice_to_know (40-69)
   - Gray: ignore (0-39)
2. Add badges for protocol extraction status
3. Add filter: "Show only papers supporting Hypothesis X"
4. Add tooltip showing triage score and affected hypotheses

**Success Criteria**:
- ✅ Network nodes color-coded by relevance
- ✅ Protocol status badges visible
- ✅ Filter by hypothesis works
- ✅ Tooltip shows triage info
- ✅ No regression in network rendering

---

## 🧪 **TESTING STRATEGY**

### **1. Unit Tests**
- Test each API endpoint independently
- Mock dependencies
- Test edge cases

### **2. Integration Tests**
- Test full workflow end-to-end
- Test with real data
- Test error handling

### **3. Regression Tests**
- Compare output before/after
- Ensure no fields are missing
- Ensure existing features still work

### **4. User Acceptance Tests**
- Test with real user workflows
- Get feedback on UX
- Iterate based on feedback

---

## 📊 **SUCCESS METRICS**

### **Phase 1: Collections + Hypotheses**
- ✅ 100% of collections can be linked to hypotheses
- ✅ Auto-suggestions appear within 1s after triage
- ✅ Filter by hypothesis returns correct results
- ✅ 0 regressions in collection creation

### **Phase 2: Notes + Evidence**
- ✅ 100% of notes can be linked to evidence
- ✅ "Add Note" button appears next to all evidence
- ✅ Note content pre-filled correctly
- ✅ 0 regressions in note creation

### **Phase 3: Network + Context**
- ✅ 100% of network nodes color-coded correctly
- ✅ Protocol badges visible on all nodes with protocols
- ✅ Filter by hypothesis works correctly
- ✅ 0 regressions in network rendering

---

## 🚀 **DEPLOYMENT STRATEGY**

1. **Feature flags OFF by default**
2. **Test in development** thoroughly
3. **Enable for single user** (fredericle75019@gmail.com)
4. **Validate output quality**
5. **Enable for all users** if successful
6. **Monitor and iterate**

---

## 🎯 **NEXT STEPS**

1. **Enable feature flags on Railway**:
   ```bash
   # Via Railway Dashboard:
   # 1. Go to project settings → Variables
   # 2. Add: AUTO_EVIDENCE_LINKING=true
   # 3. Add: AUTO_HYPOTHESIS_STATUS=true
   # 4. Add: ENABLE_COLLECTIONS_HYPOTHESES=false (default)
   # 5. Add: ENABLE_NOTES_EVIDENCE=false (default)
   # 6. Add: ENABLE_NETWORK_CONTEXT=false (default)
   ```

2. **Start with Phase 1** (Collections + Hypotheses)
3. **Deploy and validate** before moving to Phase 2
4. **Monitor metrics** continuously

---

**Last Updated**: 2025-11-23  
**Status**: ⏳ AWAITING FEATURE FLAG ENABLEMENT, READY TO IMPLEMENT

