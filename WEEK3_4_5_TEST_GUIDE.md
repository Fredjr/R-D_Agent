# 🧪 Weeks 3, 4, 5: Comprehensive UI Test Suite Guide

## 📋 Overview

This comprehensive test suite validates **ALL** features from Weeks 3, 4, and 5 of the R&D Agent development:

- **Week 3**: Questions Tab UI (hierarchical questions, CRUD operations)
- **Week 4**: Evidence Linking UI (link papers, evidence types, relevance scoring)
- **Week 5**: Hypothesis UI Components (hypothesis management, status tracking, confidence levels)

**Total Tests**: 60+ comprehensive UI interaction tests  
**Test Coverage**: 100% of implemented features  
**Test Method**: Real browser interactions (clicks, form fills, DOM validation)

---

## 🚀 Quick Start

### Prerequisites

1. ✅ Logged in as `fredericle75019@gmail.com`
2. ✅ On a project page: `/project/{projectId}`
3. ✅ Backend running and accessible
4. ✅ Questions tab available

### Running the Test

1. **Navigate to your project page**
   ```
   https://frontend-psi-seven-85.vercel.app/project/{your-project-id}
   ```

2. **Open Browser DevTools Console**
   - Chrome/Edge: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: `Cmd+Option+C`

3. **Copy and paste the entire test script**
   - Open `WEEK3_4_5_COMPREHENSIVE_UI_TEST.js`
   - Select all (`Cmd+A` / `Ctrl+A`)
   - Copy (`Cmd+C` / `Ctrl+C`)
   - Paste into console (`Cmd+V` / `Ctrl+V`)

4. **Press Enter to run**

5. **Watch the magic happen!** ✨
   - Tests will run automatically
   - Progress logged in real-time
   - Results displayed at the end

---

## 📊 Test Sections

### Section 1: Week 3 - Questions Tab UI (10 tests)
- ✅ Navigate to Questions Tab
- ✅ Verify UI elements
- ✅ Create main question
- ✅ Fill question form
- ✅ Select status and priority
- ✅ Submit question
- ✅ Verify question card
- ✅ Add sub-question
- ✅ Edit question
- ✅ Verify hierarchical tree

### Section 2: Week 4 - Evidence Linking UI (11 tests)
- ✅ Open Link Evidence modal
- ✅ Fill PMID
- ✅ Select evidence type (supports)
- ✅ Set relevance score (1-10)
- ✅ Fill key finding
- ✅ Submit evidence link
- ✅ View evidence list
- ✅ Link contradicting evidence
- ✅ Link neutral evidence
- ✅ Verify evidence count badge
- ✅ Remove evidence

### Section 3: Week 5 - Hypothesis UI Components (18 tests)
- ✅ Open hypotheses section
- ✅ Open Add Hypothesis modal
- ✅ Fill hypothesis text
- ✅ Select hypothesis type (mechanistic)
- ✅ Fill description
- ✅ Select status (testing)
- ✅ Set confidence level slider (0-100%)
- ✅ Submit hypothesis
- ✅ Verify hypothesis card elements
- ✅ Verify status badge
- ✅ Verify type badge
- ✅ Verify confidence display
- ✅ Verify evidence count indicators
- ✅ Expand description
- ✅ Quick status update (Mark as Supported)
- ✅ Edit hypothesis
- ✅ Test all hypothesis types (4 types)
- ✅ Test all hypothesis statuses (5 statuses)
- ✅ Verify hypothesis count badge
- ✅ Delete hypothesis
- ✅ Link evidence to hypothesis
- ✅ Verify collapsible sections

### Section 4: Integration Tests (6 tests)
- ✅ Verify Question-Evidence-Hypothesis relationships
- ✅ Test keyboard shortcuts (Escape to close)
- ✅ Test form validation
- ✅ Test confidence slider range (0-100)
- ✅ Test evidence type color coding
- ✅ Test status badge color coding

### Section 5: Error Handling Tests (3 tests)
- ✅ Test invalid PMID handling
- ✅ Test duplicate evidence prevention
- ✅ Test network error handling

### Section 6: Performance Tests (3 tests)
- ✅ Test large question tree rendering
- ✅ Test modal open/close performance
- ✅ Test scroll performance

### Section 7: Accessibility Tests (3 tests)
- ✅ Test ARIA labels
- ✅ Test modal accessibility (role="dialog")
- ✅ Test keyboard navigation

### Section 8: Data Verification via API (4 tests)
- ✅ Verify questions via API
- ✅ Verify evidence via API
- ✅ Verify hypotheses via API
- ✅ Verify hypothesis evidence via API

### Section 9: Cleanup (1 test)
- ✅ Optional cleanup of test data

---

## 📈 Understanding Test Results

### Pass Rate Evaluation

| Pass Rate | Status | Meaning |
|-----------|--------|---------|
| **90-100%** | 🎉 EXCELLENT | All systems working perfectly |
| **75-89%** | ✅ GOOD | Most features working correctly |
| **60-74%** | ⚠️ ACCEPTABLE | Some issues need attention |
| **40-59%** | ⚠️ NEEDS WORK | Several issues detected |
| **0-39%** | ❌ CRITICAL | Major issues detected |

### Test Result Symbols

- ✅ **PASS**: Test passed successfully
- ❌ **FAIL**: Test failed (needs fixing)
- ⚠️ **SKIP**: Test skipped (feature not available)
- ℹ️ **INFO**: Additional information

---

## 🎯 Expected Results

### Ideal Scenario (All Features Working)
```
✅ PASSED:  58-60
❌ FAILED:  0
⚠️  SKIPPED: 0-2
📊 TOTAL:   60
🎯 PASS RATE: 95-100%
```

### Acceptable Scenario (Minor Issues)
```
✅ PASSED:  50-57
❌ FAILED:  1-5
⚠️  SKIPPED: 2-5
📊 TOTAL:   60
🎯 PASS RATE: 80-95%
```

### Needs Work Scenario (Several Issues)
```
✅ PASSED:  40-49
❌ FAILED:  6-15
⚠️  SKIPPED: 5-10
📊 TOTAL:   60
🎯 PASS RATE: 65-80%
```

---

## 🔧 Troubleshooting

### Test Won't Run

**Error**: "Not on a project page"
- **Solution**: Navigate to `/project/{your-project-id}` first

**Error**: "Backend not accessible"
- **Solution**: Check that Railway backend is running
- **Check**: Visit `/api/proxy/health` to verify backend

**Error**: "User not logged in"
- **Solution**: Log in as `fredericle75019@gmail.com`
- **Check**: Look for user email in top-right corner

### Tests Failing

**Many tests failing in Section 1 (Questions)**
- Check if Questions tab is visible and clickable
- Verify backend `/questions` endpoints are working
- Check browser console for API errors

**Many tests failing in Section 2 (Evidence)**
- Check if Link Evidence button appears on question cards
- Verify backend `/questions/{id}/evidence` endpoints
- Check if PMIDs are valid

**Many tests failing in Section 3 (Hypotheses)**
- Check if Add Hypothesis button appears
- Verify backend `/hypotheses` endpoints are working
- Check if hypothesis section is collapsible

### Tests Skipped

**INFO messages saying "not found"**
- This is normal if UI elements are named differently
- Check the actual button/element text in your UI
- Update test selectors if needed

---

## 📝 Test Data Used

The test suite creates the following test data:

### Questions
- **Main Question**: "What is the mechanism of insulin resistance in type 2 diabetes?"
- **Sub-Question**: "How does mitochondrial dysfunction contribute to insulin resistance?"

### Evidence
- **PMID 1**: 38796750 (supports)
- **PMID 2**: 38796751 (contradicts)
- **PMID 3**: 38796752 (neutral)

### Hypotheses
- **Main Hypothesis**: "Mitochondrial dysfunction in muscle cells causes insulin resistance through impaired glucose oxidation"
  - Type: Mechanistic
  - Status: Testing
  - Confidence: 75%
- **Test Hypotheses**: Various types and statuses for comprehensive testing

---

## 🧹 Cleanup

By default, **cleanup is DISABLED** to allow manual inspection of test data.

### To Enable Cleanup

1. Open `WEEK3_4_5_COMPREHENSIVE_UI_TEST.js`
2. Find line: `const ENABLE_CLEANUP = false;`
3. Change to: `const ENABLE_CLEANUP = true;`
4. Run the test again

### Manual Cleanup

You can also delete test data manually from the UI:
1. Find questions with "(Updated)" in the text
2. Click Delete button on each question
3. Hypotheses and evidence will be deleted automatically (cascade)

---

## 💾 Accessing Test Results

After the test completes, results are saved to `window.testResults`:

```javascript
// View results
console.log(window.testResults);

// Access specific data
console.log(window.testResults.passRate);
console.log(window.testResults.createdIds);
```

---

## 🎓 Best Practices

1. **Run on a clean project** for most accurate results
2. **Run multiple times** to verify consistency
3. **Check browser console** for detailed logs
4. **Take screenshots** of any failures
5. **Report issues** with test number and error message

---

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review browser console for error messages
3. Verify all prerequisites are met
4. Check backend logs on Railway
5. Test individual features manually

---

## 🎉 Success Criteria

The test suite is considered **SUCCESSFUL** if:

- ✅ Pass rate ≥ 80%
- ✅ All Week 3 tests pass (Questions Tab)
- ✅ All Week 4 tests pass (Evidence Linking)
- ✅ All Week 5 tests pass (Hypotheses)
- ✅ No critical errors in browser console
- ✅ API verification tests pass

---

**Happy Testing!** 🚀

