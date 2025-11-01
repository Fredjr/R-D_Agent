/**
 * PHASE 2 WEEK 2 FIXED TEST SCRIPT
 * Tests the 6-tab structure with Analysis and Progress tabs
 * USES DATA-TESTID ATTRIBUTES FOR RELIABLE TAB DETECTION
 * INCLUDES BACKEND DATA VALIDATION
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * EXPECTED RESULT: 100% pass rate (all tests passing)
 */

(async function runPhase2FixedTests() {
  console.log('%c🚀 PHASE 2 WEEK 2 FIXED TEST SCRIPT', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #4F46E5;');
  console.log('Testing 6-tab structure with RELIABLE DATA-TESTID SELECTORS\n');

  let passedTests = 0;
  let failedTests = 0;
  const failedTestNames = [];
  const diagnostics = {
    tabs: {},
    backend: {},
    components: {},
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

  // Wait for page to load
  console.log('%cWaiting 3 seconds for page to fully load...', 'color: #9333EA;');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 1: Tab Structure (Using data-testid)
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 1: Tab Structure (data-testid)');

  const expectedTabIds = ['research-question', 'explore', 'collections', 'notes', 'analysis', 'progress'];
  const tabs = {};
  
  // Find tabs using data-testid
  expectedTabIds.forEach(tabId => {
    const selector = `[data-testid="tab-${tabId}"]`;
    const elements = document.querySelectorAll(selector);
    
    // Filter for visible elements only
    const visibleElements = Array.from(elements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    
    tabs[tabId] = visibleElements.length > 0 ? visibleElements[0] : null;
    logDiagnostic('tabs', `${tabId}Found`, !!tabs[tabId]);
  });

  // Test 1.1: All 6 tabs present
  const allTabsPresent = expectedTabIds.every(id => tabs[id] !== null);
  logTest('1.1 All 6 tabs are present', allTabsPresent, 
    allTabsPresent ? 'All tabs found via data-testid' : `Missing: ${expectedTabIds.filter(id => !tabs[id]).join(', ')}`);

  // Test 1.2: All tabs are clickable
  const allClickable = expectedTabIds.every(id => tabs[id] && !tabs[id].disabled);
  logTest('1.2 All tabs are clickable (not disabled)', allClickable);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 2: Analysis Tab
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 2: Analysis Tab');

  if (tabs.analysis) {
    console.log('%c[ACTION] Clicking Analysis tab...', 'color: #9333EA; font-weight: bold;');
    tabs.analysis.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test 2.1: Analysis tab content exists
  const analysisContent = document.querySelector('[data-testid="analysis-tab-content"]');
  logDiagnostic('components', 'analysisContentFound', !!analysisContent);
  logTest('2.1 Analysis tab content exists', !!analysisContent);

  // Test 2.2: Generate Report button exists
  const generateReportBtn = document.querySelector('[data-testid="generate-report-button"]');
  logDiagnostic('components', 'generateReportBtnFound', !!generateReportBtn);
  logTest('2.2 Generate Report button exists', !!generateReportBtn);

  // Test 2.3: Generate Deep Dive button exists
  const generateDeepDiveBtn = document.querySelector('[data-testid="generate-deep-dive-button"]');
  logDiagnostic('components', 'generateDeepDiveBtnFound', !!generateDeepDiveBtn);
  logTest('2.3 Generate Deep Dive button exists', !!generateDeepDiveBtn);

  // Test 2.4: Filter dropdown exists
  const filterDropdown = document.querySelector('[data-testid="analysis-filter-dropdown"]');
  logDiagnostic('components', 'filterDropdownFound', !!filterDropdown);
  logTest('2.4 Filter dropdown exists', !!filterDropdown);

  // Test 2.5: Sort dropdown exists
  const sortDropdown = document.querySelector('[data-testid="analysis-sort-dropdown"]');
  logDiagnostic('components', 'sortDropdownFound', !!sortDropdown);
  logTest('2.5 Sort dropdown exists', !!sortDropdown);

  // Test 2.6: Empty state or analysis cards exist
  const hasEmptyState = document.body.textContent?.includes('No analyses yet');
  const hasAnalysisCards = document.body.textContent?.includes('REPORT') || document.body.textContent?.includes('DEEP DIVE');
  logTest('2.6 Empty state or analysis cards exist', hasEmptyState || hasAnalysisCards);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 3: Progress Tab
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 3: Progress Tab');

  if (tabs.progress) {
    console.log('%c[ACTION] Clicking Progress tab...', 'color: #9333EA; font-weight: bold;');
    tabs.progress.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test 3.1: Progress tab content exists
  const progressContent = document.querySelector('[data-testid="progress-tab-content"]');
  logDiagnostic('components', 'progressContentFound', !!progressContent);
  logTest('3.1 Progress tab content exists', !!progressContent);

  // Test 3.2: Time range selector exists
  const timeRangeSelector = document.querySelector('[data-testid="time-range-selector"]');
  logTest('3.2 Time range selector exists', !!timeRangeSelector);

  // Test 3.3-3.6: Metric cards exist
  const papersMetric = document.body.textContent?.includes('Papers');
  const notesMetric = document.body.textContent?.includes('Notes');
  const collectionsMetric = document.body.textContent?.includes('Collections');
  const analysesMetric = document.body.textContent?.includes('Analyses');
  
  logTest('3.3 Papers metric card exists', papersMetric);
  logTest('3.4 Notes metric card exists', notesMetric);
  logTest('3.5 Collections metric card exists', collectionsMetric);
  logTest('3.6 Analyses metric card exists', analysesMetric);

  // Test 3.7-3.9: Sections exist
  const projectTimeline = document.body.textContent?.includes('Project Timeline');
  const recentActivity = document.body.textContent?.includes('Recent Activity');
  const researchInsights = document.body.textContent?.includes('Research Insights');
  
  logTest('3.7 Project Timeline section exists', projectTimeline);
  logTest('3.8 Recent Activity section exists', recentActivity);
  logTest('3.9 Research Insights section exists', researchInsights);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 4: Tab Navigation Flow
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 4: Tab Navigation Flow');

  // Test 4.1: Navigate to Research Question tab
  if (tabs['research-question']) {
    tabs['research-question'].click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const hasResearchQuestionContent = document.body.textContent?.includes('Research Question') || 
                                      document.body.textContent?.includes('research question');
  logTest('4.1 Can navigate to Research Question tab', hasResearchQuestionContent);

  // Test 4.2: Navigate to Explore Papers tab
  if (tabs.explore) {
    tabs.explore.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const hasExploreContent = document.body.textContent?.includes('Explore') || 
                            document.body.textContent?.includes('PubMed');
  logTest('4.2 Can navigate to Explore Papers tab', hasExploreContent);

  // Test 4.3: Navigate to My Collections tab
  if (tabs.collections) {
    tabs.collections.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const hasCollectionsContent = document.body.textContent?.includes('Collections') || 
                                 document.body.textContent?.includes('Create Collection');
  logTest('4.3 Can navigate to My Collections tab', hasCollectionsContent);

  // Test 4.4: Navigate to Notes & Ideas tab
  if (tabs.notes) {
    tabs.notes.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const hasNotesContent = document.body.textContent?.includes('research notes') || 
                          document.body.textContent?.includes('Filters');
  logTest('4.4 Can navigate to Notes & Ideas tab', hasNotesContent);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 5: Backend Data Validation
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 5: Backend Data Validation');

  // Try to extract project data from Next.js
  let projectData = null;
  if (window.__NEXT_DATA__?.props?.pageProps?.project) {
    projectData = window.__NEXT_DATA__.props.pageProps.project;
  }

  if (projectData) {
    logDiagnostic('backend', 'projectDataFound', true);
    logDiagnostic('backend', 'projectId', projectData.project_id);
    logDiagnostic('backend', 'projectName', projectData.project_name);
    
    // Test 5.1: Project has ID
    logTest('5.1 Project has valid ID', !!projectData.project_id);
    
    // Test 5.2: Project has name
    logTest('5.2 Project has name', !!projectData.project_name);
    
    // Test 5.3: Reports array exists
    const hasReports = Array.isArray(projectData.reports);
    logDiagnostic('backend', 'reportsArray', hasReports);
    logDiagnostic('backend', 'reportsCount', projectData.reports?.length || 0);
    logTest('5.3 Project has reports array', hasReports);
    
    // Test 5.4: Deep dives array exists
    const hasDeepDives = Array.isArray(projectData.deep_dives) || Array.isArray(projectData.deep_dive_analyses);
    logDiagnostic('backend', 'deepDivesArray', hasDeepDives);
    logDiagnostic('backend', 'deepDivesCount', (projectData.deep_dives?.length || 0) + (projectData.deep_dive_analyses?.length || 0));
    logTest('5.4 Project has deep_dives array', hasDeepDives);
    
    // Test 5.5: Annotations array exists
    const hasAnnotations = Array.isArray(projectData.annotations);
    logDiagnostic('backend', 'annotationsArray', hasAnnotations);
    logDiagnostic('backend', 'annotationsCount', projectData.annotations?.length || 0);
    logTest('5.5 Project has annotations array', hasAnnotations);
    
    // Test 5.6: Collections array exists
    const hasCollections = Array.isArray(projectData.collections);
    logDiagnostic('backend', 'collectionsArray', hasCollections);
    logDiagnostic('backend', 'collectionsCount', projectData.collections?.length || 0);
    logTest('5.6 Project has collections array', hasCollections);
    
    console.log('\n%c📊 PROJECT DATA SUMMARY:', 'font-weight: bold; color: #2563EB;');
    console.log(`  Project ID: ${projectData.project_id}`);
    console.log(`  Project Name: ${projectData.project_name}`);
    console.log(`  Reports: ${projectData.reports?.length || 0}`);
    console.log(`  Deep Dives: ${(projectData.deep_dives?.length || 0) + (projectData.deep_dive_analyses?.length || 0)}`);
    console.log(`  Annotations: ${projectData.annotations?.length || 0}`);
    console.log(`  Collections: ${projectData.collections?.length || 0}`);
    console.log(`  Total Papers: ${projectData.total_papers || 0}`);
  } else {
    logDiagnostic('backend', 'projectDataFound', false);
    console.log('%c⚠ Project data not found in window.__NEXT_DATA__', 'color: orange;');
    logTest('5.1 Project data accessible', false);
  }

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
    { name: 'All 6 tabs present and accessible', passed: allTabsPresent },
    { name: 'All tabs are clickable and functional', passed: allClickable },
    { name: 'Analysis tab renders correctly', passed: !!analysisContent },
    { name: 'Analysis tab has generate buttons', passed: !!generateReportBtn && !!generateDeepDiveBtn },
    { name: 'Analysis tab has filter/sort options', passed: !!filterDropdown && !!sortDropdown },
    { name: 'Progress tab renders correctly', passed: !!progressContent },
    { name: 'Progress tab has all metric cards', passed: papersMetric && notesMetric && collectionsMetric && analysesMetric },
    { name: 'Progress tab has timeline and insights', passed: projectTimeline && recentActivity && researchInsights },
    { name: 'Tab navigation works smoothly', passed: hasResearchQuestionContent && hasExploreContent && hasCollectionsContent && hasNotesContent },
    { name: 'Backend data is properly structured', passed: !!projectData }
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

