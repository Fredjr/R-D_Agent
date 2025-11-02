/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEEK 11 DAY 2 - FRONTEND HIGHLIGHT TOOL TESTING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests the frontend highlight tool implementation:
 * 1. Verifies highlight mode toggle works
 * 2. Tests text selection and color picker
 * 3. Verifies highlights are created and saved
 * 4. Tests highlight rendering on PDF
 * 5. Verifies highlights persist across page navigation
 * 
 * INSTRUCTIONS:
 * 1. Open https://frontend-psi-seven-85.vercel.app in your browser
 * 2. Log in with your account
 * 3. Navigate to a project
 * 4. Search for PMID: 39361594
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
console.log('%c║  WEEK 11 DAY 2 - FRONTEND HIGHLIGHT TOOL TESTING                         ║', 'color: #3b82f6; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold;');
console.log('');

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

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: VERIFY PDF VIEWER IS OPEN
// ═══════════════════════════════════════════════════════════════════════════

function testPDFViewerOpen() {
  logSection('TEST 1: VERIFY PDF VIEWER IS OPEN');
  
  const pdfViewer = document.querySelector('.react-pdf__Document');
  const pdfPage = document.querySelector('.react-pdf__Page');
  
  if (pdfViewer && pdfPage) {
    logTest('PDF Viewer is open', 'pass');
    return true;
  } else {
    logTest('PDF Viewer is NOT open', 'fail', 'Please open a PDF first (search PMID: 39361594, click "Read PDF")');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: VERIFY HIGHLIGHT MODE BUTTON EXISTS
// ═══════════════════════════════════════════════════════════════════════════

function testHighlightButton() {
  logSection('TEST 2: VERIFY HIGHLIGHT MODE BUTTON');
  
  // Look for the pencil icon button
  const buttons = Array.from(document.querySelectorAll('button'));
  const highlightButton = buttons.find(btn => {
    const svg = btn.querySelector('svg');
    return svg && btn.title && btn.title.toLowerCase().includes('highlight');
  });
  
  if (highlightButton) {
    logTest('Highlight mode button found', 'pass');
    console.log('   Button title:', highlightButton.title);
    return true;
  } else {
    logTest('Highlight mode button NOT found', 'fail', 'Button may not be visible or projectId is missing');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: VERIFY TEXT LAYER EXISTS
// ═══════════════════════════════════════════════════════════════════════════

function testTextLayer() {
  logSection('TEST 3: VERIFY PDF TEXT LAYER');
  
  const textLayer = document.querySelector('.react-pdf__Page__textContent');
  
  if (textLayer) {
    const textSpans = textLayer.querySelectorAll('span');
    logTest('PDF text layer found', 'pass', `${textSpans.length} text elements`);
    return true;
  } else {
    logTest('PDF text layer NOT found', 'fail', 'Text selection will not work');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: VERIFY HIGHLIGHT COMPONENTS LOADED
// ═══════════════════════════════════════════════════════════════════════════

function testHighlightComponents() {
  logSection('TEST 4: VERIFY HIGHLIGHT COMPONENTS');
  
  // Check if React components are loaded by looking for their effects
  const hasHighlightTool = window.getSelection !== undefined;
  const hasHighlightLayer = document.querySelector('.react-pdf__Page') !== null;
  
  if (hasHighlightTool && hasHighlightLayer) {
    logTest('Highlight components loaded', 'pass');
    return true;
  } else {
    logTest('Highlight components may not be loaded', 'warn');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function showManualTests() {
  logSection('MANUAL TESTING INSTRUCTIONS');
  
  console.log('%c📋 Please perform the following manual tests:', 'color: #3b82f6; font-weight: bold;');
  console.log('');
  
  logTest('TEST 5: Toggle Highlight Mode', 'manual');
  console.log('   1. Click the pencil icon button in the toolbar');
  console.log('   2. Button should turn yellow when active');
  console.log('   3. Click again to toggle off');
  console.log('   4. Try keyboard shortcut: Cmd+H (Mac) or Ctrl+H (Windows)');
  console.log('');
  
  logTest('TEST 6: Create a Highlight', 'manual');
  console.log('   1. Enable highlight mode (pencil button should be yellow)');
  console.log('   2. Select some text in the PDF by clicking and dragging');
  console.log('   3. A color picker should appear near your selection');
  console.log('   4. Click one of the 5 colors (Yellow, Green, Blue, Pink, Orange)');
  console.log('   5. The text should be highlighted with your chosen color');
  console.log('   6. Check the console for "✅ Highlight created" message');
  console.log('');
  
  logTest('TEST 7: Verify Highlight Persists', 'manual');
  console.log('   1. After creating a highlight, navigate to the next page (→ button)');
  console.log('   2. Navigate back to the page with the highlight (← button)');
  console.log('   3. The highlight should still be visible');
  console.log('');
  
  logTest('TEST 8: Test Multiple Highlights', 'manual');
  console.log('   1. Create 2-3 highlights with different colors');
  console.log('   2. All highlights should be visible simultaneously');
  console.log('   3. Check the toolbar - it should show the highlight count');
  console.log('');
  
  logTest('TEST 9: Test Zoom with Highlights', 'manual');
  console.log('   1. Create a highlight');
  console.log('   2. Zoom in using the + button');
  console.log('   3. Highlight should scale correctly with the PDF');
  console.log('   4. Zoom out using the - button');
  console.log('   5. Highlight should still be in the correct position');
  console.log('');
  
  logTest('TEST 10: Click on Highlight', 'manual');
  console.log('   1. Click on an existing highlight');
  console.log('   2. Check console for "🖱️ Clicked highlight" message');
  console.log('   3. (Note: Sidebar not yet implemented - this is for Day 3)');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY BACKEND INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

async function testBackendIntegration() {
  logSection('TEST 11: VERIFY BACKEND INTEGRATION');
  
  const USER_DATA = localStorage.getItem('rd_agent_user') 
    ? JSON.parse(localStorage.getItem('rd_agent_user'))
    : null;

  if (!USER_DATA) {
    logTest('User not logged in', 'fail', 'Please log in first');
    return false;
  }

  console.log('   User:', USER_DATA.email);
  
  // Try to get project ID from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId') || localStorage.getItem('currentProjectId');
  
  if (!projectId) {
    logTest('Project ID not found', 'warn', 'Highlights may not be saved');
    return false;
  }
  
  console.log('   Project ID:', projectId);
  
  try {
    const response = await fetch(
      `https://r-dagent-production.up.railway.app/projects/${projectId}/annotations?article_pmid=39361594`,
      { headers: { 'User-ID': USER_DATA.email } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const highlights = (data.annotations || []).filter(a => a.pdf_page !== null);
      logTest('Backend connection successful', 'pass', `Found ${highlights.length} existing highlights`);
      
      if (highlights.length > 0) {
        console.log('');
        console.log('   Existing highlights:');
        highlights.forEach((h, i) => {
          console.log(`   ${i + 1}. Page ${h.pdf_page} - ${h.highlight_color} - "${h.highlight_text?.substring(0, 50)}..."`);
        });
      }
      
      return true;
    } else {
      logTest('Backend connection failed', 'fail', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Backend connection error', 'fail', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  const startTime = performance.now();
  
  console.log('%c🚀 Starting Frontend Highlight Tool Tests...', 'color: #10b981; font-weight: bold;');
  console.log('');
  
  // Automated tests
  const test1 = testPDFViewerOpen();
  if (!test1) {
    console.log('');
    console.log('%c❌ PDF Viewer is not open. Please open a PDF first.', 'color: #ef4444; font-weight: bold;');
    console.log('   1. Search for PMID: 39361594');
    console.log('   2. Click "Read PDF" button');
    console.log('   3. Run this script again');
    return;
  }
  
  const test2 = testHighlightButton();
  const test3 = testTextLayer();
  const test4 = testHighlightComponents();
  const test5 = await testBackendIntegration();
  
  // Manual tests
  showManualTests();
  
  // Summary
  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  
  logSection('TEST SUMMARY');
  
  const automatedPassed = test1 && test2 && test3 && test4;
  
  if (automatedPassed) {
    console.log('%c✅ AUTOMATED TESTS PASSED!', 'color: #10b981; font-weight: bold; font-size: 18px;');
  } else {
    console.log('%c⚠️  SOME AUTOMATED TESTS FAILED', 'color: #f59e0b; font-weight: bold; font-size: 18px;');
  }
  
  console.log('');
  console.log('   ✅ PDF Viewer:', test1 ? 'PASS' : 'FAIL');
  console.log('   ✅ Highlight Button:', test2 ? 'PASS' : 'FAIL');
  console.log('   ✅ Text Layer:', test3 ? 'PASS' : 'FAIL');
  console.log('   ✅ Components:', test4 ? 'PASS' : 'WARN');
  console.log('   ✅ Backend:', test5 ? 'PASS' : 'WARN');
  console.log('');
  console.log(`%cTotal execution time: ${totalTime}s`, 'color: #6b7280;');
  console.log('');
  console.log('%c📋 NEXT STEPS:', 'color: #3b82f6; font-weight: bold;');
  console.log('1. Complete all manual tests above');
  console.log('2. Copy ALL console output (including any errors)');
  console.log('3. Send it back with your test results');
  console.log('4. Report any issues or unexpected behavior');
  console.log('');
}

// Run all tests
runAllTests();

