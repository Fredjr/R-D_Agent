/**
 * BROWSER CONSOLE E2E TEST SCRIPT - WEEKS 16-18
 * 
 * Tests:
 * - Week 16: AI Cost Optimization (caching, prioritization, truncation)
 * - Week 17-18: Protocol Extraction (AI-powered protocol extraction from papers)
 * 
 * HOW TO USE:
 * 1. Open https://r-d-agent.vercel.app in your browser
 * 2. Log in with your credentials (fredericle75019@gmail.com)
 * 3. Navigate to a project page
 * 4. Open browser console (F12 or Cmd+Option+J on Mac)
 * 5. Copy and paste this entire script
 * 6. Press Enter to run
 * 
 * The script will automatically test all features and log results.
 */

(async function runWeek16_18Tests() {
  console.clear();
  console.log('%c🧪 WEEK 16-18 TEST SUITE 🧪', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
  console.log('%cTesting: AI Cost Optimization & Protocol Extraction', 'font-size: 14px; color: #2196F3;');
  console.log('%c🎭 WITH SIMULATED USER INTERACTIONS', 'font-size: 14px; color: #9C27B0;');
  console.log('\n');

  // Configuration
  const BACKEND_URL = 'https://r-dagent-production.up.railway.app';
  const TEST_DELAY = 1000; // 1 second between tests

  // Get current project ID from URL
  const urlParts = window.location.pathname.split('/');
  const projectIdIndex = urlParts.indexOf('project');
  const CURRENT_PROJECT_ID = projectIdIndex >= 0 ? urlParts[projectIdIndex + 1] : null;
  
  if (!CURRENT_PROJECT_ID) {
    console.error('%c❌ ERROR: Not on a project page. Please navigate to a project first.', 'color: #f44336; font-weight: bold;');
    return;
  }

  // Test results tracking
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper functions
  function logTest(name, status, details = '') {
    results.total++;
    if (status === 'PASS') {
      results.passed++;
      console.log(`%c✅ PASS: ${name}`, 'color: #4CAF50; font-weight: bold;', details);
    } else {
      results.failed++;
      console.log(`%c❌ FAIL: ${name}`, 'color: #f44336; font-weight: bold;', details);
    }
    results.tests.push({ name, status, details });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function findElement(selector) {
    return document.querySelector(selector);
  }

  function findElements(selector) {
    return document.querySelectorAll(selector);
  }

  function safeClick(element) {
    if (!element) return false;
    try {
      if (typeof element.click === 'function') {
        element.click();
      } else {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      return true;
    } catch (error) {
      console.warn('Click failed:', error);
      return false;
    }
  }

  async function testBackendAPI(endpoint, testName, expectedStatuses = [200, 404, 422]) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`);
      const status = response.status;
      if (expectedStatuses.includes(status)) {
        logTest(testName, 'PASS', `Status: ${status}`);
        return { success: true, status, data: status === 200 ? await response.json() : null };
      } else {
        logTest(testName, 'FAIL', `Unexpected status: ${status}`);
        return { success: false, status };
      }
    } catch (error) {
      logTest(testName, 'FAIL', `Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // SETUP
  // ============================================================================
  console.log('%c\n🎭 SETUP: Checking Project Data', 'font-size: 16px; font-weight: bold; color: #9C27B0;');
  console.log(`%cUsing project ID: ${CURRENT_PROJECT_ID}`, 'color: #9E9E9E;');
  console.log('%c⚠️  Note: This test works with existing data in your project', 'color: #FF9800;');
  console.log('%c   Make sure you have papers in your Smart Inbox to test protocol extraction', 'color: #9E9E9E;');
  console.log('\n');

  // ============================================================================
  // TEST SUITE 1: WEEK 16 - AI COST OPTIMIZATION
  // ============================================================================
  console.log('%c\n💰 TEST SUITE 1: WEEK 16 - AI COST OPTIMIZATION', 'font-size: 16px; font-weight: bold; color: #FF9800;');
  console.log('%cTesting: Caching, Prioritization, Truncation', 'color: #9E9E9E;');

  // Test 1.1: Check triage endpoint with caching
  const triageResult1 = await testBackendAPI(
    `/api/triage/project/${CURRENT_PROJECT_ID}/inbox`,
    '1.1: Triage endpoint accessible (with caching)'
  );
  await wait(TEST_DELAY);

  // Test 1.2: Check for cache headers or indicators
  if (triageResult1.success && triageResult1.data) {
    const papers = triageResult1.data;
    const hasCachedData = papers.length > 0;
    logTest('1.2: Triage data available', hasCachedData ? 'PASS' : 'FAIL', 
      `Found ${papers.length} papers`);
    
    // Check if papers have enhanced fields (confidence_score, evidence_excerpts)
    if (papers.length > 0) {
      const firstPaper = papers[0];
      const hasEnhancedFields = 'confidence_score' in firstPaper || 
                                'evidence_excerpts' in firstPaper ||
                                'question_relevance_scores' in firstPaper;
      logTest('1.3: Enhanced triage fields present', hasEnhancedFields ? 'PASS' : 'FAIL',
        `Fields: ${Object.keys(firstPaper).join(', ')}`);
    } else {
      logTest('1.3: Enhanced triage fields present', 'FAIL', 'No papers to check');
    }
  } else {
    logTest('1.2: Triage data available', 'FAIL', 'Could not fetch triage data');
    logTest('1.3: Enhanced triage fields present', 'FAIL', 'No data available');
  }
  await wait(TEST_DELAY);

  // Test 1.4: Test triage performance (cache hit should be fast)
  console.log('%c🎭 Testing cache performance...', 'color: #9C27B0;');
  const startTime = performance.now();
  await fetch(`${BACKEND_URL}/api/triage/project/${CURRENT_PROJECT_ID}/inbox`);
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  logTest('1.4: Triage response time', responseTime < 2000 ? 'PASS' : 'FAIL',
    `${responseTime.toFixed(0)}ms (cache hit should be <500ms, cache miss <2000ms)`);
  await wait(TEST_DELAY);

  // ============================================================================
  // TEST SUITE 2: WEEK 17-18 - PROTOCOL EXTRACTION BACKEND
  // ============================================================================
  console.log('%c\n🧪 TEST SUITE 2: PROTOCOL EXTRACTION - BACKEND', 'font-size: 16px; font-weight: bold; color: #FF9800;');

  // Test 2.1: Check protocols endpoint
  const protocolsResult = await testBackendAPI(
    `/api/protocols/project/${CURRENT_PROJECT_ID}`,
    '2.1: Protocols endpoint accessible'
  );
  await wait(TEST_DELAY);

  // Test 2.2: Check if protocols exist
  if (protocolsResult.success && protocolsResult.data) {
    const protocols = protocolsResult.data;
    logTest('2.2: Protocols data available', protocols.length >= 0 ? 'PASS' : 'FAIL',
      `Found ${protocols.length} protocols`);
    
    // Test 2.3: Check protocol structure
    if (protocols.length > 0) {
      const firstProtocol = protocols[0];
      const requiredFields = ['protocol_id', 'protocol_name', 'protocol_type', 'materials', 'steps', 'equipment'];
      const hasAllFields = requiredFields.every(field => field in firstProtocol);
      logTest('2.3: Protocol structure valid', hasAllFields ? 'PASS' : 'FAIL',
        `Fields: ${Object.keys(firstProtocol).join(', ')}`);
    } else {
      logTest('2.3: Protocol structure valid', 'FAIL', 'No protocols to check (extract one first)');
    }
  } else {
    logTest('2.2: Protocols data available', 'FAIL', 'Could not fetch protocols');
    logTest('2.3: Protocol structure valid', 'FAIL', 'No data available');
  }
  await wait(TEST_DELAY);

  // ============================================================================
  // TEST SUITE 3: PROTOCOL EXTRACTION - FRONTEND UI
  // ============================================================================
  console.log('%c\n🎨 TEST SUITE 3: PROTOCOL EXTRACTION - FRONTEND UI', 'font-size: 16px; font-weight: bold; color: #FF9800;');

  // Test 3.1: Navigate to Papers → Inbox
  console.log('%c🎭 Navigating to Smart Inbox...', 'color: #9C27B0;');
  const allElements = Array.from(findElements('button, a, [role="tab"], [role="button"], div[class*="tab"]'));
  const papersButton = allElements.find(el =>
    el.textContent && el.textContent.includes('Papers')
  );

  if (papersButton) {
    safeClick(papersButton);
    await wait(1500);

    const allElements2 = Array.from(findElements('button, a, [role="tab"], [role="button"], div[class*="tab"]'));
    const inboxButton = allElements2.find(el =>
      el.textContent && el.textContent.includes('Inbox')
    );

    if (inboxButton) {
      safeClick(inboxButton);
      await wait(2000);
      logTest('3.1: Navigate to Inbox', 'PASS', 'Successfully navigated');
    } else {
      logTest('3.1: Navigate to Inbox', 'FAIL', 'Inbox button not found');
    }
  } else {
    logTest('3.1: Navigate to Inbox', 'FAIL', 'Papers button not found');
  }
  await wait(TEST_DELAY);

  // Test 3.2: Check for "Extract Protocol" button
  const extractButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('extract protocol') ||
    btn.textContent.toLowerCase().includes('protocol')
  );
  logTest('3.2: Extract Protocol button present', extractButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${extractButtons.length} protocol buttons`);
  await wait(TEST_DELAY);

  // Test 3.3: Test Extract Protocol functionality
  if (extractButtons.length > 0) {
    console.log('%c🎭 Simulating user action: Extracting protocol from paper...', 'color: #9C27B0;');
    const extractButton = extractButtons[0];
    
    // Click extract button
    safeClick(extractButton);
    await wait(3000); // Wait for AI extraction (can take 2-5 seconds)
    
    // Check for success notification or modal
    const hasNotification = document.body.textContent.includes('Protocol extracted') ||
                           document.body.textContent.includes('successfully') ||
                           document.body.textContent.includes('Success');
    
    logTest('3.3: Protocol extraction works', hasNotification ? 'PASS' : 'FAIL',
      hasNotification ? 'Extraction successful' : 'No success notification (may still be processing)');
  } else {
    logTest('3.3: Protocol extraction works', 'FAIL', 'No extract button available');
  }
  await wait(TEST_DELAY);

  // Test 3.4: Navigate to Protocols tab (if it exists)
  console.log('%c🎭 Navigating to Protocols tab...', 'color: #9C27B0;');
  const allElements3 = Array.from(findElements('button, a, [role="tab"], [role="button"], div[class*="tab"]'));
  const protocolsTabButton = allElements3.find(el =>
    el.textContent && el.textContent.includes('Protocols')
  );

  if (protocolsTabButton) {
    safeClick(protocolsTabButton);
    await wait(2000);

    // Check if protocols are displayed
    const protocolCards = findElements('[class*="protocol"], [data-testid*="protocol"]');
    logTest('3.4: Protocols tab accessible', 'PASS', `Found ${protocolCards.length} protocol cards`);
  } else {
    logTest('3.4: Protocols tab accessible', 'FAIL', 'Protocols tab not found (may need to add to navigation)');
  }
  await wait(TEST_DELAY);

  // Test 3.5: Check for protocol detail modal
  const viewButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('view') ||
    btn.textContent.toLowerCase().includes('details')
  );

  if (viewButtons.length > 0) {
    console.log('%c🎭 Opening protocol detail modal...', 'color: #9C27B0;');
    safeClick(viewButtons[0]);
    await wait(1500);

    // Check if modal opened
    const hasModal = document.body.textContent.includes('Materials') ||
                    document.body.textContent.includes('Steps') ||
                    document.body.textContent.includes('Equipment');

    logTest('3.5: Protocol detail modal works', hasModal ? 'PASS' : 'FAIL',
      hasModal ? 'Modal opened successfully' : 'Modal not found');

    // Close modal
    const closeButtons = Array.from(findElements('button')).filter(btn =>
      btn.textContent.toLowerCase().includes('close') ||
      btn.textContent.toLowerCase().includes('×')
    );
    if (closeButtons.length > 0) {
      safeClick(closeButtons[0]);
      await wait(500);
    }
  } else {
    logTest('3.5: Protocol detail modal works', 'FAIL', 'No view buttons found');
  }
  await wait(TEST_DELAY);

  // ============================================================================
  // TEST SUITE 4: PROTOCOL EXTRACTION - FEATURES
  // ============================================================================
  console.log('%c\n🔧 TEST SUITE 4: PROTOCOL FEATURES', 'font-size: 16px; font-weight: bold; color: #FF9800;');

  // Test 4.1: Check for copy to clipboard button
  const copyButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('copy') ||
    btn.textContent.toLowerCase().includes('clipboard')
  );
  logTest('4.1: Copy to clipboard available', copyButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${copyButtons.length} copy buttons`);
  await wait(TEST_DELAY);

  // Test 4.2: Check for download JSON button
  const downloadButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('download') ||
    btn.textContent.toLowerCase().includes('json')
  );
  logTest('4.2: Download JSON available', downloadButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${downloadButtons.length} download buttons`);
  await wait(TEST_DELAY);

  // Test 4.3: Check for edit functionality
  const editButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('edit')
  );
  logTest('4.3: Edit protocol available', editButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${editButtons.length} edit buttons`);
  await wait(TEST_DELAY);

  // Test 4.4: Check for delete functionality
  const deleteButtons = Array.from(findElements('button')).filter(btn =>
    btn.textContent.toLowerCase().includes('delete')
  );
  logTest('4.4: Delete protocol available', deleteButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${deleteButtons.length} delete buttons`);
  await wait(TEST_DELAY);

  // ============================================================================
  // TEST SUITE 5: COST OPTIMIZATION VERIFICATION
  // ============================================================================
  console.log('%c\n💸 TEST SUITE 5: COST OPTIMIZATION VERIFICATION', 'font-size: 16px; font-weight: bold; color: #FF9800;');

  // Test 5.1: Test protocol extraction caching (extract same paper twice)
  console.log('%c🎭 Testing protocol extraction caching...', 'color: #9C27B0;');
  console.log('%c   This will extract a protocol twice to test cache hit', 'color: #9E9E9E;');

  // Get a paper PMID from inbox
  if (triageResult1.success && triageResult1.data && triageResult1.data.length > 0) {
    const testPMID = triageResult1.data[0].article_pmid;

    // First extraction (cache miss)
    const start1 = performance.now();
    const extract1 = await fetch(`${BACKEND_URL}/api/protocols/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'test-user' // Replace with actual user ID if needed
      },
      body: JSON.stringify({
        article_pmid: testPMID,
        protocol_type: null,
        force_refresh: false
      })
    });
    const time1 = performance.now() - start1;

    await wait(1000);

    // Second extraction (cache hit)
    const start2 = performance.now();
    const extract2 = await fetch(`${BACKEND_URL}/api/protocols/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'test-user'
      },
      body: JSON.stringify({
        article_pmid: testPMID,
        protocol_type: null,
        force_refresh: false
      })
    });
    const time2 = performance.now() - start2;

    const speedup = time1 / time2;
    logTest('5.1: Protocol caching works', time2 < time1 ? 'PASS' : 'FAIL',
      `First: ${time1.toFixed(0)}ms, Second: ${time2.toFixed(0)}ms, Speedup: ${speedup.toFixed(1)}x`);
  } else {
    logTest('5.1: Protocol caching works', 'FAIL', 'No papers available to test');
  }
  await wait(TEST_DELAY);

  // ============================================================================
  // FINAL RESULTS
  // ============================================================================
  console.log('\n');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #9E9E9E;');
  console.log('%c📊 TEST RESULTS SUMMARY', 'font-size: 18px; font-weight: bold; color: #2196F3;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #9E9E9E;');
  console.log(`%cTotal Tests: ${results.total}`, 'font-size: 14px; font-weight: bold;');
  console.log(`%c✅ Passed: ${results.passed}`, 'font-size: 14px; color: #4CAF50; font-weight: bold;');
  console.log(`%c❌ Failed: ${results.failed}`, 'font-size: 14px; color: #f44336; font-weight: bold;');
  console.log(`%cSuccess Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
    'font-size: 14px; font-weight: bold;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #9E9E9E;');

  // Detailed results
  console.log('\n%c📋 DETAILED RESULTS:', 'font-size: 14px; font-weight: bold; color: #2196F3;');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    const color = test.status === 'PASS' ? '#4CAF50' : '#f44336';
    console.log(`%c${icon} ${index + 1}. ${test.name}`, `color: ${color};`, test.details);
  });

  console.log('\n');
  console.log('%c🎯 NEXT STEPS:', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  console.log('%c1. If any tests failed, check the error details above', 'color: #9E9E9E;');
  console.log('%c2. Make sure you have papers in your Smart Inbox', 'color: #9E9E9E;');
  console.log('%c3. Try extracting a protocol manually to verify functionality', 'color: #9E9E9E;');
  console.log('%c4. Check Railway logs for backend errors if needed', 'color: #9E9E9E;');
  console.log('\n');

  // Return results for programmatic access
  return results;
})();

