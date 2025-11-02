/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEEK 11 COMPREHENSIVE TESTING SCRIPT (Days 1-4)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests ALL Week 11 implementations:
 * - Day 1: Backend annotations support
 * - Day 2: Frontend highlight tool
 * - Day 3: Annotations sidebar
 * - Day 4: Enhanced onboarding Step 4
 * - PDF Worker Fix: .mjs file loading
 * 
 * INSTRUCTIONS:
 * 1. Open https://frontend-psi-seven-85.vercel.app in your browser
 * 2. Log in with your account
 * 3. Navigate to a project
 * 4. Search for PMID: 33099609 (the one you tested)
 * 5. Click "Read PDF" button
 * 6. Open DevTools (F12) → Console tab
 * 7. Copy and paste this ENTIRE script
 * 8. Press Enter to run
 * 9. Follow the manual testing instructions
 * 10. Copy ALL console output and send back
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c╔═══════════════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold;');
console.log('%c║  WEEK 11 COMPREHENSIVE TESTING (Days 1-4)                                 ║', 'color: #3b82f6; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold;');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BACKEND_URL: 'https://r-dagent-production.up.railway.app',
  TEST_PMID: '33099609',
  EXPECTED_WORKER_URL: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs',
  HIGHLIGHT_COLORS: ['#FFEB3B', '#4CAF50', '#2196F3', '#E91E63', '#FF9800']
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function logSection(title) {
  console.log('');
  console.log('%c' + '═'.repeat(80), 'color: #6b7280;');
  console.log('%c' + title, 'color: #3b82f6; font-weight: bold; font-size: 16px;');
  console.log('%c' + '═'.repeat(80), 'color: #6b7280;');
}

function logTest(test, status, details = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'manual' ? '🔍' : '⚠️';
  const color = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : status === 'manual' ? '#3b82f6' : '#f59e0b';
  console.log(`%c${emoji} ${test}`, `color: ${color}; font-weight: bold;`);
  if (details) console.log(`   ${details}`);
}

function getUserData() {
  const userData = localStorage.getItem('rd_agent_user');
  return userData ? JSON.parse(userData) : null;
}

function getProjectId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('projectId') || localStorage.getItem('currentProjectId');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: PDF WORKER FIX (.mjs file)
// ═══════════════════════════════════════════════════════════════════════════

function testPDFWorkerFix() {
  logSection('TEST 1: PDF WORKER FIX (.mjs file)');
  
  // Check console logs for worker configuration
  const consoleMessages = [];
  const originalLog = console.log;
  
  // Look for worker configuration in existing logs
  const workerConfigured = performance.getEntriesByType('resource').some(entry => 
    entry.name.includes('pdf.worker.min.mjs')
  );
  
  if (workerConfigured) {
    logTest('PDF worker using .mjs file', 'pass', 'Correct ES module format');
  } else {
    logTest('PDF worker file check', 'warn', 'Could not verify worker file type from network logs');
  }
  
  // Check for 404 errors
  const has404Error = performance.getEntriesByType('resource').some(entry => 
    entry.name.includes('pdf.worker') && entry.transferSize === 0
  );
  
  if (has404Error) {
    logTest('PDF worker 404 error', 'fail', 'Worker file not found - PDF will not load');
    return false;
  } else {
    logTest('No PDF worker 404 errors', 'pass');
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: PDF VIEWER LOADED
// ═══════════════════════════════════════════════════════════════════════════

function testPDFViewerLoaded() {
  logSection('TEST 2: PDF VIEWER LOADED');
  
  const pdfDocument = document.querySelector('.react-pdf__Document');
  const pdfPage = document.querySelector('.react-pdf__Page');
  const textLayer = document.querySelector('.react-pdf__Page__textContent');
  
  if (!pdfDocument) {
    logTest('PDF Document', 'fail', 'PDF viewer not found - please open a PDF first');
    return false;
  }
  
  logTest('PDF Document loaded', 'pass');
  
  if (pdfPage) {
    logTest('PDF Page rendered', 'pass');
  } else {
    logTest('PDF Page', 'fail', 'No pages rendered');
    return false;
  }
  
  if (textLayer) {
    const textSpans = textLayer.querySelectorAll('span');
    logTest('PDF Text Layer', 'pass', `${textSpans.length} text elements`);
  } else {
    logTest('PDF Text Layer', 'warn', 'Text selection may not work');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: BACKEND ANNOTATIONS API (Day 1)
// ═══════════════════════════════════════════════════════════════════════════

async function testBackendAnnotationsAPI() {
  logSection('TEST 3: BACKEND ANNOTATIONS API (Day 1)');
  
  const user = getUserData();
  if (!user) {
    logTest('User authentication', 'fail', 'Not logged in');
    return false;
  }
  
  logTest('User authenticated', 'pass', user.email);
  
  const projectId = getProjectId();
  if (!projectId) {
    logTest('Project ID', 'fail', 'No project ID found');
    return false;
  }
  
  logTest('Project ID found', 'pass', projectId);
  
  try {
    // Test GET annotations
    const getUrl = `${CONFIG.BACKEND_URL}/projects/${projectId}/annotations?article_pmid=${CONFIG.TEST_PMID}`;
    console.log('   Testing GET:', getUrl);
    
    const getResponse = await fetch(getUrl, {
      headers: { 'User-ID': user.email }
    });
    
    if (!getResponse.ok) {
      logTest('GET annotations', 'fail', `Status: ${getResponse.status}`);
      return false;
    }
    
    const data = await getResponse.json();
    const annotations = data.annotations || [];
    const highlights = annotations.filter(a => a.pdf_page !== null);
    
    logTest('GET annotations', 'pass', `Found ${annotations.length} total, ${highlights.length} highlights`);
    
    if (highlights.length > 0) {
      console.log('');
      console.log('   Existing highlights:');
      highlights.forEach((h, i) => {
        console.log(`   ${i + 1}. Page ${h.pdf_page} - ${h.highlight_color} - "${h.highlight_text?.substring(0, 40)}..."`);
      });
    }
    
    // Test POST annotation (create test highlight)
    console.log('');
    console.log('   Testing POST (create test annotation)...');
    
    const testAnnotation = {
      article_pmid: CONFIG.TEST_PMID,
      content: 'Test annotation from comprehensive testing script',
      note_type: 'finding',
      priority: 'medium',
      status: 'active',
      pdf_page: 1,
      pdf_coordinates: {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.05,
        pageWidth: 595,
        pageHeight: 842
      },
      highlight_color: '#FFEB3B',
      highlight_text: 'Test highlight text'
    };
    
    const postResponse = await fetch(`${CONFIG.BACKEND_URL}/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': user.email
      },
      body: JSON.stringify(testAnnotation)
    });
    
    if (!postResponse.ok) {
      logTest('POST annotation', 'fail', `Status: ${postResponse.status}`);
      const errorText = await postResponse.text();
      console.log('   Error:', errorText);
      return false;
    }
    
    const createdAnnotation = await postResponse.json();
    logTest('POST annotation', 'pass', `Created annotation ID: ${createdAnnotation.annotation_id}`);
    
    // Test PATCH annotation (update)
    console.log('');
    console.log('   Testing PATCH (update annotation)...');
    
    const patchResponse = await fetch(
      `${CONFIG.BACKEND_URL}/projects/${projectId}/annotations/${createdAnnotation.annotation_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          content: 'Updated test annotation',
          highlight_color: '#4CAF50'
        })
      }
    );
    
    if (!patchResponse.ok) {
      logTest('PATCH annotation', 'fail', `Status: ${patchResponse.status}`);
    } else {
      logTest('PATCH annotation', 'pass', 'Successfully updated');
    }
    
    // Test DELETE annotation (cleanup)
    console.log('');
    console.log('   Testing DELETE (cleanup test annotation)...');
    
    const deleteResponse = await fetch(
      `${CONFIG.BACKEND_URL}/projects/${projectId}/annotations/${createdAnnotation.annotation_id}`,
      {
        method: 'DELETE',
        headers: { 'User-ID': user.email }
      }
    );
    
    if (!deleteResponse.ok) {
      logTest('DELETE annotation', 'fail', `Status: ${deleteResponse.status}`);
    } else {
      logTest('DELETE annotation', 'pass', 'Test annotation cleaned up');
    }
    
    return true;
    
  } catch (error) {
    logTest('Backend API test', 'fail', error.message);
    console.error('   Error details:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: HIGHLIGHT TOOL UI (Day 2)
// ═══════════════════════════════════════════════════════════════════════════

function testHighlightToolUI() {
  logSection('TEST 4: HIGHLIGHT TOOL UI (Day 2)');
  
  // Find highlight mode button
  const buttons = Array.from(document.querySelectorAll('button'));
  const highlightButton = buttons.find(btn => {
    const title = btn.title || btn.getAttribute('aria-label') || '';
    return title.toLowerCase().includes('highlight');
  });
  
  if (highlightButton) {
    logTest('Highlight mode button', 'pass', `Title: "${highlightButton.title}"`);
  } else {
    logTest('Highlight mode button', 'fail', 'Button not found - may need projectId');
    return false;
  }
  
  // Check for keyboard shortcut hint
  const hasShortcutHint = highlightButton.title?.includes('Cmd') || highlightButton.title?.includes('Ctrl');
  if (hasShortcutHint) {
    logTest('Keyboard shortcut hint', 'pass', 'Cmd/Ctrl+H shown in tooltip');
  } else {
    logTest('Keyboard shortcut hint', 'warn', 'Not visible in button title');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: ANNOTATIONS SIDEBAR (Day 3)
// ═══════════════════════════════════════════════════════════════════════════

function testAnnotationsSidebar() {
  logSection('TEST 5: ANNOTATIONS SIDEBAR (Day 3)');
  
  // Find sidebar toggle button
  const buttons = Array.from(document.querySelectorAll('button'));
  const sidebarButton = buttons.find(btn => {
    const title = btn.title || btn.getAttribute('aria-label') || '';
    return title.toLowerCase().includes('sidebar') || title.toLowerCase().includes('annotation');
  });
  
  if (sidebarButton) {
    logTest('Sidebar toggle button', 'pass', `Title: "${sidebarButton.title}"`);
  } else {
    logTest('Sidebar toggle button', 'warn', 'Button not found - may not be visible yet');
  }
  
  // Check if sidebar is currently open
  const sidebar = document.querySelector('[class*="sidebar"]') || 
                  document.querySelector('[class*="Sidebar"]');
  
  if (sidebar) {
    logTest('Sidebar component', 'pass', 'Sidebar is currently visible');
    
    // Check for sidebar content
    const highlightItems = sidebar.querySelectorAll('[class*="highlight"]');
    if (highlightItems.length > 0) {
      logTest('Sidebar highlights', 'pass', `${highlightItems.length} highlight items displayed`);
    } else {
      logTest('Sidebar highlights', 'warn', 'No highlights in sidebar (may be empty)');
    }
  } else {
    logTest('Sidebar component', 'warn', 'Sidebar not currently visible (may be closed)');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6: MANUAL TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function showManualTests() {
  logSection('MANUAL TESTING INSTRUCTIONS');
  
  console.log('%c📋 Please perform the following manual tests:', 'color: #3b82f6; font-weight: bold;');
  console.log('');
  
  logTest('TEST 6A: PDF Loading', 'manual');
  console.log('   1. Verify PDF loaded without errors');
  console.log('   2. Check console for "📄 PDF.js worker configured: ...pdf.worker.min.mjs"');
  console.log('   3. Verify NO 404 errors in Network tab');
  console.log('   4. Verify PDF pages are visible and scrollable');
  console.log('');
  
  logTest('TEST 6B: Create Highlight', 'manual');
  console.log('   1. Click the pencil/highlight button (should turn yellow)');
  console.log('   2. Select some text in the PDF');
  console.log('   3. Color picker should appear');
  console.log('   4. Click a color (Yellow, Green, Blue, Pink, or Orange)');
  console.log('   5. Text should be highlighted');
  console.log('   6. Check console for "✅ Highlight created" message');
  console.log('');
  
  logTest('TEST 6C: Annotations Sidebar', 'manual');
  console.log('   1. Look for sidebar toggle button (list icon)');
  console.log('   2. Click to open sidebar');
  console.log('   3. Sidebar should slide in from right (30% width)');
  console.log('   4. Highlights should be grouped by page');
  console.log('   5. Each highlight should show:');
  console.log('      - Color indicator');
  console.log('      - Highlight text preview');
  console.log('      - Page number');
  console.log('      - Action buttons (note, color, delete)');
  console.log('');
  
  logTest('TEST 6D: Sidebar Interactions', 'manual');
  console.log('   1. Click on a highlight in sidebar');
  console.log('   2. PDF should navigate to that page');
  console.log('   3. Try adding a note to a highlight');
  console.log('   4. Try changing highlight color');
  console.log('   5. Try deleting a highlight');
  console.log('   6. Verify all actions work correctly');
  console.log('');
  
  logTest('TEST 6E: Highlight Persistence', 'manual');
  console.log('   1. Create 2-3 highlights');
  console.log('   2. Close the PDF viewer');
  console.log('   3. Reopen the same PDF');
  console.log('   4. All highlights should still be visible');
  console.log('   5. Sidebar should show all highlights');
  console.log('');
  
  logTest('TEST 6F: Zoom and Pan', 'manual');
  console.log('   1. Create a highlight');
  console.log('   2. Zoom in (+) and out (-)');
  console.log('   3. Highlight should scale correctly');
  console.log('   4. Pan around the page');
  console.log('   5. Highlight should stay in correct position');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 7: ONBOARDING STEP 4 (Separate test)
// ═══════════════════════════════════════════════════════════════════════════

function showOnboardingTest() {
  logSection('TEST 7: ONBOARDING STEP 4 (Day 4)');
  
  console.log('%c⚠️  This test requires starting a new onboarding flow', 'color: #f59e0b; font-weight: bold;');
  console.log('');
  console.log('To test Step 4 (Create First Project):');
  console.log('');
  console.log('1. Log out of your account');
  console.log('2. Create a new test account');
  console.log('3. Complete Steps 1-3 of onboarding:');
  console.log('   - Step 1: Enter personal information');
  console.log('   - Step 2: Select research interests (e.g., "Cancer Immunotherapy", "CRISPR")');
  console.log('   - Step 3: Choose first action');
  console.log('');
  console.log('4. Step 4 should appear with:');
  console.log('   ✓ Project name pre-filled from research interests');
  console.log('   ✓ 4 project name suggestions (clickable chips)');
  console.log('   ✓ Research question field with examples');
  console.log('   ✓ 4 research question examples (clickable)');
  console.log('   ✓ Optional description field');
  console.log('   ✓ Character counters for all fields');
  console.log('   ✓ Info box explaining project benefits');
  console.log('');
  console.log('5. Test validation:');
  console.log('   - Try empty project name → Should show error');
  console.log('   - Try name < 3 chars → Should show error');
  console.log('   - Try question < 20 chars → Should show error');
  console.log('   - Try question > 500 chars → Should show error');
  console.log('');
  console.log('6. Create project:');
  console.log('   - Fill in valid data');
  console.log('   - Click "Create Project"');
  console.log('   - Should show loading state');
  console.log('   - Should redirect to /project/{projectId}?onboarding=complete');
  console.log('');
  console.log('7. Verify:');
  console.log('   - Project appears in dashboard');
  console.log('   - Research question saved in project settings');
  console.log('   - User preferences updated with first_project_id');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  const startTime = performance.now();
  
  console.log('%c🚀 Starting Week 11 Comprehensive Tests...', 'color: #10b981; font-weight: bold;');
  console.log('');
  
  // Run automated tests
  const test1 = testPDFWorkerFix();
  const test2 = testPDFViewerLoaded();
  
  if (!test2) {
    console.log('');
    console.log('%c❌ PDF Viewer is not open. Please open a PDF first.', 'color: #ef4444; font-weight: bold;');
    console.log('   1. Search for PMID: 33099609');
    console.log('   2. Click "Read PDF" button');
    console.log('   3. Run this script again');
    return;
  }
  
  const test3 = await testBackendAnnotationsAPI();
  const test4 = testHighlightToolUI();
  const test5 = testAnnotationsSidebar();
  
  // Show manual tests
  showManualTests();
  showOnboardingTest();
  
  // Summary
  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  
  logSection('TEST SUMMARY');
  
  const automatedPassed = test1 && test2 && test3 && test4;
  
  console.log('');
  console.log('%cAUTOMATED TESTS:', 'color: #3b82f6; font-weight: bold;');
  console.log('   ✅ PDF Worker Fix:', test1 ? 'PASS' : 'FAIL');
  console.log('   ✅ PDF Viewer:', test2 ? 'PASS' : 'FAIL');
  console.log('   ✅ Backend API:', test3 ? 'PASS' : 'FAIL');
  console.log('   ✅ Highlight Tool UI:', test4 ? 'PASS' : 'FAIL');
  console.log('   ✅ Sidebar:', test5 ? 'PASS' : 'WARN');
  console.log('');
  
  if (automatedPassed) {
    console.log('%c✅ ALL AUTOMATED TESTS PASSED!', 'color: #10b981; font-weight: bold; font-size: 18px;');
  } else {
    console.log('%c⚠️  SOME AUTOMATED TESTS FAILED', 'color: #f59e0b; font-weight: bold; font-size: 18px;');
  }
  
  console.log('');
  console.log(`%cTotal execution time: ${totalTime}s`, 'color: #6b7280;');
  console.log('');
  console.log('%c📋 NEXT STEPS:', 'color: #3b82f6; font-weight: bold;');
  console.log('1. Complete all manual tests above (6A-6F)');
  console.log('2. Test onboarding Step 4 separately (Test 7)');
  console.log('3. Copy ALL console output (including any errors)');
  console.log('4. Send it back with your test results');
  console.log('5. Report any issues or unexpected behavior');
  console.log('');
  console.log('%c🎯 FOCUS AREAS:', 'color: #3b82f6; font-weight: bold;');
  console.log('- PDF loads without 404 errors (worker .mjs file)');
  console.log('- Highlights can be created and saved');
  console.log('- Sidebar displays highlights correctly');
  console.log('- All CRUD operations work (Create, Read, Update, Delete)');
  console.log('- Onboarding Step 4 creates project successfully');
  console.log('');
}

// Run all tests
runAllTests();

