/**
 * PHASE 2 WEEK 2 ENHANCED DIAGNOSTIC TEST SCRIPT
 * Tests the 6-tab structure with Analysis and Progress tabs
 * WITH COMPREHENSIVE ROOT CAUSE ANALYSIS
 *
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 *
 * EXPECTED RESULT: 100% pass rate + detailed diagnostics
 */

(async function runPhase2DiagnosticTests() {
  console.log('%c🔬 PHASE 2 WEEK 2 ENHANCED DIAGNOSTIC TEST SCRIPT', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #4F46E5;');
  console.log('Testing 6-tab structure with COMPREHENSIVE ROOT CAUSE ANALYSIS\n');

  let passedTests = 0;
  let failedTests = 0;
  const failedTestNames = [];
  const diagnostics = {
    deployment: {},
    dom: {},
    react: {},
    components: {},
    data: {},
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
    console.log(`\n%c${title}`, 'font-size: 16px; font-weight: bold; color: #4F46E5;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #4F46E5;');
  }

  function logDiagnostic(category, key, value) {
    diagnostics[category][key] = value;
    console.log(`%c[DIAGNOSTIC] ${category}.${key}:`, 'color: #9333EA;', value);
  }

  function logError(error) {
    diagnostics.errors.push(error);
    console.error(`%c[ERROR DETECTED]`, 'color: red; font-weight: bold;', error);
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 0: PRE-FLIGHT DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════
  logSection('PHASE 0: PRE-FLIGHT DIAGNOSTICS');

  // Check deployment version
  const metaTags = Array.from(document.querySelectorAll('meta'));
  const buildId = metaTags.find(m => m.name === 'next-build-id')?.content || 'unknown';
  logDiagnostic('deployment', 'nextBuildId', buildId);
  logDiagnostic('deployment', 'url', window.location.href);
  logDiagnostic('deployment', 'timestamp', new Date().toISOString());

  // Check for React
  const hasReact = !!window.React || !!document.querySelector('[data-reactroot]') || !!document.querySelector('#__next');
  logDiagnostic('deployment', 'reactDetected', hasReact);

  // Check for console errors
  const originalError = console.error;
  const capturedErrors = [];
  console.error = function(...args) {
    capturedErrors.push(args.join(' '));
    originalError.apply(console, args);
  };

  // Wait for page to load
  console.log('%cWaiting 3 seconds for page to fully load...', 'color: #9333EA;');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Restore console.error
  console.error = originalError;
  if (capturedErrors.length > 0) {
    logDiagnostic('errors', 'consoleErrors', capturedErrors);
    capturedErrors.forEach(err => logError(err));
  }

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 1: Tab Navigation & Structure (WITH DIAGNOSTICS)
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 1: Tab Navigation & Structure');

  // DIAGNOSTIC: Find ALL buttons on page
  const allButtons = Array.from(document.querySelectorAll('button'));
  logDiagnostic('dom', 'totalButtons', allButtons.length);

  // DIAGNOSTIC: Find tab-like buttons
  const allTabButtons = allButtons.filter(btn => {
    const hasTabText =
      btn.textContent?.includes('Research Question') ||
      btn.textContent?.includes('Explore Papers') ||
      btn.textContent?.includes('My Collections') ||
      btn.textContent?.includes('Notes & Ideas') ||
      btn.textContent?.includes('Analysis') ||
      btn.textContent?.includes('Progress');
    return hasTabText;
  });

  logDiagnostic('dom', 'tabLikeButtons', allTabButtons.length);

  // DIAGNOSTIC: Check visibility of each tab button
  const tabVisibilityReport = allTabButtons.map(btn => {
    const style = window.getComputedStyle(btn);
    const rect = btn.getBoundingClientRect();
    return {
      text: btn.textContent?.trim().split('\n')[0],
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
      inViewport: rect.top >= 0 && rect.left >= 0,
      disabled: btn.disabled,
      className: btn.className,
      ariaHidden: btn.getAttribute('aria-hidden')
    };
  });

  console.table(tabVisibilityReport);
  logDiagnostic('dom', 'tabVisibilityReport', tabVisibilityReport);

  // Filter visible tabs
  const visibleTabButtons = allTabButtons.filter(btn => {
    const style = window.getComputedStyle(btn);
    const rect = btn.getBoundingClientRect();
    const isVisible =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0;
    return isVisible;
  });

  logDiagnostic('dom', 'visibleTabButtons', visibleTabButtons.length);

  // Remove duplicates by unique labels
  const uniqueTabLabels = new Set();
  const tabButtons = visibleTabButtons.filter(btn => {
    const label = btn.textContent?.trim().split('\n')[0];
    if (uniqueTabLabels.has(label)) return false;
    uniqueTabLabels.add(label);
    return true;
  });

  const tabLabels = tabButtons.map(btn => btn.textContent?.trim().split('\n')[0]);
  logDiagnostic('dom', 'uniqueTabLabels', tabLabels);

  // DIAGNOSTIC: Check for missing tabs
  const expectedTabs = ['Research Question', 'Explore Papers', 'My Collections', 'Notes & Ideas', 'Analysis', 'Progress'];
  const missingTabs = expectedTabs.filter(tab => !tabLabels.some(label => label?.includes(tab)));
  if (missingTabs.length > 0) {
    logDiagnostic('dom', 'missingTabs', missingTabs);
    logError(`Missing tabs: ${missingTabs.join(', ')}`);
  }

  // DIAGNOSTIC: Check SpotifyProjectTabs component
  const spotifyTabsContainer = document.querySelector('[class*="SpotifyProjectTabs"]') ||
                                document.querySelector('[class*="spotify"]') ||
                                document.querySelector('nav');
  if (spotifyTabsContainer) {
    logDiagnostic('dom', 'tabsContainerFound', true);
    logDiagnostic('dom', 'tabsContainerClass', spotifyTabsContainer.className);
  } else {
    logDiagnostic('dom', 'tabsContainerFound', false);
    logError('SpotifyProjectTabs container not found in DOM');
  }

  logTest('1.1 All 6 tabs are present', tabButtons.length === 6, `Found ${tabButtons.length} tabs (Expected: 6)`);

  // Test 1.2: Tab names are correct
  const actualTabs = tabButtons.map(btn => btn.textContent?.trim().split('\n')[0]);
  const allTabsCorrect = expectedTabs.every(tab => actualTabs.some(actual => actual?.includes(tab)));
  logTest('1.2 Tab names are correct', allTabsCorrect, `Found: ${actualTabs.join(', ')}`);

  // Test 1.3: All tabs are clickable
  const allClickable = tabButtons.every(btn => !btn.disabled);
  logTest('1.3 All tabs are clickable (not disabled)', allClickable);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 2: Analysis Tab (WITH COMPREHENSIVE DIAGNOSTICS)
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 2: Analysis Tab');

  // DIAGNOSTIC: Find Analysis tab
  const analysisTab = tabButtons.find(btn => btn.textContent?.includes('Analysis'));
  logDiagnostic('components', 'analysisTabFound', !!analysisTab);

  if (!analysisTab) {
    logError('Analysis tab button not found in DOM');
    logDiagnostic('components', 'analysisTabError', 'Button not found - tab may not be rendered');
  } else {
    logDiagnostic('components', 'analysisTabText', analysisTab.textContent?.trim());
    logDiagnostic('components', 'analysisTabDisabled', analysisTab.disabled);

    // DIAGNOSTIC: Check tab state before click
    const activeTabBefore = document.querySelector('[class*="active"]')?.textContent || 'unknown';
    logDiagnostic('components', 'activeTabBeforeClick', activeTabBefore);

    // Click Analysis tab
    console.log('%c[ACTION] Clicking Analysis tab...', 'color: #9333EA; font-weight: bold;');
    analysisTab.click();

    // Wait and check for state change
    await new Promise(resolve => setTimeout(resolve, 2000));

    const activeTabAfter = document.querySelector('[class*="active"]')?.textContent || 'unknown';
    logDiagnostic('components', 'activeTabAfterClick', activeTabAfter);

    if (!activeTabAfter.includes('Analysis')) {
      logError('Analysis tab click did not change active state');
    }
  }

  // DIAGNOSTIC: Search for AnalysisTab component in DOM
  const analysisTabComponent = document.querySelector('[class*="AnalysisTab"]') ||
                                 document.querySelector('[class*="analysis"]');
  logDiagnostic('components', 'analysisTabComponentFound', !!analysisTabComponent);

  // DIAGNOSTIC: Check for Analysis tab content with multiple patterns
  const contentPatterns = [
    'Reports and deep dive analyses',
    'Reports and deep dives',
    'Analysis',
    'Generate Report',
    'Generate Deep Dive',
    'No analyses yet'
  ];

  const foundPatterns = contentPatterns.filter(pattern =>
    document.body.textContent?.includes(pattern)
  );

  logDiagnostic('components', 'analysisContentPatternsFound', foundPatterns);

  if (foundPatterns.length === 0) {
    logError('No Analysis tab content patterns found - component may not be rendering');
  }

  // DIAGNOSTIC: Check for React component errors
  const reactErrorBoundary = document.querySelector('[class*="error"]') ||
                               document.querySelector('[class*="Error"]');
  if (reactErrorBoundary) {
    logDiagnostic('react', 'errorBoundaryDetected', true);
    logDiagnostic('react', 'errorBoundaryContent', reactErrorBoundary.textContent);
    logError('React Error Boundary detected - component crashed');
  }

  // DIAGNOSTIC: Check browser console for component errors
  const componentErrors = capturedErrors.filter(err =>
    err.includes('AnalysisTab') ||
    err.includes('Analysis') ||
    err.includes('Cannot read')
  );
  if (componentErrors.length > 0) {
    logDiagnostic('react', 'analysisTabErrors', componentErrors);
  }

  // Test 2.1: Analysis tab content exists
  const analysisContent = document.body.textContent?.includes('Reports and deep dive analyses') ||
                          document.body.textContent?.includes('No analyses yet');
  logTest('2.1 Analysis tab content exists', analysisContent,
    analysisContent ? 'Content found' : 'FAILED - Content not found. Check diagnostics above.');

  // DIAGNOSTIC: Search for all buttons after Analysis tab click
  const allButtonsAfterClick = Array.from(document.querySelectorAll('button'));
  const buttonTexts = allButtonsAfterClick.map(btn => btn.textContent?.trim().substring(0, 50));
  logDiagnostic('components', 'allButtonTextsAfterClick', buttonTexts.slice(0, 20)); // First 20 buttons

  // Test 2.2: Generate Report button exists
  const generateReportBtn = allButtonsAfterClick.find(btn =>
    btn.textContent?.includes('Generate Report')
  );
  logDiagnostic('components', 'generateReportBtnFound', !!generateReportBtn);
  if (!generateReportBtn) {
    logError('Generate Report button not found - AnalysisTab may not be rendering');
  }
  logTest('2.2 Generate Report button exists', !!generateReportBtn);

  // Test 2.3: Generate Deep Dive button exists
  const generateDeepDiveBtn = allButtonsAfterClick.find(btn =>
    btn.textContent?.includes('Generate Deep Dive')
  );
  logDiagnostic('components', 'generateDeepDiveBtnFound', !!generateDeepDiveBtn);
  if (!generateDeepDiveBtn) {
    logError('Generate Deep Dive button not found - AnalysisTab may not be rendering');
  }
  logTest('2.3 Generate Deep Dive button exists', !!generateDeepDiveBtn);

  // DIAGNOSTIC: Search for all select elements
  const allSelects = Array.from(document.querySelectorAll('select'));
  logDiagnostic('components', 'totalSelectElements', allSelects.length);

  const selectDetails = allSelects.map(sel => ({
    options: Array.from(sel.querySelectorAll('option')).map(opt => opt.textContent?.trim()),
    visible: window.getComputedStyle(sel).display !== 'none'
  }));
  logDiagnostic('components', 'selectElementDetails', selectDetails);

  // Test 2.4: Filter dropdown exists
  const filterDropdown = allSelects.find(el => {
    const options = Array.from(el.querySelectorAll('option')).map(opt => opt.textContent?.toLowerCase() || '');
    return options.some(opt => opt.includes('all analyses') || opt.includes('reports') || opt.includes('deep dive'));
  });
  logDiagnostic('components', 'filterDropdownFound', !!filterDropdown);
  if (!filterDropdown) {
    logError('Filter dropdown not found - AnalysisTab filter UI missing');
  }
  logTest('2.4 Filter dropdown exists', !!filterDropdown);

  // Test 2.5: Sort dropdown exists
  const sortDropdown = allSelects.find(el => {
    const options = Array.from(el.querySelectorAll('option')).map(opt => opt.textContent?.toLowerCase() || '');
    return options.some(opt => opt.includes('date') || opt.includes('title'));
  });
  logDiagnostic('components', 'sortDropdownFound', !!sortDropdown);
  if (!sortDropdown) {
    logError('Sort dropdown not found - AnalysisTab sort UI missing');
  }
  logTest('2.5 Sort dropdown exists', !!sortDropdown);

  // Test 2.6: Empty state or analysis cards exist
  const hasEmptyState = document.body.textContent?.includes('No analyses yet');
  const hasAnalysisCards = document.body.textContent?.includes('REPORT') || document.body.textContent?.includes('DEEP DIVE');
  logDiagnostic('components', 'hasEmptyState', hasEmptyState);
  logDiagnostic('components', 'hasAnalysisCards', hasAnalysisCards);

  if (!hasEmptyState && !hasAnalysisCards) {
    logError('Neither empty state nor analysis cards found - AnalysisTab content missing');
  }
  logTest('2.6 Empty state or analysis cards exist', hasEmptyState || hasAnalysisCards);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 3: Progress Tab (WITH DIAGNOSTICS)
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 3: Progress Tab');

  // DIAGNOSTIC: Find Progress tab
  const progressTab = tabButtons.find(btn => btn.textContent?.includes('Progress'));
  logDiagnostic('components', 'progressTabFound', !!progressTab);

  if (!progressTab) {
    logError('Progress tab button not found in DOM');
  } else {
    console.log('%c[ACTION] Clicking Progress tab...', 'color: #9333EA; font-weight: bold;');
    progressTab.click();
    await new Promise(resolve => setTimeout(resolve, 2000));

    const activeTabAfter = document.querySelector('[class*="active"]')?.textContent || 'unknown';
    logDiagnostic('components', 'activeTabAfterProgressClick', activeTabAfter);
  }

  // DIAGNOSTIC: Check for Progress tab content patterns
  const progressPatterns = [
    'Activity timeline and metrics',
    'Track your research activity',
    'Progress',
    'Recent Activity',
    'Project Timeline',
    'Research Insights'
  ];

  const foundProgressPatterns = progressPatterns.filter(pattern =>
    document.body.textContent?.includes(pattern)
  );

  logDiagnostic('components', 'progressContentPatternsFound', foundProgressPatterns);

  // Test 3.1: Progress tab content exists (more flexible)
  const progressContent = foundProgressPatterns.length > 0;
  logTest('3.1 Progress tab content exists', progressContent,
    progressContent ? `Found: ${foundProgressPatterns.join(', ')}` : 'FAILED - No progress content found');

  // Test 3.2: Time range selector exists
  const timeRangeSelector = Array.from(document.querySelectorAll('select')).find(el => {
    const options = Array.from(el.querySelectorAll('option')).map(opt => opt.textContent?.toLowerCase() || '');
    return options.some(opt => opt.includes('week') || opt.includes('month') || opt.includes('all time'));
  });
  logTest('3.2 Time range selector exists', !!timeRangeSelector);

  // Test 3.3: Papers metric card exists
  const papersMetric = document.body.textContent?.includes('Papers') && document.body.textContent?.includes('Total articles');
  logTest('3.3 Papers metric card exists', papersMetric);

  // Test 3.4: Notes metric card exists
  const notesMetric = document.body.textContent?.includes('Notes') && document.body.textContent?.includes('Research notes');
  logTest('3.4 Notes metric card exists', notesMetric);

  // Test 3.5: Collections metric card exists
  const collectionsMetric = document.body.textContent?.includes('Collections') && document.body.textContent?.includes('Organized');
  logTest('3.5 Collections metric card exists', collectionsMetric);

  // Test 3.6: Analyses metric card exists
  const analysesMetric = document.body.textContent?.includes('Analyses') && document.body.textContent?.includes('Reports');
  logTest('3.6 Analyses metric card exists', analysesMetric);

  // Test 3.7: Project Timeline section exists
  const projectTimeline = document.body.textContent?.includes('Project Timeline');
  logTest('3.7 Project Timeline section exists', projectTimeline);

  // Test 3.8: Recent Activity section exists
  const recentActivity = document.body.textContent?.includes('Recent Activity');
  logTest('3.8 Recent Activity section exists', recentActivity);

  // Test 3.9: Research Insights section exists
  const researchInsights = document.body.textContent?.includes('Research Insights');
  logTest('3.9 Research Insights section exists', researchInsights);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 4: Tab Navigation Flow
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 4: Tab Navigation Flow');

  // Test 4.1: Can navigate to Research Question tab
  const researchQuestionTab = tabButtons.find(btn => btn.textContent?.includes('Research Question'));
  if (researchQuestionTab) {
    researchQuestionTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const hasResearchQuestionContent = document.body.textContent?.includes('Project overview');
  logTest('4.1 Can navigate to Research Question tab', hasResearchQuestionContent);

  // Test 4.2: Can navigate to Explore Papers tab
  const exploreTab = tabButtons.find(btn => btn.textContent?.includes('Explore Papers'));
  if (exploreTab) {
    exploreTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const hasExploreContent = document.body.textContent?.includes('Discover') || document.body.textContent?.includes('Search PubMed');
  logTest('4.2 Can navigate to Explore Papers tab', hasExploreContent);

  // Test 4.3: Can navigate to My Collections tab
  const collectionsTab = tabButtons.find(btn => btn.textContent?.includes('My Collections'));
  if (collectionsTab) {
    collectionsTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const hasCollectionsContent = document.body.textContent?.includes('Collections') || document.body.textContent?.includes('Create Collection');
  logTest('4.3 Can navigate to My Collections tab', hasCollectionsContent);

  // Test 4.4: Can navigate to Notes & Ideas tab
  const notesTab = tabButtons.find(btn => btn.textContent?.includes('Notes & Ideas'));
  if (notesTab) {
    notesTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const hasNotesContent = document.body.textContent?.includes('research notes') || document.body.textContent?.includes('Filters');
  logTest('4.4 Can navigate to Notes & Ideas tab', hasNotesContent);

  // ═══════════════════════════════════════════════════════════
  // PHASE 5: DEEP DATA INSPECTION
  // ═══════════════════════════════════════════════════════════
  logSection('PHASE 5: DEEP DATA INSPECTION');

  // DIAGNOSTIC: Try to access React Fiber to inspect component tree
  console.log('%c[DIAGNOSTIC] Attempting to access React internals...', 'color: #9333EA;');

  const rootElement = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
  if (rootElement) {
    const reactFiberKey = Object.keys(rootElement).find(key => key.startsWith('__reactFiber'));
    if (reactFiberKey) {
      logDiagnostic('react', 'fiberFound', true);
      console.log('%c[SUCCESS] React Fiber accessible', 'color: green;');
    } else {
      logDiagnostic('react', 'fiberFound', false);
      logError('React Fiber not accessible - cannot inspect component tree');
    }
  }

  // DIAGNOSTIC: Check for project data in window/global scope
  console.log('%c[DIAGNOSTIC] Searching for project data...', 'color: #9333EA;');

  const projectDataSources = [
    { name: 'window.__NEXT_DATA__', data: window.__NEXT_DATA__ },
    { name: 'window.project', data: window.project },
    { name: 'localStorage', data: Object.keys(localStorage).filter(k => k.includes('project')) }
  ];

  projectDataSources.forEach(source => {
    if (source.data) {
      logDiagnostic('data', source.name, typeof source.data === 'object' ? 'Found (object)' : source.data);
    }
  });

  // DIAGNOSTIC: Try to extract project data from Next.js
  if (window.__NEXT_DATA__?.props?.pageProps) {
    const pageProps = window.__NEXT_DATA__.props.pageProps;
    logDiagnostic('data', 'nextPageProps', Object.keys(pageProps));

    if (pageProps.project) {
      const project = pageProps.project;
      logDiagnostic('data', 'projectId', project.project_id);
      logDiagnostic('data', 'projectName', project.project_name);
      logDiagnostic('data', 'hasReports', !!project.reports);
      logDiagnostic('data', 'reportsCount', project.reports?.length || 0);
      logDiagnostic('data', 'hasDeepDives', !!project.deep_dives);
      logDiagnostic('data', 'deepDivesCount', project.deep_dives?.length || 0);
      logDiagnostic('data', 'hasDeepDiveAnalyses', !!project.deep_dive_analyses);
      logDiagnostic('data', 'deepDiveAnalysesCount', project.deep_dive_analyses?.length || 0);

      console.log('%c[PROJECT DATA]', 'color: #9333EA; font-weight: bold;');
      console.log('Project:', project);

      if (!project.reports && !project.deep_dives && !project.deep_dive_analyses) {
        logError('Project has no reports or deep_dives arrays - AnalysisTab will show empty state');
      }
    } else {
      logError('No project data found in Next.js pageProps');
    }
  }

  // DIAGNOSTIC: Check for component imports/modules
  console.log('%c[DIAGNOSTIC] Checking for component modules...', 'color: #9333EA;');

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const componentScripts = scripts.filter(s =>
    s.src.includes('AnalysisTab') ||
    s.src.includes('ProgressTab') ||
    s.src.includes('project')
  );

  logDiagnostic('deployment', 'componentScriptsFound', componentScripts.length);
  if (componentScripts.length > 0) {
    logDiagnostic('deployment', 'componentScriptUrls', componentScripts.map(s => s.src));
  }

  // DIAGNOSTIC: Check Next.js build manifest
  if (window.__BUILD_MANIFEST) {
    logDiagnostic('deployment', 'buildManifestFound', true);
    const pages = Object.keys(window.__BUILD_MANIFEST);
    logDiagnostic('deployment', 'buildManifestPages', pages);
  }

  // DIAGNOSTIC: Try to fetch component files to verify they exist
  console.log('%c[DIAGNOSTIC] Checking if component files exist in deployment...', 'color: #9333EA;');

  // Check if AnalysisTab component is in any loaded chunks
  const allScriptContent = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '').join('');
  const hasAnalysisTabInBundle = allScriptContent.includes('AnalysisTab') || allScriptContent.includes('analysisTab');
  const hasProgressTabInBundle = allScriptContent.includes('ProgressTab') || allScriptContent.includes('progressTab');

  logDiagnostic('deployment', 'analysisTabInBundle', hasAnalysisTabInBundle);
  logDiagnostic('deployment', 'progressTabInBundle', hasProgressTabInBundle);

  if (!hasAnalysisTabInBundle) {
    logError('AnalysisTab component not found in any loaded JavaScript bundles - component may not be built');
  }
  if (!hasProgressTabInBundle) {
    logError('ProgressTab component not found in any loaded JavaScript bundles - component may not be built');
  }

  // DIAGNOSTIC: Check for hydration errors
  const hydrationErrors = capturedErrors.filter(err =>
    err.includes('hydration') ||
    err.includes('Hydration') ||
    err.includes('did not match')
  );

  if (hydrationErrors.length > 0) {
    logDiagnostic('react', 'hydrationErrors', hydrationErrors);
    logError('React hydration errors detected - server/client mismatch');
  }

  // DIAGNOSTIC: Network requests check
  console.log('%c[DIAGNOSTIC] Check Network tab for:', 'color: #9333EA;');
  console.log('  1. Failed chunk loads (404 errors)');
  console.log('  2. Failed API calls to /api/proxy/projects/');
  console.log('  3. CORS errors');
  console.log('  4. Slow responses (>3s)');
  console.log('  5. Look for _next/static/chunks/ files with 404 status');

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

  // ═══════════════════════════════════════════════════════════
  // SUCCESS CRITERIA
  // ═══════════════════════════════════════════════════════════
  logSection('SUCCESS CRITERIA');

  const criteria = [
    { name: 'All 6 tabs present and named correctly', passed: tabButtons.length === 6 && allTabsCorrect },
    { name: 'All tabs are clickable and functional', passed: allClickable },
    { name: 'Analysis tab has generate buttons', passed: !!generateReportBtn && !!generateDeepDiveBtn },
    { name: 'Analysis tab has filter/sort options', passed: !!filterDropdown && !!sortDropdown },
    { name: 'Progress tab has all 4 metric cards', passed: papersMetric && notesMetric && collectionsMetric && analysesMetric },
    { name: 'Progress tab has timeline and insights', passed: projectTimeline && recentActivity && researchInsights },
    { name: 'Tab navigation works smoothly', passed: hasResearchQuestionContent && hasExploreContent && hasCollectionsContent && hasNotesContent }
  ];

  criteria.forEach(criterion => {
    console.log(`${criterion.passed ? '✓' : '✗'} ${criterion.name}: ${criterion.passed ? 'PASS' : 'FAIL'}`);
  });

  const allCriteriaMet = criteria.every(c => c.passed);
  if (allCriteriaMet) {
    console.log('\n%c🎉 ALL SUCCESS CRITERIA MET! PHASE 2 WEEK 2 COMPLETE!', 'font-size: 18px; color: green; font-weight: bold;');
  } else {
    console.log('\n%c⚠ Some success criteria not met. Review failures above.', 'font-size: 16px; color: orange; font-weight: bold;');
  }

  // ═══════════════════════════════════════════════════════════
  // COMPREHENSIVE DIAGNOSTIC REPORT
  // ═══════════════════════════════════════════════════════════
  logSection('COMPREHENSIVE DIAGNOSTIC REPORT');

  console.log('%c📋 FULL DIAGNOSTICS OBJECT:', 'font-size: 14px; font-weight: bold; color: #9333EA;');
  console.log(diagnostics);

  // ROOT CAUSE ANALYSIS
  console.log('\n%c🔍 ROOT CAUSE ANALYSIS:', 'font-size: 14px; font-weight: bold; color: #DC2626;');

  if (tabButtons.length < 6) {
    console.log('%c❌ ISSUE: Missing tabs', 'color: red; font-weight: bold;');
    console.log('   Expected: 6 tabs');
    console.log(`   Found: ${tabButtons.length} tabs`);
    console.log('   Missing:', missingTabs.join(', '));
    console.log('\n   POSSIBLE CAUSES:');
    console.log('   1. SpotifyProjectTabs not receiving all 6 tab configs');
    console.log('   2. Conditional rendering hiding tabs');
    console.log('   3. CSS display:none on Analysis/Progress tabs');
    console.log('   4. Deployment issue - old version cached');
    console.log('\n   RECOMMENDED ACTIONS:');
    console.log('   1. Hard refresh (Cmd+Shift+R)');
    console.log('   2. Check Vercel deployment dashboard');
    console.log('   3. Inspect SpotifyProjectTabs props in React DevTools');
    console.log('   4. Check page.tsx line 954-998 for tab configuration');
  }

  if (!analysisContent) {
    console.log('\n%c❌ ISSUE: Analysis tab not rendering', 'color: red; font-weight: bold;');
    console.log('   Analysis tab content not found in DOM');
    console.log('\n   POSSIBLE CAUSES:');
    console.log('   1. AnalysisTab component not imported correctly');
    console.log('   2. Component crashing on render (check console errors)');
    console.log('   3. Conditional rendering blocking component');
    console.log('   4. project.reports or project.deep_dives undefined');
    console.log('\n   RECOMMENDED ACTIONS:');
    console.log('   1. Check browser console for React errors');
    console.log('   2. Verify import: import { AnalysisTab } from "@/components/project/AnalysisTab"');
    console.log('   3. Check project object has reports/deep_dives arrays');
    console.log('   4. Inspect page.tsx line 1493-1502 for AnalysisTab rendering');
  }

  if (diagnostics.errors.length > 0) {
    console.log('\n%c❌ ERRORS DETECTED:', 'color: red; font-weight: bold;');
    diagnostics.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }

  // DEPLOYMENT CHECK
  console.log('\n%c🚀 DEPLOYMENT CHECK:', 'font-size: 14px; font-weight: bold; color: #2563EB;');
  console.log(`   Build ID: ${diagnostics.deployment.nextBuildId}`);
  console.log(`   URL: ${diagnostics.deployment.url}`);
  console.log(`   React Detected: ${diagnostics.deployment.reactDetected}`);
  console.log('\n   VERIFY:');
  console.log('   1. Latest commit deployed: https://vercel.com/dashboard');
  console.log('   2. Build logs show no errors');
  console.log('   3. All chunks loaded successfully (Network tab)');

  // QUICK FIX SUGGESTIONS
  console.log('\n%c🔧 QUICK FIX SUGGESTIONS:', 'font-size: 14px; font-weight: bold; color: #059669;');
  console.log('   1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('   2. Clear cache: DevTools > Network > Disable cache');
  console.log('   3. Try incognito mode to rule out cache issues');
  console.log('   4. Check different browser (Chrome vs Firefox vs Safari)');
  console.log('   5. Wait 2-3 minutes for Vercel deployment to propagate');

  // MANUAL INSPECTION CHECKLIST
  console.log('\n%c📝 MANUAL INSPECTION CHECKLIST:', 'font-size: 14px; font-weight: bold; color: #7C3AED;');
  console.log('   [ ] Can you see 6 tabs at the top of the page?');
  console.log('   [ ] Can you click the Analysis tab?');
  console.log('   [ ] Does clicking Analysis tab show content?');
  console.log('   [ ] Can you click the Progress tab?');
  console.log('   [ ] Does clicking Progress tab show content?');
  console.log('   [ ] Are there any red errors in the console?');
  console.log('   [ ] Are there any 404 errors in Network tab?');

  // EXPORT DIAGNOSTICS
  console.log('\n%c💾 EXPORT DIAGNOSTICS:', 'font-size: 14px; font-weight: bold; color: #0891B2;');
  console.log('   Copy the diagnostics object above and share with the developer');
  console.log('   Or run: copy(diagnostics) to copy to clipboard');

  // Make diagnostics available globally
  window.__PHASE2_DIAGNOSTICS__ = diagnostics;
  console.log('\n%c✅ Diagnostics saved to: window.__PHASE2_DIAGNOSTICS__', 'color: green;');

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    allCriteriaMet,
    diagnostics,
    failedTestNames
  };
})();

