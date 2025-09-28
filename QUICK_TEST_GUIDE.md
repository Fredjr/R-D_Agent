# 🧪 Quick Test Guide - R&D Agent Semantic Features

## 🚀 Pre-Test Setup
1. **Open Browser**: Navigate to https://frontend-psi-seven-85.vercel.app
2. **Open Developer Tools**: Press F12 and go to Console tab
3. **Clear Console**: Click clear button to start fresh
4. **Ensure Backend**: Verify backend is running at https://r-dagent-production.up.railway.app

## 🔍 Test 1: Semantic Discovery Interface

### Step 1: Navigate to Discover Page
```
URL: https://frontend-psi-seven-85.vercel.app/discover
Expected Log: 🔍 SemanticDiscoveryInterface rendering with activeMode: recommendations
```

**✅ Verification Checklist:**
- [ ] Purple gradient header with "🔍 Semantic Discovery" is visible
- [ ] Four mode buttons are present: Recommendations, Semantic Search, Cross-Domain, Smart Filters
- [ ] Default mode is "Recommendations" (highlighted)

### Step 2: Test Semantic Search
```
1. Click "Semantic Search" button
2. Enter query: "machine learning drug discovery"
3. Set similarity threshold to 0.8
4. Enable "Include Related Concepts"
5. Click "Search" button

Expected Logs:
🔍 Semantic search initiated with query: machine learning drug discovery
🎯 Search options: {semantic_expansion: true, similarity_threshold: 0.8, ...}
📊 Executing semantic search with query object: {...}
📊 Search results: 5+ papers found (should be > 0)
✅ Semantic search completed

✅ FIXED: PubMed API endpoint now supports POST requests
✅ WORKING: Smart Recommendations section should populate with results
```

**✅ Verification Checklist:**
- [ ] Search interface appears when mode is selected
- [ ] Search executes without console errors
- [ ] Results appear in the recommendations sections below
- [ ] Loading states work correctly

### Step 3: Test Smart Filters
```
1. Click "Smart Filters" button
2. Set minimum similarity score: 0.7
3. Select domains: "Oncology", "Pharmacology"
4. Set citation count minimum: 10
5. Set year range: 2022-2024
6. Click "Apply Filters"

Expected Logs:
🎯 Applying semantic filters with criteria: {...}
📊 Filtered papers: [results]
```

**✅ Verification Checklist:**
- [ ] Filter interface appears with all controls
- [ ] All sliders and selectors work
- [ ] Filtered results appear
- [ ] Filter criteria are applied correctly

### Step 4: Test Cross-Domain Discovery
```
1. Click "Cross-Domain" button
2. Select: "Neuroscience", "Genetics", "Bioengineering"
3. Click "Explore Connections"

Expected Logs:
🌐 Cross-domain exploration for domains: [...]
🔗 Cross-domain connections found: [results]
```

**✅ Verification Checklist:**
- [ ] Domain selection interface appears
- [ ] Multiple domains can be selected
- [ ] Cross-domain results are displayed
- [ ] Connections between domains are shown

## 📚 Test 2: Collections Management

### Step 1: Navigate to Collections
```
URL: https://frontend-psi-seven-85.vercel.app/collections
Expected Log: 📚 Collections page loaded
```

**✅ Verification Checklist:**
- [ ] Collections page loads without errors
- [ ] Enhanced collection navigation is visible
- [ ] "New Collection" button is present
- [ ] Collections from all projects are displayed

### Step 2: Test Collection Interactions
```
1. Click on any collection card
2. Try "Network View" button
3. Try "Articles List" button

Expected Logs:
Selected collection: {...}
Network view for collection: {...}
Articles list for collection: {...}
```

**✅ Verification Checklist:**
- [ ] Collection selection works
- [ ] Network view navigation works
- [ ] Articles list navigation works
- [ ] All interactions are logged

## 📊 Test 3: Project Dashboard

### Step 1: Navigate to Projects Dashboard
```
URL: https://frontend-psi-seven-85.vercel.app/dashboard
Expected Log: 📊 Dashboard page initialized
```

**✅ Verification Checklist:**
- [ ] Dashboard loads with project grid
- [ ] "New Project" button is visible
- [ ] Existing projects are displayed (if any)

### Step 2: Test Project Creation
```
1. Click "New Project" button
2. Fill form:
   - Name: "Test Semantic Integration"
   - Description: "Testing semantic features"
3. Click "Create Project"

Expected Logs:
🔄 Creating project in Google Cloud SQL database...
✅ Project created successfully with ID: [project-id]
🎯 Project details: {...}
```

**✅ Verification Checklist:**
- [ ] Project creation modal appears
- [ ] Form validation works
- [ ] Project is created successfully
- [ ] New project appears in grid
- [ ] Project has correct details

### Step 3: Test Project Navigation
```
1. Click on the newly created project
2. Verify navigation to project dashboard

Expected Logs:
🎯 Navigating to project: [project-id]
📊 Project dashboard loaded
```

**✅ Verification Checklist:**
- [ ] Navigation works correctly
- [ ] Project dashboard loads
- [ ] All project sections are visible
- [ ] URL contains correct project ID

## 🔄 Test 4: Integration Tests

### Step 1: Cross-Page State Management
```
1. Set filters in Semantic Discovery (/discover)
2. Navigate to Collections (/collections)
3. Return to Discover (/discover)
4. Verify filters are preserved

Expected Logs:
💾 Saving semantic discovery state
🔄 Restoring semantic discovery state
```

### Step 2: End-to-End Workflow
```
1. Use Semantic Discovery to find papers
2. Create a new project based on findings
3. Navigate to project dashboard
4. Verify semantic context is preserved

Expected Logs:
🔍 Semantic discovery results: [papers]
🆕 Creating project from semantic discovery
🎯 Semantic context preserved in project
```

## 🚨 Common Issues & Troubleshooting

### Issue 1: Semantic Discovery Interface Not Visible
**Solution**: 
- Check console for rendering logs
- Verify component is imported correctly
- Check for CSS conflicts

### Issue 2: API Calls Failing
**Solution**:
- Verify backend is running
- Check network tab for failed requests
- Verify API endpoints are accessible

### Issue 3: State Not Persisting
**Solution**:
- Check localStorage in browser dev tools
- Verify session management
- Check for navigation errors

### Issue 4: Mobile Layout Issues
**Solution**:
- Test with device emulation
- Check responsive breakpoints
- Verify touch interactions

## 📊 Expected Console Log Summary

During successful testing, you should see these log patterns:
- `🔍` - Semantic Discovery operations
- `📚` - Collections management
- `📊` - Dashboard and project operations
- `🎯` - Data processing and filtering
- `✅` - Successful operations
- `❌` - Error conditions (should be minimal)
- `⏳` - Loading states
- `🔄` - State changes and navigation

## 🎯 Success Criteria

**All tests pass if:**
- [ ] No console errors during normal operation
- [ ] All UI components render correctly
- [ ] User interactions work as expected
- [ ] Data persists across navigation
- [ ] Mobile responsiveness works
- [ ] API integrations function properly
- [ ] Real-time analytics track user actions

## 📱 Mobile Testing

**Additional mobile-specific tests:**
- [ ] Touch interactions work on all buttons
- [ ] Semantic Discovery Interface adapts to mobile
- [ ] Collections grid is mobile-friendly
- [ ] Project dashboard is responsive
- [ ] Bottom navigation works correctly

## 🔧 Performance Testing

**Check for:**
- [ ] Fast page load times
- [ ] Smooth animations and transitions
- [ ] No memory leaks in console
- [ ] Efficient API call patterns
- [ ] Proper loading state management
