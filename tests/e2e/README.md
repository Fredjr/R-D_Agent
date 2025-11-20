# 🧪 COMPREHENSIVE E2E TEST SUITE - WEEKS 12-14

**Automated end-to-end testing for R&D Agent Phase 2 features**

This test suite provides comprehensive testing coverage for:
- **Week 9-10**: Smart Inbox - AI-Powered Paper Triage
- **Week 11-12**: Decision Timeline
- **Week 13-14**: Project Alerts & Notifications

---

## 📋 TEST COVERAGE

### **37 Comprehensive Tests Across 8 Test Suites**

1. **Backend API Tests** (4 tests)
   - Health check endpoint
   - Triage endpoints accessibility
   - Decisions endpoints accessibility
   - Alerts endpoints accessibility

2. **Authentication & Navigation** (2 tests)
   - Homepage loading
   - Project page navigation

3. **Smart Inbox Tests** (5 tests)
   - Inbox tab loading and paper display
   - AI triage data display
   - Action buttons (Accept/Reject/Maybe)
   - Keyboard shortcuts (J/K/A/R/M/D/B/U)
   - Batch mode toggle

4. **Decision Timeline Tests** (5 tests)
   - Timeline tab loading
   - Add Decision modal
   - Decision creation
   - Decision card display
   - Decision editing

5. **Project Alerts Tests** (9 tests)
   - Bell icon display
   - Unread count badge
   - Alerts panel opening
   - Alert statistics display
   - Alert cards display
   - Filter by type
   - Filter by severity
   - Individual alert dismissal
   - Dismiss all alerts

6. **Integration Tests** (4 tests)
   - Triage → Alert generation
   - Alert → Paper navigation
   - Main tab navigation
   - Sub-tab navigation

7. **Error Handling Tests** (5 tests)
   - Network error handling
   - Empty states
   - Loading states
   - Console errors detection
   - Failed requests detection

8. **Performance Tests** (3 tests)
   - Page load time
   - API response times
   - UI interaction responsiveness

---

## 🚀 QUICK START

### **1. Install Dependencies**

```bash
cd tests/e2e
npm install
npx playwright install
```

### **2. Set Environment Variables**

Create a `.env` file in `tests/e2e/`:

```bash
# Application URLs
TEST_URL=https://r-d-agent.vercel.app
BACKEND_URL=https://r-dagent-production.up.railway.app

# Test credentials (if needed)
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Test project ID
TEST_PROJECT_ID=your-test-project-id
```

### **3. Run Tests**

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run in debug mode
npm run test:debug

# Run with UI mode (interactive)
npm run test:ui
```

---

## 📊 RUNNING SPECIFIC TEST SUITES

```bash
# Backend API tests only
npm run test:backend

# Smart Inbox tests only
npm run test:inbox

# Decision Timeline tests only
npm run test:decisions

# Project Alerts tests only
npm run test:alerts

# Integration tests only
npm run test:integration

# Error handling tests only
npm run test:errors

# Performance tests only
npm run test:performance
```

---

## 🌐 BROWSER TESTING

```bash
# Test on Chromium (default)
npm run test:chromium

# Test on Firefox
npm run test:firefox

# Test on WebKit (Safari)
npm run test:webkit

# Test on mobile
npm run test:mobile
```

---

## 📈 VIEWING TEST REPORTS

After running tests, view the HTML report:

```bash
npm run report
```

This opens an interactive HTML report showing:
- Test results (pass/fail)
- Screenshots of failures
- Videos of failed tests
- Detailed error logs
- Performance metrics

---

## 🐛 DEBUGGING FAILED TESTS

### **Method 1: Debug Mode**

```bash
npm run test:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- Inspect elements
- View console logs
- Modify selectors

### **Method 2: Headed Mode**

```bash
npm run test:headed
```

This runs tests with the browser visible so you can see what's happening.

### **Method 3: UI Mode**

```bash
npm run test:ui
```

This opens Playwright's UI mode with:
- Test explorer
- Time travel debugging
- Watch mode
- Network inspector

---

## 📝 TEST STRUCTURE

Each test follows this pattern:

```javascript
test('Test name', async ({ page }) => {
  // 1. Setup
  logStep('What we're testing');
  
  // 2. Navigate
  await page.goto(URL);
  await waitForNetworkIdle(page);
  
  // 3. Interact
  await page.locator('button').click();
  
  // 4. Assert
  expect(result).toBeTruthy();
  
  // 5. Log result
  logStep('Test passed', 'Details');
});
```

---

## 🔍 WHAT EACH TEST CHECKS

### **Backend API Tests**
- ✅ All endpoints are accessible
- ✅ Correct HTTP status codes
- ✅ No 500 errors
- ✅ Proper error handling

### **Smart Inbox Tests**
- ✅ Papers load with AI triage data
- ✅ Relevance scores displayed
- ✅ Impact assessments shown
- ✅ Action buttons work
- ✅ Keyboard shortcuts functional
- ✅ Batch mode works

### **Decision Timeline Tests**
- ✅ Timeline displays correctly
- ✅ Can add new decisions
- ✅ Decision cards show all data
- ✅ Can edit decisions
- ✅ Modal interactions work

### **Project Alerts Tests**
- ✅ Bell icon visible
- ✅ Unread count accurate
- ✅ Panel opens/closes
- ✅ Statistics displayed
- ✅ Alert cards formatted correctly
- ✅ Filters work
- ✅ Dismiss actions work

### **Integration Tests**
- ✅ Triage generates alerts
- ✅ Alerts link to papers
- ✅ Cross-feature navigation works
- ✅ Data flows between features

### **Error Handling Tests**
- ✅ Network errors handled gracefully
- ✅ Empty states displayed
- ✅ Loading states shown
- ✅ No console errors
- ✅ No failed requests

### **Performance Tests**
- ✅ Page loads in < 10 seconds
- ✅ API responses in < 2 seconds
- ✅ UI interactions responsive

---

## 🎯 SUCCESS CRITERIA

Tests pass when:
- ✅ All 37 tests pass
- ✅ No console errors
- ✅ No failed network requests
- ✅ Performance metrics within limits
- ✅ All features accessible
- ✅ All interactions work

---

## 📞 TROUBLESHOOTING

### **Issue: Tests fail with "Timeout"**

**Solution**: Increase timeout in `playwright.config.js`:
```javascript
timeout: 120 * 1000, // 2 minutes
```

### **Issue: "Element not found"**

**Solution**: Check if:
1. Element selector is correct
2. Page has loaded completely
3. Element is visible (not hidden)

### **Issue: Authentication required**

**Solution**: 
1. Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env`
2. Implement Clerk authentication in test setup
3. Or use authenticated session storage

### **Issue: Tests pass locally but fail in CI**

**Solution**:
1. Check environment variables are set in CI
2. Increase timeouts for slower CI environment
3. Use `retries: 2` in config

---

## 📚 ADDITIONAL RESOURCES

- **Playwright Docs**: https://playwright.dev
- **Test Best Practices**: https://playwright.dev/docs/best-practices
- **Debugging Guide**: https://playwright.dev/docs/debug

---

## ✅ NEXT STEPS

After running tests:

1. **Review Results**: Check HTML report for any failures
2. **Fix Bugs**: Address any issues found
3. **Update Tests**: Add new tests for new features
4. **Run Regularly**: Integrate into CI/CD pipeline
5. **Monitor Performance**: Track metrics over time

---

**Test Suite Version**: 1.0.0  
**Last Updated**: 2025-11-20  
**Coverage**: Weeks 9-14 (Phase 2)

