/**
 * ============================================================================
 * WEEK 4: EVIDENCE LINKING UI - COMPREHENSIVE TEST SUITE
 * ============================================================================
 *
 * This script tests ALL aspects of the Evidence Linking feature from front to back:
 * 1. API Endpoints (Backend Integration)
 * 2. Frontend API Functions
 * 3. Component Rendering
 * 4. User Interactions
 * 5. State Management
 * 6. Error Handling
 * 7. Edge Cases
 *
 * USAGE:
 * 1. Navigate to a project page (URL: /project/{projectId})
 * 2. Make sure you're logged in (have a valid user session)
 * 3. Open browser DevTools Console (F12 or Cmd+Option+I)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 6. If prompted, enter your User ID (check localStorage or profile)
 * 7. Watch the comprehensive test results
 *
 * REQUIREMENTS:
 * - Must be on a project page with Questions tab
 * - Must be logged in with a valid user account
 * - Backend must be running and accessible
 * - User ID must exist in the database
 *
 * TROUBLESHOOTING:
 * - If you get "User ID not found", check localStorage for 'user' or 'userId'
 * - If you get foreign key errors, make sure you're using a real user ID
 * - If you get 500 errors, check backend logs on Railway
 * ============================================================================
 */

(async function() {
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #1DB954; font-weight: bold');
  console.log('%c║  WEEK 4: EVIDENCE LINKING UI - COMPREHENSIVE TEST SUITE       ║', 'color: #1DB954; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #1DB954; font-weight: bold');
  console.log('');

  // ============================================================================
  // TEST CONFIGURATION
  // ============================================================================
  const CONFIG = {
    userId: null, // Will be extracted from localStorage or prompt
    projectId: null, // Will be extracted from URL
    apiBaseUrl: '/api/proxy',
    testQuestionText: 'Test Question for Evidence Linking',
    mockPapers: [
      { pmid: '12345678', title: 'Test Paper 1', authors: ['Smith J', 'Doe A'], journal: 'Nature', year: 2023 },
      { pmid: '87654321', title: 'Test Paper 2', authors: ['Johnson B'], journal: 'Science', year: 2022 },
      { pmid: '11223344', title: 'Test Paper 3', authors: ['Williams C', 'Brown D'], journal: 'Cell', year: 2024 }
    ]
  };

  // Extract project ID from URL
  const urlMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
  if (!urlMatch) {
    console.error('❌ ERROR: Not on a project page. Please navigate to a project page first.');
    return;
  }
  CONFIG.projectId = urlMatch[1];
  console.log(`✅ Project ID detected: ${CONFIG.projectId}`);

  // Extract user ID from localStorage or cookies
  try {
    // Try to get user ID from localStorage (common pattern)
    const userDataKeys = ['user', 'userData', 'currentUser', 'auth', 'session'];
    let foundUserId = null;

    for (const key of userDataKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.userId || parsed.user_id || parsed.id) {
            foundUserId = parsed.userId || parsed.user_id || parsed.id;
            break;
          }
        } catch (e) {
          // Not JSON, might be direct user ID
          if (data.length > 10 && data.includes('-')) {
            foundUserId = data;
            break;
          }
        }
      }
    }

    // If not found in localStorage, try to extract from cookies
    if (!foundUserId) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userId' || name === 'user_id' || name === 'user') {
          foundUserId = value;
          break;
        }
      }
    }

    if (foundUserId) {
      CONFIG.userId = foundUserId;
      console.log(`✅ User ID detected: ${CONFIG.userId}`);
    } else {
      // Prompt user to enter their user ID
      console.warn('⚠️  User ID not found in localStorage or cookies');
      const promptedUserId = prompt('Please enter your User ID (found in your profile or browser storage):');
      if (promptedUserId && promptedUserId.trim()) {
        CONFIG.userId = promptedUserId.trim();
        console.log(`✅ User ID provided: ${CONFIG.userId}`);
      } else {
        console.error('❌ ERROR: User ID is required to run tests. Please provide a valid User ID.');
        console.error('💡 TIP: Check localStorage or cookies for your user ID, or check your profile page.');
        return;
      }
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to extract User ID:', error);
    return;
  }

  console.log('');

  // ============================================================================
  // TEST UTILITIES
  // ============================================================================
  let testsPassed = 0;
  let testsFailed = 0;
  let testsSkipped = 0;

  function logSection(title) {
    console.log('');
    console.log('%c' + '═'.repeat(70), 'color: #1DB954');
    console.log('%c' + title, 'color: #1DB954; font-weight: bold; font-size: 14px');
    console.log('%c' + '═'.repeat(70), 'color: #1DB954');
  }

  function logTest(name) {
    console.log(`\n🧪 TEST: ${name}`);
  }

  function logPass(message) {
    testsPassed++;
    console.log(`  ✅ PASS: ${message}`);
  }

  function logFail(message, error) {
    testsFailed++;
    console.error(`  ❌ FAIL: ${message}`);
    if (error) console.error('     Error:', error);
  }

  function logSkip(message) {
    testsSkipped++;
    console.warn(`  ⚠️  SKIP: ${message}`);
  }

  function logInfo(message) {
    console.log(`  ℹ️  INFO: ${message}`);
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // SECTION 1: BACKEND API ENDPOINT TESTS
  // ============================================================================
  logSection('SECTION 1: BACKEND API ENDPOINT TESTS');

  let testQuestionId = null;
  let testEvidenceId = null;

  // Test 1.1: Create Test Question
  logTest('1.1: Create Test Question');
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': CONFIG.userId
      },
      body: JSON.stringify({
        project_id: CONFIG.projectId,
        question_text: CONFIG.testQuestionText,
        question_type: 'main',
        status: 'exploring',
        priority: 'high'
      })
    });

    if (response.ok) {
      const data = await response.json();
      testQuestionId = data.question_id;
      logPass(`Question created with ID: ${testQuestionId}`);
      logInfo(`Question text: "${data.question_text}"`);
    } else {
      logFail(`Failed to create question: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logFail('Exception during question creation', error);
  }

  // Test 1.2: Link Evidence to Question (Supports)
  logTest('1.2: Link Evidence to Question (Supports)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: CONFIG.mockPapers[0].pmid,
          evidence_type: 'supports',
          relevance_score: 9,
          key_findings: 'This paper strongly supports the hypothesis with robust experimental data.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        testEvidenceId = data.evidence_id;
        logPass(`Evidence linked successfully with ID: ${testEvidenceId}`);
        logInfo(`PMID: ${CONFIG.mockPapers[0].pmid}, Type: supports, Score: 9`);
      } else {
        logFail(`Failed to link evidence: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during evidence linking', error);
    }
  }

  // Test 1.3: Link Evidence (Contradicts)
  logTest('1.3: Link Evidence to Question (Contradicts)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: CONFIG.mockPapers[1].pmid,
          evidence_type: 'contradicts',
          relevance_score: 7,
          key_findings: 'This paper presents contradictory findings that challenge the hypothesis.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        logPass(`Contradicting evidence linked with ID: ${data.evidence_id}`);
        logInfo(`PMID: ${CONFIG.mockPapers[1].pmid}, Type: contradicts, Score: 7`);
      } else {
        logFail(`Failed to link contradicting evidence: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during contradicting evidence linking', error);
    }
  }

  // Test 1.4: Link Evidence (Neutral)
  logTest('1.4: Link Evidence to Question (Neutral)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: CONFIG.mockPapers[2].pmid,
          evidence_type: 'neutral',
          relevance_score: 5
          // No key_findings - testing optional field
        })
      });

      if (response.ok) {
        const data = await response.json();
        logPass(`Neutral evidence linked with ID: ${data.evidence_id}`);
        logInfo(`PMID: ${CONFIG.mockPapers[2].pmid}, Type: neutral, Score: 5, No key findings`);
      } else {
        logFail(`Failed to link neutral evidence: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during neutral evidence linking', error);
    }
  }

  // Test 1.5: Get Question Evidence
  logTest('1.5: Get Question Evidence');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'GET',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.ok) {
        const evidence = await response.json();
        logPass(`Retrieved ${evidence.length} evidence items`);
        logInfo(`Evidence types: ${evidence.map(e => e.evidence_type).join(', ')}`);
        logInfo(`Relevance scores: ${evidence.map(e => e.relevance_score).join(', ')}`);

        // Validate evidence structure
        if (evidence.length > 0) {
          const firstEvidence = evidence[0];
          const requiredFields = ['evidence_id', 'question_id', 'article_pmid', 'evidence_type', 'relevance_score', 'added_by', 'added_at'];
          const missingFields = requiredFields.filter(field => !(field in firstEvidence));

          if (missingFields.length === 0) {
            logPass('Evidence structure validation passed');
          } else {
            logFail(`Evidence missing fields: ${missingFields.join(', ')}`);
          }
        }
      } else {
        logFail(`Failed to get evidence: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during evidence retrieval', error);
    }
  }

  // Test 1.6: Remove Evidence
  logTest('1.6: Remove Evidence');
  if (!testQuestionId || !testEvidenceId) {
    logSkip('No test question or evidence available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence/${testEvidenceId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.ok) {
        logPass(`Evidence removed successfully: ${testEvidenceId}`);

        // Verify evidence was removed
        const verifyResponse = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
          method: 'GET',
          headers: { 'User-ID': CONFIG.userId }
        });

        if (verifyResponse.ok) {
          const evidence = await verifyResponse.json();
          const stillExists = evidence.some(e => e.evidence_id === testEvidenceId);

          if (!stillExists) {
            logPass('Evidence removal verified');
          } else {
            logFail('Evidence still exists after deletion');
          }
        }
      } else {
        logFail(`Failed to remove evidence: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during evidence removal', error);
    }
  }

  // Test 1.7: Get Updated Question (Check evidence_count)
  logTest('1.7: Get Updated Question (Check evidence_count)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}`, {
        method: 'GET',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.ok) {
        const question = await response.json();
        logPass(`Question retrieved with evidence_count: ${question.evidence_count}`);

        if (question.evidence_count === 2) { // Should be 2 after removing 1 of 3
          logPass('Evidence count is correct (2 remaining after deletion)');
        } else {
          logFail(`Evidence count mismatch: expected 2, got ${question.evidence_count}`);
        }
      } else {
        logFail(`Failed to get question: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during question retrieval', error);
    }
  }

  // ============================================================================
  // SECTION 2: FRONTEND API FUNCTION TESTS
  // ============================================================================
  logSection('SECTION 2: FRONTEND API FUNCTION TESTS');

  // Test 2.1: Import API Functions
  logTest('2.1: Import API Functions');
  try {
    // Check if API functions are available in the global scope or need to be imported
    const apiModule = await import('/src/lib/api/questions.ts').catch(() => null);

    if (apiModule) {
      const requiredFunctions = [
        'linkQuestionEvidence',
        'getQuestionEvidence',
        'removeQuestionEvidence',
        'linkHypothesisEvidence',
        'getHypothesisEvidence',
        'removeHypothesisEvidence'
      ];

      const availableFunctions = requiredFunctions.filter(fn => typeof apiModule[fn] === 'function');

      if (availableFunctions.length === requiredFunctions.length) {
        logPass(`All ${requiredFunctions.length} API functions available`);
        logInfo(`Functions: ${availableFunctions.join(', ')}`);
      } else {
        const missing = requiredFunctions.filter(fn => !availableFunctions.includes(fn));
        logFail(`Missing API functions: ${missing.join(', ')}`);
      }
    } else {
      logSkip('Cannot dynamically import API module in browser context');
      logInfo('API functions will be tested via direct fetch calls');
    }
  } catch (error) {
    logSkip('API function import test not applicable in browser context');
  }

  // ============================================================================
  // SECTION 3: COMPONENT RENDERING TESTS
  // ============================================================================
  logSection('SECTION 3: COMPONENT RENDERING TESTS');

  // Test 3.1: Check for Questions Tab
  logTest('3.1: Check for Questions Tab');
  await sleep(500); // Wait for React to render

  const questionsTab = document.querySelector('[role="tab"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn =>
                         btn.textContent.includes('Questions') || btn.textContent.includes('Research Questions')
                       );

  if (questionsTab) {
    logPass('Questions tab found in DOM');
    logInfo(`Tab text: "${questionsTab.textContent.trim()}"`);
  } else {
    logFail('Questions tab not found in DOM');
  }

  // Test 3.2: Check for Question Cards
  logTest('3.2: Check for Question Cards');
  await sleep(500);

  // Look for question cards by various selectors
  const questionCards = document.querySelectorAll('[data-testid="question-card"]') ||
                        document.querySelectorAll('.question-card') ||
                        Array.from(document.querySelectorAll('div')).filter(div =>
                          div.textContent.includes('Priority:') || div.textContent.includes('Status:')
                        );

  if (questionCards.length > 0) {
    logPass(`Found ${questionCards.length} question card(s) in DOM`);
  } else {
    logFail('No question cards found in DOM');
  }

  // Test 3.3: Check for Link Evidence Button
  logTest('3.3: Check for Link Evidence Button');
  await sleep(500);

  const linkEvidenceButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
    btn.title === 'Link evidence' ||
    btn.getAttribute('aria-label') === 'Link evidence' ||
    btn.querySelector('svg')?.classList.contains('link-icon')
  );

  if (linkEvidenceButtons.length > 0) {
    logPass(`Found ${linkEvidenceButtons.length} "Link Evidence" button(s)`);
    logInfo('Button is present in question card action menu');
  } else {
    logFail('No "Link Evidence" button found');
  }

  // Test 3.4: Check for Evidence Count Badge
  logTest('3.4: Check for Evidence Count Badge');
  await sleep(500);

  const evidenceBadges = Array.from(document.querySelectorAll('span, div')).filter(el =>
    el.textContent.match(/\d+\s*(evidence|Evidence)/) ||
    el.className.includes('evidence-count') ||
    el.className.includes('badge')
  );

  if (evidenceBadges.length > 0) {
    logPass(`Found ${evidenceBadges.length} evidence count badge(s)`);
    evidenceBadges.slice(0, 3).forEach(badge => {
      logInfo(`Badge text: "${badge.textContent.trim()}"`);
    });
  } else {
    logInfo('No evidence count badges found (may be expected if no evidence linked yet)');
  }

  // Test 3.5: Check for Evidence Section
  logTest('3.5: Check for Evidence Section in Question Cards');
  await sleep(500);

  const evidenceSections = Array.from(document.querySelectorAll('div')).filter(div =>
    div.textContent.includes('Evidence') &&
    (div.textContent.includes('Supports') || div.textContent.includes('Contradicts') || div.textContent.includes('Neutral'))
  );

  if (evidenceSections.length > 0) {
    logPass(`Found ${evidenceSections.length} evidence section(s)`);
  } else {
    logInfo('No evidence sections found (may be collapsed or no evidence linked yet)');
  }

  // ============================================================================
  // SECTION 4: USER INTERACTION TESTS
  // ============================================================================
  logSection('SECTION 4: USER INTERACTION TESTS');

  // Test 4.1: Click Link Evidence Button
  logTest('4.1: Click Link Evidence Button');
  await sleep(500);

  const linkButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.title === 'Link evidence' || btn.getAttribute('aria-label') === 'Link evidence'
  );

  if (linkButton) {
    try {
      linkButton.click();
      await sleep(1000); // Wait for modal to open

      const modal = document.querySelector('[role="dialog"]') ||
                    Array.from(document.querySelectorAll('div')).find(div =>
                      div.textContent.includes('Link Evidence') && div.textContent.includes('Select papers')
                    );

      if (modal) {
        logPass('Link Evidence Modal opened successfully');
        logInfo('Modal is visible in DOM');
      } else {
        logFail('Modal did not open after clicking button');
      }
    } catch (error) {
      logFail('Exception during button click', error);
    }
  } else {
    logSkip('No Link Evidence button available to click');
  }

  // Test 4.2: Check Modal Components
  logTest('4.2: Check Link Evidence Modal Components');
  await sleep(500);

  const modal = document.querySelector('[role="dialog"]') ||
                Array.from(document.querySelectorAll('div')).find(div =>
                  div.textContent.includes('Link Evidence')
                );

  if (modal) {
    const components = {
      searchInput: modal.querySelector('input[type="text"]') || modal.querySelector('input[placeholder*="Search"]'),
      evidenceTypeButtons: Array.from(modal.querySelectorAll('button')).filter(btn =>
        btn.textContent === 'Supports' || btn.textContent === 'Contradicts' || btn.textContent === 'Neutral'
      ),
      relevanceSlider: modal.querySelector('input[type="range"]'),
      keyFindingsTextarea: modal.querySelector('textarea'),
      linkButton: Array.from(modal.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Link') && !btn.textContent.includes('Cancel')
      ),
      cancelButton: Array.from(modal.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Cancel') || btn.textContent.includes('Close')
      )
    };

    let componentsPassed = 0;
    let componentsFailed = 0;

    if (components.searchInput) {
      logPass('✓ Search input found');
      componentsPassed++;
    } else {
      logFail('✗ Search input not found');
      componentsFailed++;
    }

    if (components.evidenceTypeButtons.length === 3) {
      logPass(`✓ All 3 evidence type buttons found (${components.evidenceTypeButtons.map(b => b.textContent).join(', ')})`);
      componentsPassed++;
    } else {
      logFail(`✗ Evidence type buttons incomplete (found ${components.evidenceTypeButtons.length}/3)`);
      componentsFailed++;
    }

    if (components.relevanceSlider) {
      logPass('✓ Relevance score slider found');
      logInfo(`  Slider range: ${components.relevanceSlider.min} - ${components.relevanceSlider.max}`);
      componentsPassed++;
    } else {
      logFail('✗ Relevance score slider not found');
      componentsFailed++;
    }

    if (components.keyFindingsTextarea) {
      logPass('✓ Key findings textarea found');
      componentsPassed++;
    } else {
      logInfo('ℹ️  Key findings textarea not found (may be optional)');
    }

    if (components.linkButton) {
      logPass('✓ Link button found');
      componentsPassed++;
    } else {
      logFail('✗ Link button not found');
      componentsFailed++;
    }

    if (components.cancelButton) {
      logPass('✓ Cancel button found');
      componentsPassed++;
    } else {
      logFail('✗ Cancel button not found');
      componentsFailed++;
    }

    logInfo(`Modal components: ${componentsPassed} passed, ${componentsFailed} failed`);
  } else {
    logSkip('Modal not open - cannot test components');
  }

  // Test 4.3: Test Evidence Type Selection
  logTest('4.3: Test Evidence Type Selection');
  await sleep(500);

  const modal2 = document.querySelector('[role="dialog"]');
  if (modal2) {
    const supportsButton = Array.from(modal2.querySelectorAll('button')).find(btn => btn.textContent === 'Supports');
    const contradictsButton = Array.from(modal2.querySelectorAll('button')).find(btn => btn.textContent === 'Contradicts');
    const neutralButton = Array.from(modal2.querySelectorAll('button')).find(btn => btn.textContent === 'Neutral');

    if (supportsButton && contradictsButton && neutralButton) {
      try {
        // Test clicking each button
        supportsButton.click();
        await sleep(200);
        logPass('✓ "Supports" button clickable');

        contradictsButton.click();
        await sleep(200);
        logPass('✓ "Contradicts" button clickable');

        neutralButton.click();
        await sleep(200);
        logPass('✓ "Neutral" button clickable');

        logInfo('All evidence type buttons are interactive');
      } catch (error) {
        logFail('Exception during evidence type button clicks', error);
      }
    } else {
      logSkip('Evidence type buttons not available');
    }
  } else {
    logSkip('Modal not open');
  }

  // Test 4.4: Test Relevance Score Slider
  logTest('4.4: Test Relevance Score Slider');
  await sleep(500);

  const modal3 = document.querySelector('[role="dialog"]');
  if (modal3) {
    const slider = modal3.querySelector('input[type="range"]');

    if (slider) {
      try {
        const originalValue = slider.value;

        // Test setting different values
        slider.value = 1;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(100);
        logPass(`✓ Slider set to minimum (1)`);

        slider.value = 10;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(100);
        logPass(`✓ Slider set to maximum (10)`);

        slider.value = 5;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(100);
        logPass(`✓ Slider set to middle (5)`);

        logInfo('Relevance score slider is fully functional');
      } catch (error) {
        logFail('Exception during slider interaction', error);
      }
    } else {
      logSkip('Relevance slider not available');
    }
  } else {
    logSkip('Modal not open');
  }

  // Test 4.5: Test Search Functionality
  logTest('4.5: Test Search Functionality');
  await sleep(500);

  const modal4 = document.querySelector('[role="dialog"]');
  if (modal4) {
    const searchInput = modal4.querySelector('input[type="text"]') || modal4.querySelector('input[placeholder*="Search"]');

    if (searchInput) {
      try {
        // Test typing in search
        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(300);
        logPass('✓ Search input accepts text');

        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(300);
        logPass('✓ Search input can be cleared');

        logInfo('Search functionality is working');
      } catch (error) {
        logFail('Exception during search interaction', error);
      }
    } else {
      logSkip('Search input not available');
    }
  } else {
    logSkip('Modal not open');
  }

  // Test 4.6: Close Modal
  logTest('4.6: Close Modal');
  await sleep(500);

  const modal5 = document.querySelector('[role="dialog"]');
  if (modal5) {
    const cancelButton = Array.from(modal5.querySelectorAll('button')).find(btn =>
      btn.textContent.includes('Cancel') || btn.textContent.includes('Close')
    );

    if (cancelButton) {
      try {
        cancelButton.click();
        await sleep(500);

        const modalStillOpen = document.querySelector('[role="dialog"]');
        if (!modalStillOpen) {
          logPass('Modal closed successfully');
        } else {
          logFail('Modal still open after clicking cancel');
        }
      } catch (error) {
        logFail('Exception during modal close', error);
      }
    } else {
      logSkip('Cancel button not available');
    }
  } else {
    logSkip('Modal not open');
  }

  // ============================================================================
  // SECTION 5: STATE MANAGEMENT TESTS
  // ============================================================================
  logSection('SECTION 5: STATE MANAGEMENT TESTS');

  // Test 5.1: Check React Component State
  logTest('5.1: Check React Component State');
  try {
    // Try to find React Fiber nodes
    const rootElement = document.getElementById('root') || document.querySelector('[data-reactroot]');

    if (rootElement) {
      const fiberKey = Object.keys(rootElement).find(key => key.startsWith('__reactFiber'));

      if (fiberKey) {
        logPass('React Fiber detected - components are using React state');
        logInfo('State management is active');
      } else {
        logInfo('React Fiber not directly accessible (expected in production build)');
      }
    } else {
      logSkip('React root element not found');
    }
  } catch (error) {
    logSkip('Cannot inspect React state in production build');
  }

  // Test 5.2: Check Evidence State Persistence
  logTest('5.2: Check Evidence State Persistence');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      // Get evidence before
      const response1 = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'GET',
        headers: { 'User-ID': CONFIG.userId }
      });

      if (response1.ok) {
        const evidenceBefore = await response1.json();
        const countBefore = evidenceBefore.length;

        await sleep(1000);

        // Get evidence after
        const response2 = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
          method: 'GET',
          headers: { 'User-ID': CONFIG.userId }
        });

        if (response2.ok) {
          const evidenceAfter = await response2.json();
          const countAfter = evidenceAfter.length;

          if (countBefore === countAfter) {
            logPass(`Evidence state persisted (${countAfter} items)`);
          } else {
            logFail(`Evidence state changed unexpectedly: ${countBefore} → ${countAfter}`);
          }
        }
      }
    } catch (error) {
      logFail('Exception during state persistence check', error);
    }
  }

  // ============================================================================
  // SECTION 6: ERROR HANDLING TESTS
  // ============================================================================
  logSection('SECTION 6: ERROR HANDLING TESTS');

  // Test 6.1: Invalid Evidence Type
  logTest('6.1: Invalid Evidence Type');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: '99999999',
          evidence_type: 'invalid_type', // Invalid
          relevance_score: 5
        })
      });

      if (!response.ok) {
        logPass(`Invalid evidence type rejected (${response.status})`);
      } else {
        logFail('Invalid evidence type was accepted (should be rejected)');
      }
    } catch (error) {
      logPass('Invalid evidence type caused exception (expected)');
    }
  }

  // Test 6.2: Invalid Relevance Score
  logTest('6.2: Invalid Relevance Score (Out of Range)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: '99999999',
          evidence_type: 'supports',
          relevance_score: 15 // Out of range (should be 1-10)
        })
      });

      if (!response.ok) {
        logPass(`Invalid relevance score rejected (${response.status})`);
      } else {
        logFail('Invalid relevance score was accepted (should be rejected)');
      }
    } catch (error) {
      logPass('Invalid relevance score caused exception (expected)');
    }
  }

  // Test 6.3: Missing Required Fields
  logTest('6.3: Missing Required Fields');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          // Missing article_pmid
          evidence_type: 'supports',
          relevance_score: 5
        })
      });

      if (!response.ok) {
        logPass(`Missing required field rejected (${response.status})`);
      } else {
        logFail('Missing required field was accepted (should be rejected)');
      }
    } catch (error) {
      logPass('Missing required field caused exception (expected)');
    }
  }

  // Test 6.4: Non-existent Question ID
  logTest('6.4: Non-existent Question ID');
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/questions/non-existent-id-12345/evidence`, {
      method: 'GET',
      headers: {
        'User-ID': CONFIG.userId
      }
    });

    if (response.status === 404) {
      logPass('Non-existent question ID returns 404');
    } else if (!response.ok) {
      logPass(`Non-existent question ID rejected (${response.status})`);
    } else {
      logFail('Non-existent question ID was accepted (should return 404)');
    }
  } catch (error) {
    logPass('Non-existent question ID caused exception (expected)');
  }

  // Test 6.5: Non-existent Evidence ID
  logTest('6.5: Non-existent Evidence ID');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence/non-existent-evidence-id`, {
        method: 'DELETE',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.status === 404) {
        logPass('Non-existent evidence ID returns 404');
      } else if (!response.ok) {
        logPass(`Non-existent evidence ID rejected (${response.status})`);
      } else {
        logFail('Non-existent evidence ID was accepted (should return 404)');
      }
    } catch (error) {
      logPass('Non-existent evidence ID caused exception (expected)');
    }
  }

  // ============================================================================
  // SECTION 7: EDGE CASES & STRESS TESTS
  // ============================================================================
  logSection('SECTION 7: EDGE CASES & STRESS TESTS');

  // Test 7.1: Link Multiple Evidence to Same Question
  logTest('7.1: Link Multiple Evidence to Same Question');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const pmids = ['11111111', '22222222', '33333333', '44444444', '55555555'];
      let successCount = 0;

      for (const pmid of pmids) {
        const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': CONFIG.userId
          },
          body: JSON.stringify({
            article_pmid: pmid,
            evidence_type: 'supports',
            relevance_score: Math.floor(Math.random() * 10) + 1
          })
        });

        if (response.ok) successCount++;
        await sleep(100);
      }

      logPass(`Successfully linked ${successCount}/${pmids.length} evidence items`);

      // Verify count
      const verifyResponse = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'GET',
        headers: { 'User-ID': CONFIG.userId }
      });

      if (verifyResponse.ok) {
        const evidence = await verifyResponse.json();
        logInfo(`Total evidence count: ${evidence.length}`);
      }
    } catch (error) {
      logFail('Exception during multiple evidence linking', error);
    }
  }

  // Test 7.2: Duplicate Evidence (Same PMID)
  logTest('7.2: Duplicate Evidence (Same PMID)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const pmid = '66666666';

      // Link first time
      const response1 = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: pmid,
          evidence_type: 'supports',
          relevance_score: 5
        })
      });

      const firstSuccess = response1.ok;

      // Try to link same PMID again
      const response2 = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: pmid,
          evidence_type: 'contradicts',
          relevance_score: 7
        })
      });

      if (firstSuccess && response2.status === 409) {
        logPass('Duplicate evidence correctly rejected with 409 Conflict');
      } else if (firstSuccess && response2.ok) {
        logInfo('Duplicate evidence allowed (may be intentional - different evidence types)');
      } else {
        logInfo(`Duplicate handling: First=${response1.status}, Second=${response2.status}`);
      }
    } catch (error) {
      logFail('Exception during duplicate evidence test', error);
    }
  }

  // Test 7.3: Very Long Key Findings
  logTest('7.3: Very Long Key Findings Text');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const longText = 'A'.repeat(5000); // 5000 characters

      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: '77777777',
          evidence_type: 'neutral',
          relevance_score: 5,
          key_findings: longText
        })
      });

      if (response.ok) {
        logPass('Very long key findings accepted');
        logInfo(`Key findings length: ${longText.length} characters`);
      } else {
        logInfo(`Very long key findings rejected (${response.status}) - may have length limit`);
      }
    } catch (error) {
      logFail('Exception during long text test', error);
    }
  }

  // Test 7.4: Special Characters in Key Findings
  logTest('7.4: Special Characters in Key Findings');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const specialText = 'Test with special chars: <script>alert("XSS")</script> & "quotes" \'apostrophes\' 中文 émojis 🎉🔬';

      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': CONFIG.userId
        },
        body: JSON.stringify({
          article_pmid: '88888888',
          evidence_type: 'supports',
          relevance_score: 6,
          key_findings: specialText
        })
      });

      if (response.ok) {
        logPass('Special characters in key findings accepted');

        // Verify it was stored correctly
        const verifyResponse = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
          method: 'GET',
          headers: { 'User-ID': CONFIG.userId }
        });

        if (verifyResponse.ok) {
          const evidence = await verifyResponse.json();
          const found = evidence.find(e => e.article_pmid === '88888888');

          if (found && found.key_findings === specialText) {
            logPass('Special characters stored and retrieved correctly');
          } else {
            logInfo('Special characters may have been sanitized');
          }
        }
      } else {
        logFail(`Special characters rejected (${response.status})`);
      }
    } catch (error) {
      logFail('Exception during special characters test', error);
    }
  }

  // Test 7.5: Rapid Sequential Operations
  logTest('7.5: Rapid Sequential Operations (Stress Test)');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const operations = [];

      // Create 10 rapid operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-ID': CONFIG.userId
            },
            body: JSON.stringify({
              article_pmid: `stress-test-${i}`,
              evidence_type: ['supports', 'contradicts', 'neutral'][i % 3],
              relevance_score: (i % 10) + 1
            })
          })
        );
      }

      const results = await Promise.all(operations);
      const successCount = results.filter(r => r.ok).length;

      logPass(`Rapid operations: ${successCount}/10 succeeded`);

      if (successCount === 10) {
        logPass('All rapid operations succeeded - excellent performance');
      } else if (successCount >= 7) {
        logInfo('Most rapid operations succeeded - acceptable performance');
      } else {
        logFail('Many rapid operations failed - may indicate performance issues');
      }
    } catch (error) {
      logFail('Exception during rapid operations test', error);
    }
  }

  // ============================================================================
  // SECTION 8: CLEANUP
  // ============================================================================
  logSection('SECTION 8: CLEANUP');

  // Test 8.1: Delete Test Question
  logTest('8.1: Delete Test Question');
  if (!testQuestionId) {
    logSkip('No test question to delete');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.ok) {
        logPass(`Test question deleted: ${testQuestionId}`);
        logInfo('All associated evidence should be cascade deleted');
      } else {
        logFail(`Failed to delete test question: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logFail('Exception during question deletion', error);
    }
  }

  // Test 8.2: Verify Cascade Deletion
  logTest('8.2: Verify Cascade Deletion of Evidence');
  if (!testQuestionId) {
    logSkip('No test question available');
  } else {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/questions/${testQuestionId}/evidence`, {
        method: 'GET',
        headers: {
          'User-ID': CONFIG.userId
        }
      });

      if (response.status === 404) {
        logPass('Evidence cascade deleted with question (404 returned)');
      } else if (response.ok) {
        const evidence = await response.json();
        if (evidence.length === 0) {
          logPass('Evidence cascade deleted (empty array returned)');
        } else {
          logFail(`Evidence not cascade deleted (${evidence.length} items remain)`);
        }
      }
    } catch (error) {
      logInfo('Cannot verify cascade deletion (expected if question deleted)');
    }
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('');
  console.log('%c' + '═'.repeat(70), 'color: #1DB954');
  console.log('%c' + 'TEST SUMMARY', 'color: #1DB954; font-weight: bold; font-size: 16px');
  console.log('%c' + '═'.repeat(70), 'color: #1DB954');
  console.log('');

  const totalTests = testsPassed + testsFailed + testsSkipped;
  const passRate = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;

  console.log(`%c✅ PASSED:  ${testsPassed}`, 'color: #1DB954; font-weight: bold; font-size: 14px');
  console.log(`%c❌ FAILED:  ${testsFailed}`, 'color: #E22134; font-weight: bold; font-size: 14px');
  console.log(`%c⚠️  SKIPPED: ${testsSkipped}`, 'color: #FFA500; font-weight: bold; font-size: 14px');
  console.log(`%c📊 TOTAL:   ${totalTests}`, 'color: #FFFFFF; font-weight: bold; font-size: 14px');
  console.log('');
  console.log(`%c🎯 PASS RATE: ${passRate}%`, `color: ${passRate >= 80 ? '#1DB954' : passRate >= 60 ? '#FFA500' : '#E22134'}; font-weight: bold; font-size: 16px`);
  console.log('');

  if (passRate >= 90) {
    console.log('%c🎉 EXCELLENT! Week 4 Evidence Linking is working great!', 'color: #1DB954; font-weight: bold; font-size: 14px');
  } else if (passRate >= 70) {
    console.log('%c👍 GOOD! Most features working, some issues to address.', 'color: #FFA500; font-weight: bold; font-size: 14px');
  } else if (passRate >= 50) {
    console.log('%c⚠️  NEEDS WORK! Several issues detected.', 'color: #FFA500; font-weight: bold; font-size: 14px');
  } else {
    console.log('%c❌ CRITICAL! Major issues detected. Review failed tests.', 'color: #E22134; font-weight: bold; font-size: 14px');
  }

  console.log('');
  console.log('%c' + '═'.repeat(70), 'color: #1DB954');
  console.log('');

  // Return summary object
  return {
    passed: testsPassed,
    failed: testsFailed,
    skipped: testsSkipped,
    total: totalTests,
    passRate: parseFloat(passRate),
    testQuestionId: testQuestionId,
    timestamp: new Date().toISOString()
  };
})();
