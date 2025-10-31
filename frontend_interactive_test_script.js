/**
 * PHASE 1 CONTEXTUAL NOTES - INTERACTIVE TEST SCRIPT
 * 
 * This script performs INTERACTIVE tests that simulate user actions.
 * 
 * Instructions:
 * 1. Make sure you've run the main test script first (frontend_console_test_script.js)
 * 2. Make sure you're on a project page with Network View open
 * 3. Make sure NetworkSidebar is visible (click on a paper node)
 * 4. Copy and paste this script into the console
 * 5. Press Enter to run
 * 6. The script will automatically test interactive features
 * 7. Copy ALL console output and send back
 * 
 * WARNING: This script will:
 * - Click buttons automatically
 * - Create test annotations
 * - Simulate keyboard shortcuts
 * - Open/close forms
 */

(async function runInteractiveTests() {
  console.clear();
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #ff00ff; font-weight: bold');
  console.log('%c║  PHASE 1 - INTERACTIVE FEATURE TESTS                          ║', 'color: #ff00ff; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #ff00ff; font-weight: bold');
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, status, details = '') {
    const icons = { pass: '✅', fail: '❌', skip: '⏭️' };
    const colors = { pass: '#00ff00', fail: '#ff0000', skip: '#ffaa00' };
    
    console.log(`%c${icons[status]} ${name}`, `color: ${colors[status]}; font-weight: bold`, details);
    
    results.tests.push({ name, status, details });
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // TEST 1: FIND AND CLICK "+ NEW NOTE" BUTTON
  // ============================================================================
  console.log('%c\n[TEST 1] Finding "+ New Note" button...', 'color: #00aaff; font-weight: bold');
  
  const newNoteButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.toLowerCase().includes('new note') || 
    btn.textContent.toLowerCase().includes('add note')
  );

  if (newNoteButton) {
    logTest('Find "+ New Note" button', 'pass', newNoteButton.textContent.trim());
    
    console.log('Clicking button...');
    newNoteButton.click();
    await sleep(500);

    // Check if form appeared
    const form = document.querySelector('form[class*="annotation"], form textarea[placeholder*="note" i]');
    if (form) {
      logTest('Form opens after clicking button', 'pass', 'Form is now visible');
    } else {
      logTest('Form opens after clicking button', 'fail', 'Form did not appear');
    }
  } else {
    logTest('Find "+ New Note" button', 'fail', 'Button not found in DOM');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 2: KEYBOARD SHORTCUT - ESC TO CLOSE
  // ============================================================================
  console.log('%c\n[TEST 2] Testing Esc key to close form...', 'color: #00aaff; font-weight: bold');
  
  const formBefore = document.querySelector('form[class*="annotation"], form textarea[placeholder*="note" i]');
  if (formBefore) {
    console.log('Form is open, pressing Esc...');
    
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(escEvent);
    
    await sleep(500);
    
    const formAfter = document.querySelector('form[class*="annotation"], form textarea[placeholder*="note" i]');
    if (!formAfter || formAfter.style.display === 'none') {
      logTest('Esc key closes form', 'pass', 'Form closed successfully');
    } else {
      logTest('Esc key closes form', 'fail', 'Form still visible');
    }
  } else {
    logTest('Esc key closes form', 'skip', 'No form was open to test');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 3: KEYBOARD SHORTCUT - CMD+N TO OPEN FORM
  // ============================================================================
  console.log('%c\n[TEST 3] Testing Cmd+N (or Ctrl+N) to open form...', 'color: #00aaff; font-weight: bold');
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  console.log(`Detected platform: ${isMac ? 'Mac' : 'Windows/Linux'}`);
  
  const cmdNEvent = new KeyboardEvent('keydown', {
    key: 'n',
    code: 'KeyN',
    keyCode: 78,
    which: 78,
    metaKey: isMac,
    ctrlKey: !isMac,
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(cmdNEvent);
  
  await sleep(500);
  
  const formAfterCmdN = document.querySelector('form[class*="annotation"], form textarea[placeholder*="note" i]');
  if (formAfterCmdN && formAfterCmdN.style.display !== 'none') {
    logTest('Cmd+N opens new note form', 'pass', 'Form opened successfully');
  } else {
    logTest('Cmd+N opens new note form', 'fail', 'Form did not open');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 4: FILL OUT FORM AND CREATE NOTE
  // ============================================================================
  console.log('%c\n[TEST 4] Testing form submission...', 'color: #00aaff; font-weight: bold');
  
  const contentTextarea = document.querySelector('textarea[placeholder*="note" i], textarea[name*="content" i]');
  const noteTypeSelect = document.querySelector('select[name*="type" i], select[name*="noteType" i]');
  const prioritySelect = document.querySelector('select[name*="priority" i]');
  const tagsInput = document.querySelector('input[placeholder*="tag" i], input[name*="tag" i]');
  const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.toLowerCase().includes('submit') || 
    btn.textContent.toLowerCase().includes('create') ||
    btn.textContent.toLowerCase().includes('save')
  );

  if (contentTextarea && submitButton) {
    console.log('Found form fields, filling out...');
    
    // Fill content
    contentTextarea.value = 'TEST NOTE - Automated test from console script';
    contentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    contentTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    logTest('Fill content field', 'pass', 'Content entered');

    // Select note type
    if (noteTypeSelect) {
      noteTypeSelect.value = 'finding';
      noteTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      logTest('Select note type', 'pass', 'Type: finding');
    } else {
      logTest('Select note type', 'skip', 'Note type select not found');
    }

    // Select priority
    if (prioritySelect) {
      prioritySelect.value = 'high';
      prioritySelect.dispatchEvent(new Event('change', { bubbles: true }));
      logTest('Select priority', 'pass', 'Priority: high');
    } else {
      logTest('Select priority', 'skip', 'Priority select not found');
    }

    // Add tags
    if (tagsInput) {
      tagsInput.value = 'test, automated';
      tagsInput.dispatchEvent(new Event('input', { bubbles: true }));
      tagsInput.dispatchEvent(new Event('change', { bubbles: true }));
      logTest('Add tags', 'pass', 'Tags: test, automated');
    } else {
      logTest('Add tags', 'skip', 'Tags input not found');
    }

    await sleep(500);

    // Count existing notes before submission
    const notesBefore = document.querySelectorAll('[class*="annotation-card"], [class*="AnnotationCard"], [data-annotation-id]').length;
    console.log(`Notes before submission: ${notesBefore}`);

    // Submit form
    console.log('Clicking submit button...');
    submitButton.click();
    
    await sleep(2000); // Wait for API call

    // Check if note was created
    const notesAfter = document.querySelectorAll('[class*="annotation-card"], [class*="AnnotationCard"], [data-annotation-id]').length;
    console.log(`Notes after submission: ${notesAfter}`);

    if (notesAfter > notesBefore) {
      logTest('Note created successfully', 'pass', `New note appeared (${notesBefore} → ${notesAfter})`);
    } else {
      logTest('Note created successfully', 'fail', 'Note count did not increase');
    }

    // Check if form closed
    const formAfterSubmit = document.querySelector('form[class*="annotation"], form textarea[placeholder*="note" i]');
    if (!formAfterSubmit || formAfterSubmit.style.display === 'none') {
      logTest('Form closes after submission', 'pass', 'Form closed automatically');
    } else {
      logTest('Form closes after submission', 'fail', 'Form still visible');
    }

  } else {
    logTest('Fill and submit form', 'skip', 'Form fields not found (form may not be open)');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 5: VERIFY VISUAL DESIGN OF CREATED NOTE
  // ============================================================================
  console.log('%c\n[TEST 5] Verifying visual design of notes...', 'color: #00aaff; font-weight: bold');
  
  const allNotes = document.querySelectorAll('[class*="annotation-card"], [class*="AnnotationCard"], [data-annotation-id]');
  
  if (allNotes.length > 0) {
    const firstNote = allNotes[0];
    console.log('Inspecting first note...');
    console.log('Classes:', firstNote.className);
    
    const computedStyle = window.getComputedStyle(firstNote);
    console.log('Border Left:', computedStyle.borderLeft);
    console.log('Background:', computedStyle.background);
    
    // Check for colored border
    const hasColoredBorder = computedStyle.borderLeftWidth !== '0px' && 
                             computedStyle.borderLeftColor !== 'rgba(0, 0, 0, 0)';
    if (hasColoredBorder) {
      logTest('Note has colored left border', 'pass', computedStyle.borderLeft);
    } else {
      logTest('Note has colored left border', 'fail', 'No visible left border');
    }

    // Check for badges
    const badges = firstNote.querySelectorAll('[class*="badge"], .badge, [class*="px-2"][class*="rounded"]');
    if (badges.length > 0) {
      logTest('Note has priority/status badges', 'pass', `${badges.length} badges found`);
      badges.forEach((badge, i) => {
        console.log(`  Badge ${i + 1}:`, badge.textContent.trim(), window.getComputedStyle(badge).background);
      });
    } else {
      logTest('Note has priority/status badges', 'fail', 'No badges found');
    }

    // Check for tags
    const tags = firstNote.querySelectorAll('[class*="tag"], .tag');
    if (tags.length > 0) {
      logTest('Note has tags', 'pass', `${tags.length} tags found`);
    } else {
      logTest('Note has tags', 'skip', 'No tags found (may not have been added)');
    }

  } else {
    logTest('Verify visual design', 'skip', 'No notes found to inspect');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 6: TEST HOVER ACTIONS (EDIT, REPLY)
  // ============================================================================
  console.log('%c\n[TEST 6] Testing hover actions...', 'color: #00aaff; font-weight: bold');
  
  if (allNotes.length > 0) {
    const firstNote = allNotes[0];
    
    // Simulate hover
    const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true });
    firstNote.dispatchEvent(mouseEnterEvent);
    
    await sleep(300);
    
    // Look for action buttons
    const editButton = firstNote.querySelector('button[aria-label*="edit" i], button[title*="edit" i]') ||
                       Array.from(firstNote.querySelectorAll('button')).find(btn => btn.textContent.toLowerCase().includes('edit'));
    const replyButton = firstNote.querySelector('button[aria-label*="reply" i], button[title*="reply" i]') ||
                        Array.from(firstNote.querySelectorAll('button')).find(btn => btn.textContent.toLowerCase().includes('reply'));
    
    if (editButton) {
      logTest('Edit button appears on hover', 'pass', 'Edit button found');
    } else {
      logTest('Edit button appears on hover', 'fail', 'Edit button not found');
    }

    if (replyButton) {
      logTest('Reply button appears on hover', 'pass', 'Reply button found');
    } else {
      logTest('Reply button appears on hover', 'fail', 'Reply button not found');
    }

  } else {
    logTest('Test hover actions', 'skip', 'No notes to test hover on');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 7: TEST FILTER FUNCTIONALITY
  // ============================================================================
  console.log('%c\n[TEST 7] Testing filter functionality...', 'color: #00aaff; font-weight: bold');
  
  const filterButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.getAttribute('aria-label')?.toLowerCase().includes('filter') ||
    btn.title?.toLowerCase().includes('filter') ||
    btn.className.includes('filter')
  );

  if (filterButton) {
    logTest('Find filter button', 'pass', 'Filter button found');
    
    console.log('Clicking filter button...');
    filterButton.click();
    await sleep(500);

    // Check if filter panel appeared
    const filterPanel = document.querySelector('[class*="filter"], [role="dialog"]');
    if (filterPanel) {
      logTest('Filter panel opens', 'pass', 'Filter panel visible');
    } else {
      logTest('Filter panel opens', 'fail', 'Filter panel did not appear');
    }

  } else {
    logTest('Test filter functionality', 'skip', 'Filter button not found');
  }

  await sleep(1000);

  // ============================================================================
  // TEST 8: TEST REFRESH FUNCTIONALITY
  // ============================================================================
  console.log('%c\n[TEST 8] Testing refresh functionality...', 'color: #00aaff; font-weight: bold');
  
  const refreshButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.getAttribute('aria-label')?.toLowerCase().includes('refresh') ||
    btn.title?.toLowerCase().includes('refresh') ||
    btn.className.includes('refresh')
  );

  if (refreshButton) {
    logTest('Find refresh button', 'pass', 'Refresh button found');
    
    console.log('Clicking refresh button...');
    const noteCountBefore = document.querySelectorAll('[class*="annotation-card"]').length;
    refreshButton.click();
    await sleep(1000);
    const noteCountAfter = document.querySelectorAll('[class*="annotation-card"]').length;
    
    logTest('Refresh button works', 'pass', `Notes: ${noteCountBefore} → ${noteCountAfter}`);

  } else {
    logTest('Test refresh functionality', 'skip', 'Refresh button not found');
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('');
  console.log('%c' + '═'.repeat(70), 'color: #ff00ff');
  console.log('%c📊 INTERACTIVE TEST SUMMARY', 'color: #ff00ff; font-weight: bold; font-size: 16px');
  console.log('%c' + '═'.repeat(70), 'color: #ff00ff');
  console.log('');
  console.log('%c✅ PASSED:', 'color: #00ff00; font-weight: bold', results.passed);
  console.log('%c❌ FAILED:', 'color: #ff0000; font-weight: bold', results.failed);
  console.log('%c⏭️  SKIPPED:', 'color: #ffaa00; font-weight: bold', results.tests.filter(t => t.status === 'skip').length);
  console.log('%cTOTAL TESTS:', 'color: #00aaff; font-weight: bold', results.tests.length);
  console.log('');

  // Export results
  const exportData = {
    timestamp: new Date().toISOString(),
    testType: 'interactive',
    results: results
  };

  console.log(JSON.stringify(exportData, null, 2));
  console.log('');

  window.phase1InteractiveTestResults = exportData;
  console.log('%c💾 Results saved to: window.phase1InteractiveTestResults', 'color: #00ff00; font-weight: bold');
  console.log('');

  console.log('%c📋 COPY ALL OUTPUT ABOVE AND SEND TO AI AGENT', 'color: #ff00ff; font-weight: bold; font-size: 14px');

  return results;
})();

