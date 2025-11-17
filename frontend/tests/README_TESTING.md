# 🧪 Comprehensive Network View Test Suite

## Overview

This test suite provides **exhaustive testing** of ALL phases of the Network View development, from Phase 1 (Foundation) to the latest features. It tests:

- ✅ **JSON Data Structures** from all API endpoints
- ✅ **UI Rendering** of all components
- ✅ **Functionality** of all buttons and interactions
- ✅ **Visual Quality** (colors, gradients, edges)
- ✅ **Performance** (load times, responsiveness)
- ✅ **Error Handling** (graceful failures)

---

## 📋 What Gets Tested

### Phase 1: Foundation
- PubMed Network API returns valid data
- Network has minimum required nodes (>= 5)
- Network has edges between nodes (>= 4)
- Nodes have required metadata (pmid, title, authors, year)
- Edges have relationship types (citation, reference, similarity)

### Phase 1.3A: Edge Visualization
- Edges have correct colors based on relationship
- Edges have labels showing relationship type
- Edge legend is visible in UI

### Phase 1.3B: Three-Panel Layout
- Left panel (Paper List) is rendered
- Center panel (Network Graph) is rendered
- Right panel (Paper Details) is rendered
- Layout adapts to screen size

### Phase 1.4: Similar Work
- Similar Work button is rendered
- Similar Work API returns valid data
- Similar Work button adds nodes to graph

### Phase 1.5: Earlier/Later Work
- Earlier Work button is rendered
- Later Work button is rendered
- References API returns valid data
- Citations API returns valid data

### Cross-Reference Detection
- PubMed eLink API is accessible
- Initial graph has cross-reference edges
- Graph displays cross-reference edges

### Node Gradient Colors
- Nodes have gradient colors based on publication year
- Recent papers have darker blue color
- Old papers have lighter blue color

### Responsive Design
- Sidebar font sizes are readable (>= 14px)
- Network view width adapts to screen size
- Buttons have adequate touch targets

### Multi-Column Network View
- Multi-column container is rendered
- New columns can be created via exploration
- Columns have descriptive titles

### Button Behavior
- All References button shows list only (not column)
- All Citations button shows list only (not column)

### Performance
- Initial graph loads within 5 seconds
- Graph interactions are responsive
- API responses are cached

### Error Handling
- Handles paper with no citations gracefully
- Handles invalid PMID gracefully
- UI shows error messages when API fails

---

## 🚀 How to Run Tests

### Method 1: Full Test Suite (Recommended)

1. **Open the Network View page**:
   ```
   https://r-d-agent-xcode.vercel.app/explore/network?pmid=41021024
   ```

2. **Open Browser Console** (F12 or Cmd+Option+I)

3. **Copy and paste the entire test script**:
   - Open `frontend/tests/comprehensive-network-test.js`
   - Copy ALL content (Cmd+A, Cmd+C)
   - Paste into console (Cmd+V)
   - Press Enter

4. **Run the tests**:
   ```javascript
   await runComprehensiveTests()
   ```

5. **Wait for results** (takes ~2-3 minutes)

6. **Review the summary**:
   - Total tests run
   - Passed/Failed counts
   - Results by phase
   - Failed test details

---

### Method 2: Quick Tests (Individual Phases)

If you want to test specific areas quickly:

#### Test API Endpoints Only
```javascript
await quickTestAPI()
```

#### Test UI Rendering Only
```javascript
await quickTestUI()
```

#### Test Button Functionality Only
```javascript
await quickTestButtons()
```

#### Test Node/Edge Colors Only
```javascript
await quickTestColors()
```

---

## 📊 Understanding Test Results

### Console Output

The test suite provides detailed console output:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║   🧪 COMPREHENSIVE NETWORK VIEW TEST SUITE                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

================================================================================
🧪 TESTING PHASE: PHASE 1: FOUNDATION
================================================================================

🔍 Testing: PubMed Network API returns valid data
✅ PASSED (234ms): PubMed Network API returns valid data
   Details: Received 15234 bytes

🔍 Testing: Network has minimum required nodes
✅ PASSED (189ms): Network has minimum required nodes
   Details: Found 16 nodes

...

================================================================================
📊 TEST SUMMARY
================================================================================
Total Tests: 45
✅ Passed: 42 (93.3%)
❌ Failed: 3 (6.7%)
⏭️  Skipped: 0
================================================================================

📈 Results by Phase:
   PHASE 1: FOUNDATION: 5/5 (100.0%)
   PHASE 1.3A: EDGE VISUALIZATION: 3/3 (100.0%)
   PHASE 1.3B: THREE-PANEL LAYOUT: 4/4 (100.0%)
   ...

❌ Failed Tests:
   - PHASE 1.4: SIMILAR WORK - Similar Work button adds nodes to graph
     Reason: No nodes were added
```

### Test Result Object

Results are saved to `window.testResults`:

```javascript
{
  total: 45,
  passed: 42,
  failed: 3,
  skipped: 0,
  tests: [
    {
      id: "PHASE 1: FOUNDATION - PubMed Network API returns valid data",
      name: "PubMed Network API returns valid data",
      phase: "PHASE 1: FOUNDATION",
      passed: true,
      duration: 234,
      details: "Received 15234 bytes",
      data: { ... }
    },
    ...
  ]
}
```

### Exporting Results

To export results as JSON:

```javascript
// Copy to clipboard
copy(JSON.stringify(window.testResults, null, 2))

// Or download as file
const blob = new Blob([JSON.stringify(window.testResults, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'network-test-results.json';
a.click();
```

---

## 🔧 Test Configuration

You can modify test parameters in the `TEST_CONFIG` object:

```javascript
const TEST_CONFIG = {
  // Test PMIDs
  TEST_PMID_MAIN: '41021024',        // Main test paper
  TEST_PMID_SECONDARY: '40800212',   // Secondary test paper
  TEST_PMID_NO_CITATIONS: '38869512', // Paper with no citations
  
  // Expected values
  MIN_NODES_INITIAL_GRAPH: 5,
  MIN_EDGES_INITIAL_GRAPH: 4,
  
  // Timeouts
  API_TIMEOUT: 10000,
  RENDER_TIMEOUT: 5000,
};
```

---

## 🐛 Troubleshooting

### "Cytoscape instance not found"

**Problem**: Tests can't find the graph instance.

**Solution**:
1. Make sure you're on the `/explore/network` page
2. Wait for the graph to fully load before running tests
3. Check if the graph is visible on screen

### "Element not found after timeout"

**Problem**: UI elements aren't rendering.

**Solution**:
1. Refresh the page
2. Make sure you're logged in (if required)
3. Check browser console for errors

### "Test timeout"

**Problem**: Test is taking too long.

**Solution**:
1. Check your internet connection
2. Increase timeout in test configuration
3. Run quick tests instead of full suite

### "API returns 500 error"

**Problem**: Backend is down or having issues.

**Solution**:
1. Check backend health: https://r-dagent-production.up.railway.app/health
2. Try a different test PMID
3. Wait a few minutes and try again

---

## 📝 Adding New Tests

To add new tests, follow this pattern:

```javascript
async function testMyNewFeature(runner) {
  runner.startPhase('MY NEW FEATURE');
  
  await runner.test('Test description', async () => {
    // Your test logic here
    const result = await someAsyncOperation();
    
    if (result.isValid) {
      return {
        passed: true,
        details: 'Test passed with details'
      };
    } else {
      return {
        passed: false,
        reason: 'Why it failed',
        expected: 'What was expected',
        actual: 'What was received'
      };
    }
  });
}

// Add to main test runner
async function runComprehensiveTests() {
  // ... existing tests ...
  await testMyNewFeature(runner);
  // ...
}
```

---

## 🎯 Best Practices

1. **Run tests after every deployment** to catch regressions
2. **Run quick tests during development** for faster feedback
3. **Export results** to track test history over time
4. **Add new tests** when adding new features
5. **Update test expectations** when requirements change

---

## 📚 Related Documentation

- `PHASE_1_FINAL_SUMMARY.md` - Phase 1 implementation details
- `PHASE_1.4_DEPLOYMENT_SUMMARY.md` - Similar Work feature
- `PHASE_1.5_DEPLOYMENT_SUMMARY.md` - Earlier/Later Work feature
- `NETWORK_GRAPH_SUBSEQUENT_FIXES.md` - Cross-reference and color fixes
- `NETWORK_VIEW_RESPONSIVE_FIX.md` - Responsive design fixes

---

## 🤝 Contributing

When contributing new features:

1. Add tests for your feature
2. Run full test suite before committing
3. Update this README if adding new test categories
4. Document any new test utilities

---

**Last Updated**: 2024-12-17  
**Test Suite Version**: 1.0.0  
**Compatibility**: Chrome 90+, Firefox 88+, Safari 14+

