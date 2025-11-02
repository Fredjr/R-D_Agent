/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEEK 11 DAY 4: ONBOARDING STEP 4 TESTING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests the new Step 4 (Create First Project) in the onboarding flow.
 * 
 * INSTRUCTIONS:
 * 1. Navigate to: https://frontend-psi-seven-85.vercel.app/auth/complete-profile
 * 2. Complete Steps 1-3 of onboarding
 * 3. When you reach Step 4, open DevTools (F12) → Console tab
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter to run
 * 6. Follow the testing instructions
 * 7. Copy ALL console output and send back
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c╔═══════════════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold;');
console.log('%c║  WEEK 11 DAY 4: ONBOARDING STEP 4 TEST                                    ║', 'color: #3b82f6; font-weight: bold;');
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
// TEST 1: VERIFY ON STEP 4
// ═══════════════════════════════════════════════════════════════════════════

function testOnStep4() {
  logSection('TEST 1: VERIFY ON STEP 4');
  
  // Check URL
  const isOnboardingPage = window.location.pathname.includes('complete-profile');
  if (!isOnboardingPage) {
    logTest('Onboarding page', 'fail', 'Not on /auth/complete-profile page');
    return false;
  }
  
  logTest('Onboarding page', 'pass', window.location.pathname);
  
  // Check for Step 4 heading
  const headings = Array.from(document.querySelectorAll('h2'));
  const step4Heading = headings.find(h => h.textContent.includes('Create Your First Project'));
  
  if (!step4Heading) {
    logTest('Step 4 heading', 'fail', 'Not on Step 4 - complete Steps 1-3 first');
    return false;
  }
  
  logTest('Step 4 heading', 'pass', 'Found "Create Your First Project"');
  
  // Check step indicator
  const stepIndicator = document.querySelector('[class*="step"]');
  if (stepIndicator) {
    logTest('Step indicator', 'pass', 'Step indicator visible');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: UI ELEMENTS PRESENT
// ═══════════════════════════════════════════════════════════════════════════

function testUIElements() {
  logSection('TEST 2: UI ELEMENTS PRESENT');
  
  // Project name input
  const projectNameInput = document.querySelector('#projectName') || 
                           document.querySelector('input[placeholder*="project name"]');
  
  if (projectNameInput) {
    logTest('Project name input', 'pass', `Value: "${projectNameInput.value}"`);
    
    // Check if pre-filled
    if (projectNameInput.value.trim()) {
      logTest('Project name pre-filled', 'pass', 'Smart suggestion applied');
    } else {
      logTest('Project name pre-filled', 'warn', 'Not pre-filled (may be intentional)');
    }
  } else {
    logTest('Project name input', 'fail', 'Input not found');
    return false;
  }
  
  // Research question textarea
  const questionTextarea = document.querySelector('#researchQuestion') || 
                           document.querySelector('textarea[placeholder*="question"]');
  
  if (questionTextarea) {
    logTest('Research question textarea', 'pass', `Rows: ${questionTextarea.rows}`);
  } else {
    logTest('Research question textarea', 'fail', 'Textarea not found');
    return false;
  }
  
  // Description textarea (optional)
  const descriptionTextarea = document.querySelector('#description') || 
                               document.querySelector('textarea[placeholder*="description"]');
  
  if (descriptionTextarea) {
    logTest('Description textarea', 'pass', 'Optional field present');
  } else {
    logTest('Description textarea', 'warn', 'Not found (may be optional)');
  }
  
  // Suggestion chips
  const suggestionButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.className.includes('blue') && btn.textContent.includes('Research')
  );
  
  if (suggestionButtons.length > 0) {
    logTest('Project name suggestions', 'pass', `${suggestionButtons.length} suggestions found`);
    console.log('   Suggestions:');
    suggestionButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. "${btn.textContent}"`);
    });
  } else {
    logTest('Project name suggestions', 'warn', 'No suggestions visible');
  }
  
  // Question examples
  const exampleButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('What are') || btn.textContent.includes('How can')
  );
  
  if (exampleButtons.length > 0) {
    logTest('Research question examples', 'pass', `${exampleButtons.length} examples found`);
    console.log('   Examples:');
    exampleButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. "${btn.textContent.substring(0, 60)}..."`);
    });
  } else {
    logTest('Research question examples', 'warn', 'No examples visible');
  }
  
  // Info box
  const infoBox = Array.from(document.querySelectorAll('div')).find(div => 
    div.className.includes('blue') && div.textContent.includes('Why create a project')
  );
  
  if (infoBox) {
    logTest('Info box', 'pass', 'Benefits explanation visible');
  } else {
    logTest('Info box', 'warn', 'Not found');
  }
  
  // Navigation buttons
  const backButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Back')
  );
  
  const createButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Create Project')
  );
  
  if (backButton) {
    logTest('Back button', 'pass');
  } else {
    logTest('Back button', 'fail', 'Not found');
  }
  
  if (createButton) {
    logTest('Create Project button', 'pass');
  } else {
    logTest('Create Project button', 'fail', 'Not found');
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: CHARACTER COUNTERS
// ═══════════════════════════════════════════════════════════════════════════

function testCharacterCounters() {
  logSection('TEST 3: CHARACTER COUNTERS');
  
  // Find all character counter elements
  const counters = Array.from(document.querySelectorAll('p')).filter(p => 
    p.textContent.includes('/') && (p.textContent.includes('500') || p.textContent.includes('1000'))
  );
  
  if (counters.length > 0) {
    logTest('Character counters', 'pass', `${counters.length} counters found`);
    counters.forEach((counter, i) => {
      console.log(`   ${i + 1}. ${counter.textContent}`);
    });
  } else {
    logTest('Character counters', 'warn', 'No counters visible');
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: MANUAL TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function showManualTests() {
  logSection('MANUAL TESTING INSTRUCTIONS');
  
  console.log('%c📋 Please perform the following manual tests:', 'color: #3b82f6; font-weight: bold;');
  console.log('');
  
  logTest('TEST 4A: Project Name Suggestions', 'manual');
  console.log('   1. Look at the project name input');
  console.log('   2. Should be pre-filled with a suggestion');
  console.log('   3. Click each suggestion chip below the input');
  console.log('   4. Project name should update to clicked suggestion');
  console.log('   5. Try typing your own project name');
  console.log('');
  
  logTest('TEST 4B: Research Question Examples', 'manual');
  console.log('   1. Look at the research question textarea');
  console.log('   2. Click each example button below the textarea');
  console.log('   3. Question should update to clicked example');
  console.log('   4. Try typing your own research question');
  console.log('');
  
  logTest('TEST 4C: Form Validation - Empty Fields', 'manual');
  console.log('   1. Clear the project name input');
  console.log('   2. Click "Create Project"');
  console.log('   3. Should show error: "Project name is required"');
  console.log('   4. Clear the research question');
  console.log('   5. Click "Create Project"');
  console.log('   6. Should show error: "Research question is required"');
  console.log('');
  
  logTest('TEST 4D: Form Validation - Length', 'manual');
  console.log('   1. Enter project name: "AB" (2 chars)');
  console.log('   2. Click "Create Project"');
  console.log('   3. Should show error: "must be at least 3 characters"');
  console.log('   4. Enter research question: "Short" (5 chars)');
  console.log('   5. Click "Create Project"');
  console.log('   6. Should show error: "must be at least 20 characters"');
  console.log('');
  
  logTest('TEST 4E: Character Counting', 'manual');
  console.log('   1. Type in research question textarea');
  console.log('   2. Watch character counter update in real-time');
  console.log('   3. Should show "X/500 characters"');
  console.log('   4. Try typing more than 500 characters');
  console.log('   5. Should show error when exceeding limit');
  console.log('');
  
  logTest('TEST 4F: Create Project (Success)', 'manual');
  console.log('   1. Fill in valid project name (3-100 chars)');
  console.log('   2. Fill in valid research question (20-500 chars)');
  console.log('   3. Optionally add description');
  console.log('   4. Click "Create Project"');
  console.log('   5. Should show loading spinner');
  console.log('   6. Should redirect to /project/{projectId}?onboarding=complete');
  console.log('   7. Check console for API calls');
  console.log('');
  
  logTest('TEST 4G: Back Navigation', 'manual');
  console.log('   1. Click "Back" button');
  console.log('   2. Should return to Step 3');
  console.log('   3. Click "Next" to return to Step 4');
  console.log('   4. Data should be preserved (if any was entered)');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: API MONITORING
// ═══════════════════════════════════════════════════════════════════════════

function setupAPIMonitoring() {
  logSection('TEST 5: API MONITORING');
  
  console.log('%c🔍 Monitoring API calls...', 'color: #3b82f6; font-weight: bold;');
  console.log('');
  console.log('When you click "Create Project", watch for:');
  console.log('');
  console.log('1. POST /api/proxy/projects');
  console.log('   Request body should include:');
  console.log('   {');
  console.log('     "name": "Your Project Name",');
  console.log('     "description": "Your Description",');
  console.log('     "settings": {');
  console.log('       "research_question": "Your Research Question"');
  console.log('     }');
  console.log('   }');
  console.log('');
  console.log('2. Response should include:');
  console.log('   {');
  console.log('     "project_id": "uuid-here",');
  console.log('     "name": "...",');
  console.log('     "settings": { "research_question": "..." }');
  console.log('   }');
  console.log('');
  console.log('3. Then: PUT /api/proxy/users/complete-registration');
  console.log('   Should include preferences with first_project_id');
  console.log('');
  console.log('4. Finally: Redirect to /project/{projectId}?onboarding=complete');
  console.log('');
  
  // Intercept fetch calls
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (url.includes('/projects') && options.method === 'POST') {
      console.log('%c📤 POST /api/proxy/projects', 'color: #10b981; font-weight: bold;');
      console.log('   Request:', JSON.parse(options.body || '{}'));
      
      const response = await originalFetch(...args);
      const clone = response.clone();
      const data = await clone.json();
      
      console.log('%c📥 Response:', 'color: #10b981; font-weight: bold;');
      console.log('   Status:', response.status);
      console.log('   Data:', data);
      
      return response;
    }
    
    if (url.includes('complete-registration')) {
      console.log('%c📤 PUT /api/proxy/users/complete-registration', 'color: #10b981; font-weight: bold;');
      console.log('   Request:', JSON.parse(options.body || '{}'));
      
      const response = await originalFetch(...args);
      const clone = response.clone();
      const data = await clone.json();
      
      console.log('%c📥 Response:', 'color: #10b981; font-weight: bold;');
      console.log('   Status:', response.status);
      console.log('   Data:', data);
      
      return response;
    }
    
    return originalFetch(...args);
  };
  
  logTest('API monitoring', 'pass', 'Fetch interceptor installed');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

function runAllTests() {
  console.log('%c🚀 Starting Onboarding Step 4 Tests...', 'color: #10b981; font-weight: bold;');
  console.log('');
  
  const test1 = testOnStep4();
  
  if (!test1) {
    console.log('');
    console.log('%c❌ Not on Step 4. Please complete Steps 1-3 first.', 'color: #ef4444; font-weight: bold;');
    console.log('');
    console.log('Steps to reach Step 4:');
    console.log('1. Navigate to /auth/complete-profile');
    console.log('2. Fill in Step 1 (personal information)');
    console.log('3. Fill in Step 2 (research interests - select topics)');
    console.log('4. Fill in Step 3 (first action)');
    console.log('5. Step 4 should appear');
    console.log('6. Run this script again');
    return;
  }
  
  const test2 = testUIElements();
  const test3 = testCharacterCounters();
  
  setupAPIMonitoring();
  showManualTests();
  
  // Summary
  logSection('TEST SUMMARY');
  
  console.log('');
  console.log('%cAUTOMATED TESTS:', 'color: #3b82f6; font-weight: bold;');
  console.log('   ✅ On Step 4:', test1 ? 'PASS' : 'FAIL');
  console.log('   ✅ UI Elements:', test2 ? 'PASS' : 'FAIL');
  console.log('   ✅ Character Counters:', test3 ? 'PASS' : 'FAIL');
  console.log('');
  
  if (test1 && test2) {
    console.log('%c✅ ALL AUTOMATED TESTS PASSED!', 'color: #10b981; font-weight: bold; font-size: 18px;');
  } else {
    console.log('%c⚠️  SOME AUTOMATED TESTS FAILED', 'color: #f59e0b; font-weight: bold; font-size: 18px;');
  }
  
  console.log('');
  console.log('%c📋 NEXT STEPS:', 'color: #3b82f6; font-weight: bold;');
  console.log('1. Complete all manual tests above (4A-4G)');
  console.log('2. Watch console for API calls when creating project');
  console.log('3. Verify redirect to project page after creation');
  console.log('4. Copy ALL console output');
  console.log('5. Send it back with your test results');
  console.log('');
}

// Run all tests
runAllTests();

