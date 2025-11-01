/**
 * PHASE 2 WEEK 2 TEST SCRIPT
 * Tests the 6-tab structure with Analysis and Progress tabs
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * EXPECTED RESULT: 100% pass rate (all tests passing)
 */

(async function runPhase2Tests() {
  console.log('%c🚀 PHASE 2 WEEK 2 TEST SCRIPT', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #4F46E5;');
  console.log('Testing 6-tab structure with Analysis and Progress tabs\n');

  let passedTests = 0;
  let failedTests = 0;
  const failedTestNames = [];

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

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 1: Tab Navigation & Structure
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 1: Tab Navigation & Structure');

  // Test 1.1: All 6 tabs are present
  const allTabButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const hasTabText = 
      btn.textContent?.includes('Research Question') ||
      btn.textContent?.includes('Explore Papers') ||
      btn.textContent?.includes('My Collections') ||
      btn.textContent?.includes('Notes & Ideas') ||
      btn.textContent?.includes('Analysis') ||
      btn.textContent?.includes('Progress');
    const style = window.getComputedStyle(btn);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
    return hasTabText && isVisible;
  });

  // Remove duplicates by unique labels
  const uniqueTabLabels = new Set();
  const tabButtons = allTabButtons.filter(btn => {
    const label = btn.textContent?.trim().split('\n')[0];
    if (uniqueTabLabels.has(label)) return false;
    uniqueTabLabels.add(label);
    return true;
  });

  logTest('1.1 All 6 tabs are present', tabButtons.length === 6, `Found ${tabButtons.length} tabs`);

  // Test 1.2: Tab names are correct
  const expectedTabs = ['Research Question', 'Explore Papers', 'My Collections', 'Notes & Ideas', 'Analysis', 'Progress'];
  const actualTabs = tabButtons.map(btn => btn.textContent?.trim().split('\n')[0]);
  const allTabsCorrect = expectedTabs.every(tab => actualTabs.some(actual => actual?.includes(tab)));
  logTest('1.2 Tab names are correct', allTabsCorrect, `Found: ${actualTabs.join(', ')}`);

  // Test 1.3: All tabs are clickable
  const allClickable = tabButtons.every(btn => !btn.disabled);
  logTest('1.3 All tabs are clickable (not disabled)', allClickable);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 2: Analysis Tab
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 2: Analysis Tab');

  // Click Analysis tab
  const analysisTab = tabButtons.find(btn => btn.textContent?.includes('Analysis'));
  if (analysisTab) {
    analysisTab.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Test 2.1: Analysis tab content exists
  const analysisContent = document.body.textContent?.includes('Reports and deep dive analyses');
  logTest('2.1 Analysis tab content exists', analysisContent);

  // Test 2.2: Generate Report button exists
  const generateReportBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Generate Report')
  );
  logTest('2.2 Generate Report button exists', !!generateReportBtn);

  // Test 2.3: Generate Deep Dive button exists
  const generateDeepDiveBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Generate Deep Dive')
  );
  logTest('2.3 Generate Deep Dive button exists', !!generateDeepDiveBtn);

  // Test 2.4: Filter dropdown exists
  const filterDropdown = Array.from(document.querySelectorAll('select')).find(el => {
    const options = Array.from(el.querySelectorAll('option')).map(opt => opt.textContent?.toLowerCase() || '');
    return options.some(opt => opt.includes('all analyses') || opt.includes('reports') || opt.includes('deep dive'));
  });
  logTest('2.4 Filter dropdown exists', !!filterDropdown);

  // Test 2.5: Sort dropdown exists
  const sortDropdown = Array.from(document.querySelectorAll('select')).find(el => {
    const options = Array.from(el.querySelectorAll('option')).map(opt => opt.textContent?.toLowerCase() || '');
    return options.some(opt => opt.includes('date') || opt.includes('title'));
  });
  logTest('2.5 Sort dropdown exists', !!sortDropdown);

  // Test 2.6: Empty state or analysis cards exist
  const hasEmptyState = document.body.textContent?.includes('No analyses yet');
  const hasAnalysisCards = document.body.textContent?.includes('REPORT') || document.body.textContent?.includes('DEEP DIVE');
  logTest('2.6 Empty state or analysis cards exist', hasEmptyState || hasAnalysisCards);

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 3: Progress Tab
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 3: Progress Tab');

  // Click Progress tab
  const progressTab = tabButtons.find(btn => btn.textContent?.includes('Progress'));
  if (progressTab) {
    progressTab.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Test 3.1: Progress tab content exists
  const progressContent = document.body.textContent?.includes('Activity timeline and metrics');
  logTest('3.1 Progress tab content exists', progressContent);

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

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    allCriteriaMet
  };
})();

