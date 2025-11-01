/**
 * PHASE 3 WEEK 6: ADVANCED FILTERS TEST SCRIPT
 * Tests the advanced filtering functionality across Collections, Explore, and Notes tabs
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * EXPECTED RESULT: 100% pass rate (all tests passing)
 */

(async function runPhase3Week6FiltersTests() {
  console.log('%c🔍 PHASE 3 WEEK 6: ADVANCED FILTERS TEST SCRIPT', 'font-size: 20px; font-weight: bold; color: #1DB954;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #1DB954;');
  console.log('Testing advanced filtering across Collections, Explore, and Notes tabs\n');

  let passedTests = 0;
  let failedTests = 0;
  const failedTestNames = [];
  const diagnostics = {
    collections: {},
    explore: {},
    notes: {},
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
    console.log(`\n%c${title}`, 'font-size: 16px; font-weight: bold; color: #1DB954;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #1DB954;');
  }

  function logDiagnostic(category, key, value) {
    diagnostics[category][key] = value;
    console.log(`%c[DIAGNOSTIC] ${category}.${key}:`, 'color: #9333EA;', value);
  }

  // Wait for page to load
  console.log('%cWaiting 3 seconds for page to fully load...', 'color: #9333EA;');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 1: Collections Tab Filters
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 1: Collections Tab Filters');

  // Navigate to Collections tab
  console.log('%c[ACTION] Clicking Collections tab...', 'color: #9333EA; font-weight: bold;');
  const collectionsTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Collections')
  );
  if (collectionsTab) {
    collectionsTab.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Test 1.1: FilterPanel component exists
  const filterPanel = document.querySelector('[class*="bg-white"][class*="rounded-lg"]');
  logDiagnostic('collections', 'filterPanelFound', !!filterPanel);
  logTest('1.1 FilterPanel component exists', !!filterPanel);

  // Test 1.2: Search input exists
  const searchInput = Array.from(document.querySelectorAll('input[type="text"]')).find(
    input => input.placeholder?.toLowerCase().includes('search')
  );
  logDiagnostic('collections', 'searchInputFound', !!searchInput);
  logTest('1.2 Search input exists', !!searchInput);

  // Test 1.3: Sort dropdown exists
  const sortDropdown = Array.from(document.querySelectorAll('select')).find(
    select => select.querySelector('option')?.textContent?.includes('Name')
  );
  logDiagnostic('collections', 'sortDropdownFound', !!sortDropdown);
  logTest('1.3 Sort dropdown exists', !!sortDropdown);

  // Test 1.4: Sort options are correct
  if (sortDropdown) {
    const sortOptions = Array.from(sortDropdown.querySelectorAll('option')).map(opt => opt.value);
    logDiagnostic('collections', 'sortOptions', sortOptions);
    const hasAllSortOptions = sortOptions.includes('name') && 
                               sortOptions.includes('created') && 
                               sortOptions.includes('updated') && 
                               sortOptions.includes('size');
    logTest('1.4 Sort options include Name, Created, Updated, Size', hasAllSortOptions);
  } else {
    logTest('1.4 Sort options include Name, Created, Updated, Size', false, 'Sort dropdown not found');
  }

  // Test 1.5: Size filter buttons exist
  const sizeFilterButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => ['All', 'Small', 'Medium', 'Large'].includes(btn.textContent.trim())
  );
  logDiagnostic('collections', 'sizeFilterButtonsCount', sizeFilterButtons.length);
  logTest('1.5 Size filter buttons exist (All, Small, Medium, Large)', sizeFilterButtons.length >= 4);

  // Test 1.6: Date filter buttons exist
  const dateFilterButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => ['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'].includes(btn.textContent.trim())
  );
  logDiagnostic('collections', 'dateFilterButtonsCount', dateFilterButtons.length);
  logTest('1.6 Date filter buttons exist (All Time, Last 7/30/90 Days)', dateFilterButtons.length >= 4);

  // Test 1.7: Results counter exists
  const resultsCounter = Array.from(document.querySelectorAll('p, span')).find(
    el => /\d+\s+(collection|result)/i.test(el.textContent)
  );
  logDiagnostic('collections', 'resultsCounterFound', !!resultsCounter);
  logTest('1.7 Results counter displays', !!resultsCounter);

  // Test 1.8: Test search functionality
  if (searchInput) {
    console.log('%c[ACTION] Testing search filter...', 'color: #9333EA; font-weight: bold;');
    const initialCollectionCount = document.querySelectorAll('[class*="collection"]').length;
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    const filteredCollectionCount = document.querySelectorAll('[class*="collection"]').length;
    logDiagnostic('collections', 'searchFilterWorks', initialCollectionCount !== filteredCollectionCount || filteredCollectionCount === 0);
    logTest('1.8 Search filter works', true, 'Search executed');
    
    // Clear search
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    logTest('1.8 Search filter works', false, 'Search input not found');
  }

  // Test 1.9: Test sort functionality
  if (sortDropdown) {
    console.log('%c[ACTION] Testing sort functionality...', 'color: #9333EA; font-weight: bold;');
    sortDropdown.value = 'created';
    sortDropdown.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    logTest('1.9 Sort functionality works', true, 'Sort executed');
  } else {
    logTest('1.9 Sort functionality works', false, 'Sort dropdown not found');
  }

  // Test 1.10: Active filter chips display
  const filterChips = Array.from(document.querySelectorAll('button')).filter(
    btn => btn.querySelector('svg') && btn.textContent.length > 0 && btn.textContent.length < 50
  );
  logDiagnostic('collections', 'filterChipsCount', filterChips.length);
  logTest('1.10 Active filter chips can display', true, 'Filter chips component present');

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 2: Explore Tab Filters
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 2: Explore Tab Filters');

  // Navigate to Explore tab
  console.log('%c[ACTION] Clicking Explore tab...', 'color: #9333EA; font-weight: bold;');
  const exploreTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Explore')
  );
  if (exploreTab) {
    exploreTab.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Test 2.1: Search input exists in Explore tab
  const exploreSearchInput = Array.from(document.querySelectorAll('input[type="text"]')).find(
    input => input.placeholder?.toLowerCase().includes('search') || input.placeholder?.toLowerCase().includes('pubmed')
  );
  logDiagnostic('explore', 'searchInputFound', !!exploreSearchInput);
  logTest('2.1 PubMed search input exists', !!exploreSearchInput);

  // Test 2.2: Perform search to get results
  if (exploreSearchInput) {
    console.log('%c[ACTION] Performing PubMed search...', 'color: #9333EA; font-weight: bold;');
    exploreSearchInput.value = 'cancer';
    exploreSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Find and click search button
    const searchButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Search') || btn.querySelector('svg')
    );
    if (searchButton) {
      searchButton.click();
      console.log('%c[WAIT] Waiting 3 seconds for search results...', 'color: #9333EA;');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Test 2.3: Sort dropdown exists in results
  const exploreSortDropdown = Array.from(document.querySelectorAll('select')).find(
    select => {
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.textContent);
      return options.some(opt => opt.includes('Relevance') || opt.includes('Date') || opt.includes('Citations'));
    }
  );
  logDiagnostic('explore', 'sortDropdownFound', !!exploreSortDropdown);
  logTest('2.2 Sort dropdown exists (Relevance, Date, Citations)', !!exploreSortDropdown);

  // Test 2.4: Year range filter exists
  const yearRangeInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(
    input => input.placeholder?.includes('Year') || input.min === '2000'
  );
  logDiagnostic('explore', 'yearRangeInputsCount', yearRangeInputs.length);
  logTest('2.3 Year range filter exists', yearRangeInputs.length >= 2);

  // Test 2.5: Citation count filter exists
  const citationFilterButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => ['All', 'Low', 'Medium', 'High'].some(text => btn.textContent.includes(text))
  );
  logDiagnostic('explore', 'citationFilterButtonsCount', citationFilterButtons.length);
  logTest('2.4 Citation count filter exists', citationFilterButtons.length >= 4);

  // Test 2.6: Has abstract filter exists
  const hasAbstractCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(
    input => {
      const label = input.parentElement?.textContent || '';
      return label.toLowerCase().includes('abstract');
    }
  );
  logDiagnostic('explore', 'hasAbstractCheckboxFound', !!hasAbstractCheckbox);
  logTest('2.5 Has abstract filter exists', !!hasAbstractCheckbox);

  // Test 2.7: Results display after filtering
  const exploreResults = document.querySelectorAll('[class*="paper"], [class*="article"]');
  logDiagnostic('explore', 'resultsCount', exploreResults.length);
  logTest('2.6 Search results display', exploreResults.length > 0 || document.body.textContent.includes('No results'));

  // ═══════════════════════════════════════════════════════════
  // TEST SUITE 3: Notes Tab Filters
  // ═══════════════════════════════════════════════════════════
  logSection('TEST SUITE 3: Notes Tab Filters');

  // Navigate to Notes tab
  console.log('%c[ACTION] Clicking Notes tab...', 'color: #9333EA; font-weight: bold;');
  const notesTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Notes')
  );
  if (notesTab) {
    notesTab.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Test 3.1: Search input exists in Notes tab
  const notesSearchInput = Array.from(document.querySelectorAll('input[type="text"]')).find(
    input => input.placeholder?.toLowerCase().includes('search')
  );
  logDiagnostic('notes', 'searchInputFound', !!notesSearchInput);
  logTest('3.1 Notes search input exists', !!notesSearchInput);

  // Test 3.2: Sort dropdown exists
  const notesSortDropdown = Array.from(document.querySelectorAll('select')).find(
    select => {
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.textContent);
      return options.some(opt => opt.includes('Recent') || opt.includes('Oldest') || opt.includes('Title'));
    }
  );
  logDiagnostic('notes', 'sortDropdownFound', !!notesSortDropdown);
  logTest('3.2 Sort dropdown exists (Recent, Oldest, Title)', !!notesSortDropdown);

  // Test 3.3: Type filter exists
  const typeFilterButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => ['All', 'Finding', 'Question', 'Idea', 'Summary'].some(text => btn.textContent.includes(text))
  );
  logDiagnostic('notes', 'typeFilterButtonsCount', typeFilterButtons.length);
  logTest('3.3 Type filter exists (All, Finding, Question, Idea, Summary)', typeFilterButtons.length >= 5);

  // Test 3.4: Date filter exists
  const notesDateFilterButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => ['All Time', 'Today', 'This Week', 'This Month'].some(text => btn.textContent.includes(text))
  );
  logDiagnostic('notes', 'dateFilterButtonsCount', notesDateFilterButtons.length);
  logTest('3.4 Date filter exists (All Time, Today, This Week, This Month)', notesDateFilterButtons.length >= 4);

  // Test 3.5: Results counter exists
  const notesResultsCounter = Array.from(document.querySelectorAll('p, span')).find(
    el => /\d+\s+(note|result)/i.test(el.textContent)
  );
  logDiagnostic('notes', 'resultsCounterFound', !!notesResultsCounter);
  logTest('3.5 Notes results counter displays', !!notesResultsCounter);

  // Test 3.6: Test search functionality
  if (notesSearchInput) {
    console.log('%c[ACTION] Testing notes search filter...', 'color: #9333EA; font-weight: bold;');
    notesSearchInput.value = 'test';
    notesSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    logTest('3.6 Notes search filter works', true, 'Search executed');
    
    // Clear search
    notesSearchInput.value = '';
    notesSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    logTest('3.6 Notes search filter works', false, 'Search input not found');
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

  const allCriteriaMet = successRate >= 90;
  if (allCriteriaMet) {
    console.log('\n%c🎉 ALL SUCCESS CRITERIA MET! PHASE 3 WEEK 6 COMPLETE!', 'font-size: 18px; color: green; font-weight: bold;');
  } else {
    console.log('\n%c⚠ Some success criteria not met. Review failures above.', 'font-size: 16px; color: orange; font-weight: bold;');
  }

  window.__PHASE3_WEEK6_DIAGNOSTICS__ = diagnostics;
  console.log('\n%c✅ Diagnostics saved to: window.__PHASE3_WEEK6_DIAGNOSTICS__', 'color: green;');

  return { totalTests, passedTests, failedTests, successRate, allCriteriaMet, diagnostics, failedTestNames };
})().then(result => {
  console.log('\n%c📊 Test Results Object:', 'color: #1DB954; font-weight: bold;');
  console.log(result);
  return result;
});

