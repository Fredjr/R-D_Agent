// ═══════════════════════════════════════════════════════════════════════════
// WEEK 11 DAY 3 - ANNOTATIONS SIDEBAR TESTING SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
// 
// PURPOSE: Test the Annotations Sidebar functionality
// 
// INSTRUCTIONS:
// 1. Navigate to https://frontend-psi-seven-85.vercel.app/
// 2. Log in with your account
// 3. Go to Collections or a Project
// 4. Open a PDF with the "Read PDF" button
// 5. Open DevTools Console (F12 or Cmd+Option+I)
// 6. Paste this ENTIRE script and press Enter
// 7. Copy ALL console output and send it back
// 
// ═══════════════════════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  WEEK 11 DAY 3 - ANNOTATIONS SIDEBAR TESTING                              ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

const startTime = Date.now();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  backendUrl: 'https://r-dagent-production.up.railway.app',
  testPMID: '39361594', // Test article
};

console.log('📋 CONFIGURATION');
console.log('Backend URL:', CONFIG.backendUrl);
console.log('Test PMID:', CONFIG.testPMID);
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkElement(selector, description) {
  const element = document.querySelector(selector);
  if (element) {
    console.log(`   ✅ ${description} found`);
    return element;
  } else {
    console.log(`   ❌ ${description} NOT found`);
    return null;
  }
}

function checkMultipleElements(selector, description) {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`   ✅ ${description}: ${elements.length} found`);
    return elements;
  } else {
    console.log(`   ❌ ${description}: NONE found`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATED TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function runAutomatedTests() {
  console.log('🚀 Starting Automated Tests...\n');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Check if PDF Viewer is open
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 1: PDF Viewer Open');
  const pdfViewer = checkElement('.react-pdf__Document', 'PDF Document');
  if (!pdfViewer) {
    console.log('   ⚠️  Please open a PDF first using the "Read PDF" button');
    console.log('   ⚠️  Then run this script again');
    return;
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Check Sidebar Toggle Button
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 2: Sidebar Toggle Button');
  const sidebarToggle = checkElement('button[title*="annotations sidebar"]', 'Sidebar toggle button');
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Check if Sidebar is Visible
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 3: Sidebar Visibility');
  const sidebarHeader = checkElement('h2', 'Sidebar header');
  const sidebarContent = document.querySelector('h2')?.textContent;
  if (sidebarContent && sidebarContent.includes('Annotations')) {
    console.log('   ✅ Sidebar is visible with "Annotations" header');
  } else {
    console.log('   ⚠️  Sidebar may not be visible or has different header');
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Check Highlight Mode Button
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 4: Highlight Mode Button');
  const highlightButton = checkElement('button[title*="highlight mode"]', 'Highlight mode button');
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Check for Existing Highlights
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 5: Existing Highlights');
  const highlightCount = document.querySelector('span')?.textContent;
  if (highlightCount && highlightCount.includes('highlight')) {
    console.log('   ✅ Highlight count displayed:', highlightCount);
  } else {
    console.log('   ℹ️  No highlights yet (this is normal for first use)');
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Check Split View Layout
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📝 TEST 6: Split View Layout');
  const mainContent = document.querySelector('.flex-1.flex.overflow-hidden');
  if (mainContent) {
    const children = mainContent.children;
    console.log('   ✅ Main content container found');
    console.log('   ℹ️  Number of sections:', children.length);
    if (children.length === 2) {
      console.log('   ✅ Split view detected (PDF + Sidebar)');
    } else if (children.length === 1) {
      console.log('   ℹ️  Single view (Sidebar may be hidden)');
    }
  } else {
    console.log('   ❌ Main content container NOT found');
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('✅ AUTOMATED TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Total execution time: ${duration}s`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function printManualTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('📋 MANUAL TESTING CHECKLIST');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Please perform these manual tests and report results:');
  console.log('');
  console.log('1️⃣  SIDEBAR TOGGLE');
  console.log('   □ Click the sidebar toggle button (three horizontal lines icon)');
  console.log('   □ Verify sidebar slides out smoothly');
  console.log('   □ Click again to show sidebar');
  console.log('   □ Verify sidebar slides in smoothly');
  console.log('   □ Verify PDF area adjusts width (70% with sidebar, 100% without)');
  console.log('');
  console.log('2️⃣  CREATE HIGHLIGHTS');
  console.log('   □ Enable highlight mode (pencil icon)');
  console.log('   □ Select some text in the PDF');
  console.log('   □ Choose a color from the color picker');
  console.log('   □ Verify highlight appears on PDF');
  console.log('   □ Verify highlight appears in sidebar');
  console.log('   □ Create 2-3 more highlights on different pages');
  console.log('');
  console.log('3️⃣  SIDEBAR DISPLAY');
  console.log('   □ Verify highlights are grouped by page');
  console.log('   □ Verify page separators are visible');
  console.log('   □ Verify current page highlights are highlighted');
  console.log('   □ Verify highlight text is displayed correctly');
  console.log('   □ Verify color indicator bar on left side');
  console.log('   □ Verify timestamp is displayed');
  console.log('');
  console.log('4️⃣  CLICK TO NAVIGATE');
  console.log('   □ Navigate to a different page');
  console.log('   □ Click on a highlight in the sidebar from another page');
  console.log('   □ Verify PDF navigates to that page');
  console.log('   □ Verify highlight is visible on the page');
  console.log('');
  console.log('5️⃣  ADD NOTES');
  console.log('   □ Hover over a highlight in sidebar');
  console.log('   □ Click "Add Note" button');
  console.log('   □ Type a note in the textarea');
  console.log('   □ Click "Save"');
  console.log('   □ Verify note appears below highlight text');
  console.log('   □ Verify note has chat bubble icon');
  console.log('');
  console.log('6️⃣  EDIT NOTES');
  console.log('   □ Hover over a highlight with a note');
  console.log('   □ Click "Edit Note" button');
  console.log('   □ Modify the note text');
  console.log('   □ Click "Save"');
  console.log('   □ Verify note is updated');
  console.log('');
  console.log('7️⃣  CHANGE COLOR');
  console.log('   □ Hover over a highlight in sidebar');
  console.log('   □ Click the color circle button');
  console.log('   □ Verify color picker dropdown appears');
  console.log('   □ Click a different color');
  console.log('   □ Verify highlight color changes in sidebar');
  console.log('   □ Verify highlight color changes on PDF');
  console.log('');
  console.log('8️⃣  DELETE HIGHLIGHT');
  console.log('   □ Hover over a highlight in sidebar');
  console.log('   □ Click the delete button (trash icon)');
  console.log('   □ Verify confirmation dialog appears');
  console.log('   □ Click "OK" to confirm');
  console.log('   □ Verify highlight is removed from sidebar');
  console.log('   □ Verify highlight is removed from PDF');
  console.log('');
  console.log('9️⃣  PERSISTENCE');
  console.log('   □ Close the PDF viewer');
  console.log('   □ Open the same PDF again');
  console.log('   □ Verify all highlights are still there');
  console.log('   □ Verify all notes are still there');
  console.log('   □ Verify all colors are correct');
  console.log('');
  console.log('🔟 EMPTY STATE');
  console.log('   □ Open a PDF with no highlights');
  console.log('   □ Verify empty state message is displayed');
  console.log('   □ Verify helpful instructions are shown');
  console.log('   □ Verify pencil icon is displayed');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📸 PLEASE TAKE SCREENSHOTS OF:');
  console.log('   1. PDF viewer with sidebar open (showing highlights)');
  console.log('   2. Sidebar with multiple highlights and notes');
  console.log('   3. Color picker dropdown');
  console.log('   4. Empty state (if possible)');
  console.log('');
  console.log('📋 REPORT BACK WITH:');
  console.log('   1. All console output from this script');
  console.log('   2. Results of manual tests (which passed/failed)');
  console.log('   3. Screenshots');
  console.log('   4. Any issues or bugs encountered');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════

(async function() {
  await runAutomatedTests();
  printManualTests();
})();

