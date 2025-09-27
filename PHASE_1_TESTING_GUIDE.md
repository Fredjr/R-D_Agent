# Phase 1.1 & 1.2 Comprehensive Testing Guide

## Deployed Version
**Frontend URL:** https://frontend-psi-seven-85.vercel.app/
**Backend URL:** https://r-dagent-production.up.railway.app

## Phase 1.1: MeSH Autocomplete Service Testing

### Test Case 1: Basic MeSH Autocomplete Functionality
**Location:** Home Page (https://frontend-psi-seven-85.vercel.app/home)

**Steps:**
1. Navigate to the home page
2. Open browser developer console (F12)
3. Click on the search input field under "Start Your Research"
4. Type "cancer" (minimum 2 characters)
5. Wait 300ms for debounced API call

**Expected Results:**
- Console should show: `🔍 [MeSH Autocomplete] Fetching suggestions for: "cancer"`
- Console should show: `📡 [MeSH Autocomplete] API call: /api/proxy/mesh/autocomplete?q=cancer&limit=8`
- Console should show: `✅ [MeSH Autocomplete] Received X suggestions`
- Dropdown should appear with MeSH terms and trending keywords
- Should see sections: "📚 MeSH Terms" and "🔥 Trending"

### Test Case 2: MeSH Suggestion Selection
**Steps:**
1. Continue from Test Case 1
2. Click on any MeSH term suggestion from the dropdown
3. Observe console logs

**Expected Results:**
- Console should show: `🎯 [MeSH Autocomplete] Selected suggestion:` with suggestion details
- Console should show: `🔍 [MeSH Autocomplete] Triggering search for: "[selected term]"`
- Console should show: `🏠 [Home Page] MeSH search triggered:` with detailed metrics
- Should redirect to search page with the selected term

### Test Case 3: Generate Review from MeSH Search
**Steps:**
1. Type "diabetes" in the search field
2. Wait for suggestions to appear
3. Click the "🚀 Generate Review" button (if visible) or press Enter
4. Observe console logs

**Expected Results:**
- Console should show: `📝 [MeSH Autocomplete] Generate Review triggered:`
- Console should show: `🏠 [Home Page] Generate-review triggered from MeSH search:`
- Console should show: `🏠 [Home Page] Final query parameters:`
- Console should show: `🏠 [Home Page] Navigating to project creation with params:`
- Should redirect to project creation page with pre-filled query

### Test Case 4: MeSH API Integration
**Steps:**
1. Type "crispr" in search field
2. Check network tab in developer tools
3. Look for API call to `/api/proxy/mesh/autocomplete`

**Expected Results:**
- API call should return 200 status
- Response should contain `mesh_terms`, `trending_keywords`, and `suggested_queries`
- Each suggestion should have `term`, `category`, `type`, and `relevance_score`

## Phase 1.2: Enhanced Network Sidebar Testing

### Test Case 5: Access Network View with Smart Actions
**Steps:**
1. Create or open an existing project
2. Navigate to the "Network" tab
3. Click on any node in the network visualization
4. Observe the right sidebar

**Expected Results:**
- Sidebar should display article details
- Should see three smart action buttons at the bottom:
  - "🚀 Review" (blue background)
  - "🔍 Deep Dive" (purple background)  
  - "🌐 Cluster" (green background)

### Test Case 6: Generate Review from Network Sidebar
**Steps:**
1. Continue from Test Case 5
2. Open browser console
3. Click the "🚀 Review" button
4. Observe console logs and UI changes

**Expected Results:**
- Console should show: `🚀 Generate Review button clicked!` with node details
- Console should show: `🚀 [Project Page] Generate Review from Network triggered:`
- Console should show: `🚀 [Project Page] Starting review job with params:`
- Console should show: `🚀 [Project Page] Review job response:`
- Console should show: `✅ [Project Page] Review job started successfully from network sidebar`
- Should see alert: "🚀 Review generation started for [title]!"
- AsyncJobProgress component should appear showing job progress

### Test Case 7: Deep Dive from Network Sidebar
**Steps:**
1. Select a different node in the network
2. Click the "🔍 Deep Dive" button
3. Observe console logs

**Expected Results:**
- Console should show: `🔍 Deep Dive button clicked!` with node details
- Console should show: `🔍 [Project Page] Deep Dive from Network triggered:`
- Console should show: `🔍 [Project Page] Starting deep dive job with params:`
- Console should show: `🔍 [Project Page] Deep dive job response:`
- Console should show: `✅ [Project Page] Deep dive job started successfully from network sidebar`
- Should see alert: "🔍 Deep dive analysis started for [title]!"
- AsyncJobProgress component should appear for deep dive job

### Test Case 8: Explore Cluster from Network Sidebar
**Steps:**
1. Select another node in the network
2. Click the "🌐 Cluster" button
3. Observe console logs and UI changes

**Expected Results:**
- Console should show: `🌐 Explore Cluster button clicked!` with node details
- Console should show: `🌐 [Project Page] Explore Cluster from Network triggered:`
- Console should show: `🌐 [Project Page] Creating cluster collection with params:`
- Console should show: `🌐 [Project Page] Cluster collection created:`
- Console should show: `🌐 [Project Page] Adding source paper to collection:`
- Console should show: `🌐 [Project Page] Refreshing collections and switching to collections tab`
- Console should show: `✅ [Project Page] Cluster exploration completed successfully`
- Should see alert: "🌐 Cluster collection created: [name]!"
- Should automatically switch to "Collections" tab
- New collection should appear in collections list

## Cross-Feature Integration Testing

### Test Case 9: End-to-End Workflow
**Steps:**
1. Start at home page
2. Use MeSH autocomplete to search for "immunotherapy"
3. Select a MeSH term suggestion
4. Create a new project from the search
5. Add some articles to the project
6. Go to Network tab
7. Use all three smart actions on different nodes

**Expected Results:**
- Seamless flow from MeSH search to project creation
- Network visualization loads with articles
- All smart actions work correctly
- Jobs are tracked with AsyncJobProgress components
- Collections are created and populated correctly

### Test Case 10: Error Handling
**Steps:**
1. Test MeSH autocomplete with network disconnected
2. Test smart actions with invalid node data
3. Test with backend service unavailable

**Expected Results:**
- Graceful error handling with console error messages
- User-friendly error alerts
- No application crashes
- Proper fallback behavior

## Performance Testing

### Test Case 11: MeSH Autocomplete Performance
**Steps:**
1. Type rapidly in MeSH search field
2. Observe debouncing behavior
3. Check API call frequency

**Expected Results:**
- API calls should be debounced (300ms delay)
- No excessive API calls during rapid typing
- Suggestions should load within 1-2 seconds

### Test Case 12: Network Sidebar Responsiveness
**Steps:**
1. Click rapidly between different network nodes
2. Observe sidebar updates
3. Test smart action button responsiveness

**Expected Results:**
- Sidebar should update smoothly
- No lag in button interactions
- Proper loading states during job creation

## Validation Checklist

- [ ] MeSH autocomplete API returns valid suggestions
- [ ] MeSH suggestions include both terms and trending keywords
- [ ] Generate review integration works from home page
- [ ] Network sidebar displays smart action buttons
- [ ] Generate Review button creates review jobs
- [ ] Deep Dive button creates deep dive jobs
- [ ] Explore Cluster button creates collections
- [ ] All jobs are tracked with progress indicators
- [ ] Console logging provides detailed debugging info
- [ ] Error handling works gracefully
- [ ] Performance is acceptable (< 2s response times)
- [ ] UI updates correctly after actions
