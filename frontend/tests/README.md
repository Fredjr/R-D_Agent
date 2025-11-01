# Phase 1 Week 1 - End-to-End Testing Suite

Comprehensive testing suite for Phase 1 Week 1 implementation, covering all changes from UI to backend.

## 📋 What's Being Tested

### Task 1: Enable Network View & Rename Tabs
- ✅ All 4 tabs are present and functional
- ✅ Tab names are correct (Research Question, Explore Papers, My Collections, Notes & Ideas)
- ✅ Tab navigation works correctly
- ✅ Network view is enabled and accessible

### Task 2: Create Research Question Tab
- ✅ Research Question section displays correctly
- ✅ Quick stats cards show project metrics
- ✅ Edit functionality is available
- ✅ Project metadata is displayed
- ✅ Research question can be updated via API

### Task 3: Create Notes Tab
- ✅ Notes list displays correctly
- ✅ Search functionality works
- ✅ Filter by note type (general, finding, hypothesis, question, todo, comparison, critique)
- ✅ Filter by priority (low, medium, high, critical)
- ✅ Filter by status (active, resolved, archived)
- ✅ Filter by view mode (all, project, collection, paper)
- ✅ Quick stats cards show note distribution
- ✅ Hierarchical note structure (project → collection → paper)

### Task 4: Create Explore Tab
- ✅ PubMed search bar is present
- ✅ Quick search suggestions work
- ✅ Network view renders correctly
- ✅ Help section is displayed
- ✅ Search integration with backend

## 🚀 Running the Tests

### Option 1: Node.js Test Runner (Backend + API Tests)

**Requirements:**
- Node.js 18+ (for native fetch support)
- Access to backend API

**Run:**
```bash
cd frontend/tests
node run-phase1-tests.js
```

Or add to `package.json`:
```json
{
  "scripts": {
    "test:phase1": "node tests/run-phase1-tests.js"
  }
}
```

Then run:
```bash
npm run test:phase1
```

### Option 2: Browser Console Test (UI + Frontend Tests)

**Steps:**
1. Navigate to your project page:
   ```
   https://frontend-psi-seven-85.vercel.app/project/[your-project-id]
   ```

2. Open browser console:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Enable Developer menu, then press `Cmd+Option+C`

3. Copy the entire contents of `phase1-week1-browser-test.js`

4. Paste into console and press Enter

5. Watch the tests run and see results!

### Option 3: Manual Testing Checklist

Use the checklist below to manually verify each feature:

#### Research Question Tab
- [ ] Navigate to Research Question tab
- [ ] Verify research question is displayed
- [ ] Click Edit button
- [ ] Modify research question
- [ ] Click Save
- [ ] Verify changes are saved
- [ ] Check quick stats cards show correct counts
- [ ] Verify project metadata is displayed

#### Explore Papers Tab
- [ ] Navigate to Explore Papers tab
- [ ] Verify PubMed search bar is visible
- [ ] Enter a search query (e.g., "machine learning")
- [ ] Click Search button
- [ ] Verify search results appear
- [ ] Click a quick search suggestion
- [ ] Verify network view is displayed
- [ ] Try navigating the network (Similar Work, Earlier Work, Later Work)
- [ ] Verify help section is visible

#### My Collections Tab
- [ ] Navigate to My Collections tab
- [ ] Verify collections are displayed
- [ ] Click Create Collection button
- [ ] Create a new collection
- [ ] Add papers to collection
- [ ] Verify collection appears in list

#### Notes & Ideas Tab
- [ ] Navigate to Notes & Ideas tab
- [ ] Verify notes list is displayed
- [ ] Use search bar to search notes
- [ ] Click Filter button
- [ ] Filter by note type
- [ ] Filter by priority
- [ ] Filter by status
- [ ] Filter by view mode
- [ ] Verify filtered results are correct
- [ ] Check quick stats cards
- [ ] Create a new note
- [ ] Verify note appears in list

## 📊 Test Coverage

### Backend API Tests (35+ tests)
- Health checks
- Authentication
- Project CRUD operations
- Collection management
- Annotation CRUD operations
- Annotation filtering (type, priority, status)
- Network APIs
- PubMed search
- Article details
- Citations and references

### Frontend UI Tests (30+ tests)
- Tab navigation
- Component rendering
- Form interactions
- Filter functionality
- Search functionality
- Data display
- Responsive design

### Integration Tests (10+ tests)
- End-to-end workflows
- Hierarchical data structure
- Cross-component interactions
- API + UI integration

**Total: 75+ automated tests**

## ✅ Success Criteria

The test suite checks the following success criteria:

1. **All 4 tabs functional** - All tabs are clickable and display correct content
2. **Network view enabled** - Explore Papers tab shows network visualization
3. **Notes filtering works** - All filter options work correctly
4. **Research question editable** - Can update research question via UI
5. **No critical errors** - Less than 5 failed tests
6. **Backend APIs working** - All API endpoints respond correctly
7. **UI components render** - All components display without errors

### Passing Threshold
- **Minimum:** 90% of tests passing (68/75)
- **Target:** 95% of tests passing (71/75)
- **Ideal:** 100% of tests passing (75/75)

## 🐛 Troubleshooting

### Node.js Tests Fail with "fetch is not defined"
**Solution:** Upgrade to Node.js 18+ or install node-fetch:
```bash
npm install node-fetch
```

Then modify the test file to import fetch:
```javascript
import fetch from 'node-fetch';
global.fetch = fetch;
```

### Browser Tests Show "Cannot read property" errors
**Solution:** Make sure you're on a project page with a valid project ID in the URL.

### API Tests Fail with 401 Unauthorized
**Solution:** Update the `TEST_USER_EMAIL` in the test file to match your user account.

### Tests Timeout
**Solution:** Increase wait times in the test file or check your internet connection.

### Network View Not Found
**Solution:** Make sure you're testing on the deployed Vercel version, not localhost.

## 📝 Test Results Interpretation

### Green ✓ - Test Passed
The feature works as expected. No action needed.

### Red ✗ - Test Failed
The feature is not working correctly. Review the error message and fix the issue.

### Yellow ⚠ - Warning
The test passed but with caveats. Review the warning message.

## 🔄 Continuous Testing

### After Each Deployment
1. Run the Node.js test suite
2. Run the browser test suite
3. Review any failures
4. Fix issues before proceeding

### Before Moving to Week 2
1. Ensure all success criteria are met
2. All tests should be passing (or 95%+)
3. No critical bugs or regressions
4. User acceptance testing complete

## 📈 Next Steps

Once all tests pass and success criteria are met:

1. ✅ Mark Phase 1 Week 1 as complete
2. 🎉 Celebrate the milestone!
3. 📋 Review Week 2 requirements
4. 🚀 Begin Phase 1 Week 2 implementation

## 🤝 Contributing

When adding new features:
1. Add corresponding tests to the test suite
2. Update this README with new test coverage
3. Ensure all existing tests still pass
4. Document any new success criteria

## 📞 Support

If you encounter issues with the test suite:
1. Check the troubleshooting section above
2. Review the test output for specific error messages
3. Verify your environment meets the requirements
4. Check that backend and frontend are both deployed and accessible

---

**Happy Testing! 🧪**

