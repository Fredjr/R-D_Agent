# Week 24: Critical Features Implementation Plan

## 🎯 **LESSONS LEARNED FROM EXPERIMENT PLANNER REGRESSION**

### **What Went Wrong:**
1. ❌ Multi-agent system generated LESS detail than legacy system
2. ❌ 5 critical fields were completely empty
3. ❌ No validation to ensure output quality matched legacy
4. ❌ No A/B testing before full deployment

### **What We'll Do Differently:**
1. ✅ **Validate output quality** - Compare new vs old, ensure >= same detail
2. ✅ **Feature flags** - Deploy behind flags, test thoroughly before enabling
3. ✅ **Comprehensive testing** - Test all edge cases, compare outputs
4. ✅ **Incremental rollout** - One feature at a time, validate each
5. ✅ **Regression tests** - Automated tests to catch quality degradation

---

## 📋 **IMPLEMENTATION ORDER**

### **Phase 1: Quick Wins (Day 1)** ⚡
1. Show evidence count badges on hypotheses (30 min)
2. Add "Last updated" timestamps everywhere (1 hour)
3. Improve error messages with actionable guidance (2 hours)
4. Add loading states for all async operations (2 hours)

**Total: 5.5 hours | Risk: LOW | Impact: HIGH**

---

### **Phase 2: Tables & Figures Display (Days 2-3)** 🖼️
1. Add PDF fields to inbox API response
2. Verify migration 011 ran on Railway
3. Fix frontend rendering for base64 images
4. Add "Re-extract PDF" button in UI

**Success Criteria:**
- ✅ All papers with PDF data show tables/figures in UI
- ✅ Base64 images render correctly
- ✅ Re-extract button works and shows progress
- ✅ No performance degradation (< 2s load time)

**Testing:**
- Test with paper that has tables (PMID: 35650602)
- Test with paper that has figures
- Test with paper that has both
- Test with paper that has neither
- Test re-extraction flow

---

### **Phase 3: Auto Evidence Linking (Days 4-6)** 🔗
1. Create evidence linking service
2. Auto-create hypothesis_evidence records after triage
3. Update evidence counts automatically
4. Add feature flag: `AUTO_EVIDENCE_LINKING`

**Success Criteria:**
- ✅ Evidence links created automatically after triage
- ✅ Evidence counts updated correctly
- ✅ No duplicate evidence links
- ✅ User can still manually add/edit evidence
- ✅ Evidence quality >= manual linking

**Testing:**
- Test with paper that supports hypothesis
- Test with paper that contradicts hypothesis
- Test with paper that provides context
- Test with paper that's not relevant
- Test duplicate prevention
- Compare auto-linked vs manually-linked evidence quality

---

### **Phase 4: Auto Hypothesis Status Updates (Days 7-8)** 📊
1. Define evidence thresholds
2. Create status update service
3. Auto-update status when evidence added
4. Add feature flag: `AUTO_HYPOTHESIS_STATUS`

**Success Criteria:**
- ✅ Status updates automatically based on evidence
- ✅ Confidence level calculated correctly
- ✅ User can override with explanation
- ✅ Status history tracked
- ✅ No false positives (wrong status)

**Testing:**
- Test with 0 evidence (should stay "proposed")
- Test with 1-2 supporting (should be "testing")
- Test with 3+ supporting (should be "supported")
- Test with 3+ contradicting (should be "rejected")
- Test with mixed evidence (should be "inconclusive")
- Test user override

---

### **Phase 5: Smart Recommendations (Days 9-14)** 🤖
1. Create recommendations service
2. Implement paper recommendations
3. Implement experiment recommendations
4. Add feature flag: `SMART_RECOMMENDATIONS`

**Success Criteria:**
- ✅ Recommendations are relevant (>80% user acceptance)
- ✅ Recommendations update in real-time
- ✅ No duplicate recommendations
- ✅ Performance < 1s for recommendations
- ✅ User can dismiss/hide recommendations

**Testing:**
- Test with new project (no data)
- Test with project with papers only
- Test with project with hypotheses only
- Test with project with experiments
- Test recommendation quality (manual review)

---

## 🧪 **TESTING STRATEGY**

### **1. Unit Tests**
- Test each service function independently
- Mock dependencies
- Test edge cases

### **2. Integration Tests**
- Test full workflow end-to-end
- Test with real data
- Test error handling

### **3. Regression Tests**
- Compare output quality before/after
- Ensure no fields are empty
- Ensure detail level >= legacy

### **4. Performance Tests**
- Measure response times
- Ensure < 2s for API calls
- Ensure < 1s for UI updates

### **5. User Acceptance Tests**
- Test with real user workflows
- Get feedback on quality
- Iterate based on feedback

---

## 🚨 **ROLLBACK PLAN**

If any feature causes issues:
1. **Disable feature flag** immediately
2. **Investigate root cause** in logs
3. **Fix issue** in development
4. **Re-test thoroughly** before re-enabling
5. **Document issue** and prevention

---

## 📊 **SUCCESS METRICS**

### **Phase 1: Quick Wins**
- ✅ Evidence badges visible on all hypotheses
- ✅ Timestamps visible on all entities
- ✅ Error messages are actionable
- ✅ Loading states show for all async ops

### **Phase 2: Tables & Figures**
- ✅ 100% of papers with PDF data show tables/figures
- ✅ 0 rendering errors
- ✅ < 2s load time

### **Phase 3: Auto Evidence Linking**
- ✅ 100% of relevant evidence auto-linked
- ✅ 0 duplicate links
- ✅ Evidence quality score >= 8/10

### **Phase 4: Auto Hypothesis Status**
- ✅ 100% of hypotheses have correct status
- ✅ 0 false positives
- ✅ Status updates within 1s

### **Phase 5: Smart Recommendations**
- ✅ >80% user acceptance rate
- ✅ < 1s recommendation generation
- ✅ >90% relevance score

---

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Before Starting Each Phase:**
- [ ] Review success criteria
- [ ] Create feature flag
- [ ] Write tests first (TDD)
- [ ] Document expected behavior

### **During Implementation:**
- [ ] Follow existing patterns
- [ ] Add comprehensive logging
- [ ] Handle all error cases
- [ ] Test incrementally

### **After Implementation:**
- [ ] Run all tests
- [ ] Compare output quality
- [ ] Test with real data
- [ ] Get user feedback
- [ ] Document changes

---

## 📝 **NEXT STEPS**

1. **Start with Phase 1** (Quick Wins) - Low risk, high impact
2. **Deploy and validate** each phase before moving to next
3. **Monitor metrics** continuously
4. **Iterate based on feedback**

Let's begin! 🚀

