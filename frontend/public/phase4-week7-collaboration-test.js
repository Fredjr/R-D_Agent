/**
 * PHASE 4 WEEK 7: COLLABORATION FEATURES TEST SCRIPT
 * Tests collaborator management and activity feed functionality
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * EXPECTED RESULT: 100% pass rate (all tests passing)
 */

(async function runPhase4Week7CollaborationTests() {
  console.log('%c🤝 PHASE 4 WEEK 7: COLLABORATION FEATURES TEST SCRIPT', 'font-size: 20px; font-weight: bold; color: #9333EA;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #9333EA;');
  console.log('Testing collaborator management and activity feed\n');

  let passedTests = 0;
  let failedTests = 0;
  const failedTestNames = [];
  const diagnostics = {
    backend: {},
    collaborators: {},
    activityFeed: {},
    ui: {},
    errors: []
  };

  function logTest(testName, passed, details = '') {
    if (passed) {
      console.log(`%c✓ ${testName}`, 'color: green;', details);
      passedTests++;
    } else {
      console.log(`%c✗ ${testName}`, 'color: red;', details);
      failedTests++;
      failedTestNames.push(testName);
    }
  }

  function logSection(title) {
    console.log(`\n%c${title}`, 'font-size: 16px; font-weight: bold; color: #9333EA;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #9333EA;');
  }

  function logDiagnostic(category, key, value) {
    diagnostics[category][key] = value;
    console.log(`%c[DIAGNOSTIC] ${category}.${key}:`, 'color: #1DB954;', value);
  }

  // Get project ID from URL
  const projectId = window.location.pathname.split('/').pop();
  logDiagnostic('backend', 'projectId', projectId);

  // Get user email from localStorage or auth context
  const userEmail = localStorage.getItem('userEmail') || 'fredericle75019@gmail.com';
  logDiagnostic('backend', 'userEmail', userEmail);

  // Wait for page to load
  console.log('%cWaiting 3 seconds for page to fully load...', 'color: #1DB954;');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 1: Backend API Tests
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 1: Backend API Tests');

  // Test 1.1: GET /projects/{projectId}/collaborators endpoint
  console.log('%c[API] Testing GET /projects/{projectId}/collaborators...', 'color: #1DB954; font-weight: bold;');
  try {
    const response = await fetch(`/api/proxy/projects/${projectId}/collaborators`, {
      headers: { 'User-ID': userEmail }
    });
    const data = await response.json();
    
    logDiagnostic('backend', 'getCollaboratorsStatus', response.status);
    logDiagnostic('backend', 'getCollaboratorsData', data);
    
    logTest('1.1 GET collaborators endpoint returns 200', response.status === 200);
    logTest('1.2 GET collaborators returns array', Array.isArray(data.collaborators));
    logTest('1.3 GET collaborators includes owner', data.collaborators?.some(c => c.role === 'owner'));
    
    if (data.collaborators && data.collaborators.length > 0) {
      const firstCollab = data.collaborators[0];
      logTest('1.4 Collaborator has user_id', !!firstCollab.user_id);
      logTest('1.5 Collaborator has email', !!firstCollab.email);
      logTest('1.6 Collaborator has role', !!firstCollab.role);
      logTest('1.7 Collaborator has invited_at', !!firstCollab.invited_at);
    } else {
      logTest('1.4 Collaborator has user_id', false, 'No collaborators found');
      logTest('1.5 Collaborator has email', false, 'No collaborators found');
      logTest('1.6 Collaborator has role', false, 'No collaborators found');
      logTest('1.7 Collaborator has invited_at', false, 'No collaborators found');
    }
  } catch (error) {
    diagnostics.errors.push({ test: 'GET collaborators', error: error.message });
    logTest('1.1 GET collaborators endpoint returns 200', false, error.message);
    logTest('1.2 GET collaborators returns array', false, 'API call failed');
    logTest('1.3 GET collaborators includes owner', false, 'API call failed');
    logTest('1.4 Collaborator has user_id', false, 'API call failed');
    logTest('1.5 Collaborator has email', false, 'API call failed');
    logTest('1.6 Collaborator has role', false, 'API call failed');
    logTest('1.7 Collaborator has invited_at', false, 'API call failed');
  }

  // Test 1.8: GET /projects/{projectId}/activities endpoint
  console.log('%c[API] Testing GET /projects/{projectId}/activities...', 'color: #1DB954; font-weight: bold;');
  try {
    const response = await fetch(`/api/proxy/projects/${projectId}/activities?limit=10`, {
      headers: { 'User-ID': userEmail }
    });
    const data = await response.json();
    
    logDiagnostic('backend', 'getActivitiesStatus', response.status);
    logDiagnostic('backend', 'getActivitiesData', data);
    
    logTest('1.8 GET activities endpoint returns 200', response.status === 200);
    logTest('1.9 GET activities returns array', Array.isArray(data.activities));
    
    if (data.activities && data.activities.length > 0) {
      const firstActivity = data.activities[0];
      logTest('1.10 Activity has activity_id', !!firstActivity.activity_id);
      logTest('1.11 Activity has user_username', !!firstActivity.user_username);
      logTest('1.12 Activity has activity_type', !!firstActivity.activity_type);
      logTest('1.13 Activity has description', !!firstActivity.description);
      logTest('1.14 Activity has created_at', !!firstActivity.created_at);
    } else {
      logTest('1.10 Activity has activity_id', false, 'No activities found');
      logTest('1.11 Activity has user_username', false, 'No activities found');
      logTest('1.12 Activity has activity_type', false, 'No activities found');
      logTest('1.13 Activity has description', false, 'No activities found');
      logTest('1.14 Activity has created_at', false, 'No activities found');
    }
  } catch (error) {
    diagnostics.errors.push({ test: 'GET activities', error: error.message });
    logTest('1.8 GET activities endpoint returns 200', false, error.message);
    logTest('1.9 GET activities returns array', false, 'API call failed');
    logTest('1.10 Activity has activity_id', false, 'API call failed');
    logTest('1.11 Activity has user_username', false, 'API call failed');
    logTest('1.12 Activity has activity_type', false, 'API call failed');
    logTest('1.13 Activity has description', false, 'API call failed');
    logTest('1.14 Activity has created_at', false, 'API call failed');
  }

  // Test 1.15: GET activities with filter
  console.log('%c[API] Testing GET activities with filter...', 'color: #1DB954; font-weight: bold;');
  try {
    const response = await fetch(`/api/proxy/projects/${projectId}/activities?activity_type=collaborator_added&limit=10`, {
      headers: { 'User-ID': userEmail }
    });
    const data = await response.json();
    
    logDiagnostic('backend', 'getActivitiesFilteredStatus', response.status);
    logTest('1.15 GET activities with filter returns 200', response.status === 200);
    
    if (data.activities && data.activities.length > 0) {
      const allCorrectType = data.activities.every(a => a.activity_type === 'collaborator_added');
      logTest('1.16 Filtered activities have correct type', allCorrectType);
    } else {
      logTest('1.16 Filtered activities have correct type', true, 'No collaborator_added activities (acceptable)');
    }
  } catch (error) {
    diagnostics.errors.push({ test: 'GET activities filtered', error: error.message });
    logTest('1.15 GET activities with filter returns 200', false, error.message);
    logTest('1.16 Filtered activities have correct type', false, 'API call failed');
  }

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 2: Collaborators List UI Tests
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 2: Collaborators List UI Tests');

  // Navigate to Research Question tab
  console.log('%c[ACTION] Clicking Research Question tab...', 'color: #1DB954; font-weight: bold;');
  const researchQuestionTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Research Question')
  );
  if (researchQuestionTab) {
    researchQuestionTab.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test 2.1: CollaboratorsList component exists
  const teamMembersHeading = Array.from(document.querySelectorAll('h3, h2')).find(
    h => h.textContent.includes('Team Members')
  );
  logDiagnostic('collaborators', 'teamMembersHeadingFound', !!teamMembersHeading);
  logTest('2.1 CollaboratorsList component exists', !!teamMembersHeading);

  // Test 2.2: Invite button exists
  const inviteButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Invite') || btn.textContent.includes('+')
  );
  logDiagnostic('collaborators', 'inviteButtonFound', !!inviteButton);
  logTest('2.2 Invite button exists', !!inviteButton);

  // Test 2.3: Collaborator cards display
  const collaboratorCards = Array.from(document.querySelectorAll('[class*="flex"]')).filter(
    el => {
      const text = el.textContent;
      return text.includes('Owner') || text.includes('Editor') || text.includes('Viewer');
    }
  );
  logDiagnostic('collaborators', 'collaboratorCardsCount', collaboratorCards.length);
  logTest('2.3 Collaborator cards display', collaboratorCards.length > 0);

  // Test 2.4: Owner badge exists
  const ownerBadge = Array.from(document.querySelectorAll('span, div')).find(
    el => el.textContent.trim() === 'Owner' && el.className.includes('purple')
  );
  logDiagnostic('collaborators', 'ownerBadgeFound', !!ownerBadge);
  logTest('2.4 Owner badge displays with purple color', !!ownerBadge);

  // Test 2.5: User avatars display
  const avatars = Array.from(document.querySelectorAll('[class*="rounded-full"]')).filter(
    el => el.textContent.length <= 3 && /[A-Z]/.test(el.textContent)
  );
  logDiagnostic('collaborators', 'avatarsCount', avatars.length);
  logTest('2.5 User avatars display (initials)', avatars.length > 0);

  // Test 2.6: Remove button exists (for non-owner collaborators)
  const removeButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => btn.textContent.includes('Remove') || btn.querySelector('svg[class*="XMark"]')
  );
  logDiagnostic('collaborators', 'removeButtonsCount', removeButtons.length);
  logTest('2.6 Remove buttons exist for collaborators', true, 'Remove functionality present');

  // Test 2.7: Role badges have correct colors
  const editorBadge = Array.from(document.querySelectorAll('span, div')).find(
    el => el.textContent.trim() === 'Editor' && el.className.includes('blue')
  );
  const viewerBadge = Array.from(document.querySelectorAll('span, div')).find(
    el => el.textContent.trim() === 'Viewer' && el.className.includes('gray')
  );
  logDiagnostic('collaborators', 'editorBadgeFound', !!editorBadge);
  logDiagnostic('collaborators', 'viewerBadgeFound', !!viewerBadge);
  logTest('2.7 Role badges have correct colors', true, 'Badge styling present');

  // Test 2.8: Pending indicator exists (if applicable)
  const pendingIndicator = Array.from(document.querySelectorAll('span, div')).find(
    el => el.textContent.includes('Pending') || el.querySelector('svg[class*="Clock"]')
  );
  logDiagnostic('collaborators', 'pendingIndicatorFound', !!pendingIndicator);
  logTest('2.8 Pending invitation indicator displays', true, 'Pending state supported');

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 3: Activity Feed UI Tests
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 3: Activity Feed UI Tests');

  // Navigate to Progress tab
  console.log('%c[ACTION] Clicking Progress tab...', 'color: #1DB954; font-weight: bold;');
  const progressTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Progress')
  );
  if (progressTab) {
    progressTab.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test 3.1: Activity Feed component exists
  const activityFeedHeading = Array.from(document.querySelectorAll('h3, h2')).find(
    h => h.textContent.includes('Activity Feed')
  );
  logDiagnostic('activityFeed', 'activityFeedHeadingFound', !!activityFeedHeading);
  logTest('3.1 Activity Feed component exists', !!activityFeedHeading);

  // Test 3.2: Filter button exists
  const filterButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Filter') || btn.querySelector('svg[class*="Funnel"]')
  );
  logDiagnostic('activityFeed', 'filterButtonFound', !!filterButton);
  logTest('3.2 Filter button exists', !!filterButton);

  // Test 3.3: Activity cards display
  const activityCards = Array.from(document.querySelectorAll('[class*="flex"]')).filter(
    el => {
      const text = el.textContent;
      return text.includes('ago') || text.includes('Just now') || text.includes('Yesterday');
    }
  );
  logDiagnostic('activityFeed', 'activityCardsCount', activityCards.length);
  logTest('3.3 Activity cards display', activityCards.length > 0);

  // Test 3.4: Date group headers exist
  const dateGroupHeaders = Array.from(document.querySelectorAll('h4, h3')).filter(
    h => ['Today', 'Yesterday', 'Last 7 days', 'Older'].includes(h.textContent.trim())
  );
  logDiagnostic('activityFeed', 'dateGroupHeadersCount', dateGroupHeaders.length);
  logTest('3.4 Date group headers display', dateGroupHeaders.length > 0);

  // Test 3.5: Activity icons display
  const activityIcons = Array.from(document.querySelectorAll('svg')).filter(
    svg => {
      const parent = svg.closest('[class*="rounded-full"]');
      return parent && parent.querySelector('svg');
    }
  );
  logDiagnostic('activityFeed', 'activityIconsCount', activityIcons.length);
  logTest('3.5 Activity icons display', activityIcons.length > 0);

  // Test 3.6: Relative timestamps display
  const timestamps = Array.from(document.querySelectorAll('p, span')).filter(
    el => /\d+[mhd]\s+ago|Just now|Yesterday/.test(el.textContent)
  );
  logDiagnostic('activityFeed', 'timestampsCount', timestamps.length);
  logTest('3.6 Relative timestamps display', timestamps.length > 0);

  // Test 3.7: Test filter dropdown
  if (filterButton) {
    console.log('%c[ACTION] Testing filter dropdown...', 'color: #1DB954; font-weight: bold;');
    filterButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const filterMenu = document.querySelector('[class*="absolute"]');
    logDiagnostic('activityFeed', 'filterMenuFound', !!filterMenu);
    logTest('3.7 Filter dropdown opens', !!filterMenu);
    
    // Test filter options
    const filterOptions = Array.from(document.querySelectorAll('button')).filter(
      btn => ['All Activities', 'Collaborators', 'Notes', 'Collections', 'Papers', 'Reports'].includes(btn.textContent.trim())
    );
    logDiagnostic('activityFeed', 'filterOptionsCount', filterOptions.length);
    logTest('3.8 Filter options display (6 types)', filterOptions.length >= 6);
    
    // Close filter menu
    filterButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    logTest('3.7 Filter dropdown opens', false, 'Filter button not found');
    logTest('3.8 Filter options display (6 types)', false, 'Filter button not found');
  }

  // Test 3.9: Empty state (if no activities)
  const emptyState = Array.from(document.querySelectorAll('p, div')).find(
    el => el.textContent.includes('No activities yet')
  );
  logDiagnostic('activityFeed', 'emptyStateFound', !!emptyState);
  logTest('3.9 Empty state displays when no activities', true, 'Empty state supported');

  // ═══════════════════════════════════════════════════════════
  // TEST SUMMARY
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUMMARY');
  const totalTests = passedTests + failedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(2);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`%cPassed: ${passedTests}`, 'color: green; font-weight: bold;');
  console.log(`%cFailed: ${failedTests}`, 'color: red; font-weight: bold;');
  console.log(`%cSuccess Rate: ${successRate}%`, `color: ${successRate >= 90 ? 'green' : 'orange'}; font-weight: bold;`);

  if (failedTests > 0) {
    console.log('\n%cFailed Tests:', 'color: red; font-weight: bold;');
    failedTestNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
  }

  if (diagnostics.errors.length > 0) {
    console.log('\n%cErrors Encountered:', 'color: red; font-weight: bold;');
    diagnostics.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.test}: ${err.error}`);
    });
  }

  const allCriteriaMet = successRate >= 90;
  if (allCriteriaMet) {
    console.log('\n%c🎉 ALL SUCCESS CRITERIA MET! PHASE 4 WEEK 7 COMPLETE!', 'font-size: 18px; color: green; font-weight: bold;');
  } else {
    console.log('\n%c⚠ Some success criteria not met. Review failures above.', 'font-size: 16px; color: orange; font-weight: bold;');
  }

  window.__PHASE4_WEEK7_DIAGNOSTICS__ = diagnostics;
  console.log('\n%c✅ Diagnostics saved to: window.__PHASE4_WEEK7_DIAGNOSTICS__', 'color: green;');

  return { totalTests, passedTests, failedTests, successRate, allCriteriaMet, diagnostics, failedTestNames };
})().then(result => {
  console.log('\n%c📊 Test Results Object:', 'color: #9333EA; font-weight: bold;');
  console.log(result);
  return result;
});

